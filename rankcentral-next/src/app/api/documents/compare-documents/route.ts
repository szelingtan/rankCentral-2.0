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
import { ReportGenerator } from '@/lib/comparison/reportGenerator';

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
			// Validate and set criteria data
			if (!criteriaData || criteriaData.length === 0) {
				console.log("No criteria provided, using default criteria");
				const defaultCriteria = criteriaManager.getCriteriaFromUser();
				console.log(`✅ Using ${defaultCriteria.length} default criteria`);
			} else {
				console.log(`Setting ${criteriaData.length} custom criteria`);
				criteriaManager.criteria = criteriaData;
				// Validate and fix criteria issues
				const validatedCriteria = criteriaManager.getCriteriaFromUser();
				console.log(`✅ Validated ${validatedCriteria.length} criteria - total weight: ${validatedCriteria.reduce((sum, c) => sum + c.weight, 0)}%`);
			}
		} else {
			criteriaManager.criteria = [{
				id: "custom",
				name: "Custom Evaluation",
				description: customPrompt,
				weight: 100,
				isCustomPrompt: true
			}];
		}

		// Process documents using the streamlined PDF processor
		console.log(`\n🔄 Processing ${documentsData.length} documents...`);
		const documentInputs = documentsData.map((doc: any) => ({
			displayName: doc.displayName,
			content: doc.content
		}));
		
		const pdfContents = await pdfProcessor.processDocuments(documentInputs);

		console.log(`\n📋 Final document contents summary:`);
		for (const [name, content] of Object.entries(pdfContents)) {
			console.log(`  - ${name}: ${content.length} characters`);
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

		// Generate CSV reports using ReportGenerator
		const reportGenerator = new ReportGenerator();
		const reportData = await reportGenerator.generateReport(
			docList,
			comparisonEngine.comparisonResults,
			reportName || "Report",
			results // Pass the merge sort results directly to generate report
		);
		
		// Convert the report data into CSV files - pass the sorted documents order for unified ranking
		const csvFiles = reportGenerator.createCsvFiles(reportData, reportName || "csv_reports", results, comparisonEngine.comparisonResults);
		
		// Format the CSV files for MongoDB storage - convert from array of objects to array of formatted objects
		const formattedCsvFiles = csvFiles.map(csvFile => {
			// Each csvFile is an object with a single key-value pair (filename:content)
			const filename = Object.keys(csvFile)[0];
			const content = csvFile[filename];
			return { filename, content };
		});

		const reportId = getReportId();
		const timestamp = new Date().toISOString();
		const conn = await connectToDatabase();

		if (conn) {
			try {
				const reportsCollection = conn.db.collection('reports');

				const apiKeyStatus = apiKey.length > 20
					? "Valid API key"
					: "Invalid or missing API key";

				const reportDocument = {
					user_id: userId,
					report_id: reportId,
					timestamp: timestamp,
					documents: docList,
					top_ranked: results[0] || null,
					csv_files: formattedCsvFiles,  // Store CSV files in the formatted structure
					criteria_count: criteriaManager.criteria.length,
					evaluation_method: evaluationMethod,
					custom_prompt: evaluationMethod === 'prompt' ? customPrompt : "",
					report_name: reportName || `Report ${new Date().toISOString().split('T')[0]}`,
					api_key_status: apiKeyStatus,
					ranking: results // <-- Always store the ranking array
				};

				await reportsCollection.insertOne(reportDocument);

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
