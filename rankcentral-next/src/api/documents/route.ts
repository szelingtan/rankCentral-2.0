// src/app/api/documents/compare/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import fs from 'fs';
import path from 'path';
import { PDFProcessor } from '@/lib/comparison/pdfProcessor';
import { CriteriaManager } from '@/lib/comparison/criteriaManager';
import { ComparisonEngine } from '@/lib/comparison/comparisonEngine';
import { getUploadDir } from '@/lib/utils/file-utils';
import { db } from '@/lib/db/mongodb';
import { getReportId } from '@/lib/utils/report-utils';

const uploadDir = getUploadDir();

export async function POST(req: NextRequest) {
	try {
		const session = await getServerSession(authOptions);
		if (!session?.user) {
			return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
		}

		const userId = session.user.id;
		const data = await req.json();

		const criteriaData = data.criteria || [];
		const evaluationMethod = data.evaluation_method || 'criteria';
		const customPrompt = data.custom_prompt || '';
		const documentsData = data.documents || [];
		const reportName = data.report_name || '';

		if (!documentsData || documentsData.length < 2) {
			return NextResponse.json(
				{ error: 'Provide at least two documents for comparison' },
				{ status: 400 }
			);
		}

		const apiKey = process.env.OPENAI_API_KEY;
		if (!apiKey) {
			console.error("ERROR: OpenAI API key not found in environment variables");
			return NextResponse.json(
				{ error: 'OpenAI API key not configured' },
				{ status: 401 }
			);
		}

		const userUploadDir = path.join(uploadDir, userId);
		if (!fs.existsSync(userUploadDir)) {
			fs.mkdirSync(userUploadDir, { recursive: true });
		}

		const pdfProcessor = new PDFProcessor(userUploadDir);
		const criteriaManager = new CriteriaManager();

		if (evaluationMethod === 'criteria') {
			criteriaManager.criteria = criteriaData;
		} else {
			criteriaManager.criteria = [{
				id: "custom",
				name: "Custom Evaluation",
				description: customPrompt,
				weight: 100,
				is_custom_prompt: true
			}];
		}

		const pdfContents: Record<string, string> = {};
		for (const doc of documentsData) {
			const docName = doc.name;
			const docContent = doc.content;

			if (
				docContent.startsWith('data:application/pdf;base64,') ||
				(docContent.length > 100 && !/^[a-zA-Z]/.test(docContent.trim().substring(0, 20)))
			) {
				try {
					const extractedText = await pdfProcessor.loadBase64PDF(docName, docContent);
					pdfContents[docName] = extractedText;
				} catch (e) {
					console.error(`Error processing base64 PDF: ${e}`);
					pdfContents[docName] = docContent;
				}
			} else {
				pdfContents[docName] = docContent;
			}
		}

		const comparisonEngine = new ComparisonEngine(
			pdfContents,
			criteriaManager.criteria,
			apiKey,
			pdfProcessor,
			evaluationMethod === 'prompt'
		);

		const docList = Object.keys(pdfContents);
		const results = await comparisonEngine.compareWithMergesort(docList);

		const reportId = getReportId();
		const timestamp = new Date().toISOString();

		if (db) {
			try {
				const reportsCollection = db.collection('reports');

				const apiKeyStatus = apiKey.length > 20
					? "Valid API key"
					: "Invalid or missing API key";

				const reportData = {
					user_id: userId,
					report_id: reportId,
					timestamp: timestamp,
					documents: docList,
					top_ranked: results[0] || null,
					criteria_count: criteriaManager.criteria.length,
					evaluation_method: evaluationMethod,
					custom_prompt: evaluationMethod === 'prompt' ? customPrompt : "",
					report_name: reportName || `Report ${new Date().toISOString().split('T')[0]}`,
					api_key_status: apiKeyStatus
				};

				await reportsCollection.insertOne(reportData);

				const allReports = await reportsCollection
					.find({ user_id: userId })
					.sort({ timestamp: -1 })
					.toArray();

				if (allReports.length > 5) {
					const reportsToDelete = allReports.slice(5);
					const reportIds = reportsToDelete.map(report => report._id);
					await reportsCollection.deleteMany({ _id: { $in: reportIds } });
				}
			} catch (e) {
				console.error(`Error storing report history: ${e}`);
			}
		}

		return NextResponse.json({
			message: "Comparison completed successfully",
			ranked_documents: results,
			comparison_details: comparisonEngine.comparison_results,
			report_id: reportId
		});
	} catch (error) {
		console.error("Error in document comparison:", error);
		return NextResponse.json(
			{ error: `Error during comparison: ${error}` },
			{ status: 500 }
		);
	}
}
