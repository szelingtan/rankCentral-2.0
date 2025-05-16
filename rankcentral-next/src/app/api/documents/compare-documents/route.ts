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
import { connectToDatabase } from '@/lib/db/mongodb';
import { getReportId } from '@/lib/utils/report-utils';
import { ReportGenerator } from '@/lib/comparison';

const uploadDir = await getUploadDir();

export async function POST(req: NextRequest): Promise<NextResponse> {
	try {
		const session = await getServerSession(authOptions);
		if (!session?.user) {
			return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
		}

		const userId = session.user.id;
		const data = await req.json();

		const id = data.id;
		const criteriaData = data.criteria || [];
		const evaluationMethod = data.evaluationMethod || 'criteria';
		const customPrompt = data.customPrompt || '';
		const documentsData = data.documents || [];
		const reportName = data.reportName || '';

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

		const pdfProcessor = new PDFProcessor();
		const criteriaManager = new CriteriaManager();

		if (evaluationMethod === 'criteria') {
			criteriaManager.criteria = criteriaData;
		} else {
			criteriaManager.criteria = [{
				id: "custom",
				name: "Custom Evaluation",
				description: customPrompt,
				weight: 100,
				isCustomPrompt: true
			}];
		}

		const pdfContents: Record<string, string> = {};
		for (const doc of documentsData) {
			console.log(doc)
			const docName = doc.displayName;
			const docContent = doc.content;

			if (
				docContent.startsWith('data:application/pdf;base64') ||
				(docContent.length > 100 && !/^[a-zA-Z]/.test(docContent.trim().substring(0, 20)))
			) {
				try {
					console.log(`Processing base64 PDF: ${docName}`);
					const extractedText = await pdfProcessor.loadBase64PDF(docName, docContent);
					pdfContents[docName] = extractedText;
					console.log(`Loaded base64 PDF: ${docName} (${extractedText.length} characters)`);
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

		console.log(comparisonEngine)

		const reportGenerator = new ReportGenerator();
		// const reportData = await reportGenerator.generateReport();

		const docList = Object.keys(pdfContents);
		const results = await comparisonEngine.compareWithMergesort(docList);

		const reportId = getReportId();
		const timestamp = new Date().toISOString();
		const conn = await connectToDatabase();

		if (conn) {
			try {
				const reportsCollection = conn.db.collection('reports');

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
			success: true,
			message: "Comparison completed successfully",
			ranked_documents: results,
			comparison_details: comparisonEngine.comparisonResults,
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
