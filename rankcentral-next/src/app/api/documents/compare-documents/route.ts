// src/app/api/documents/compare/route.ts

import dotenv from 'dotenv';

import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import { PDFProcessor } from '@/lib/comparison/pdfProcessor';
import { CriteriaManager } from '@/lib/comparison/criteriaManager';
import { ComparisonEngine } from '@/lib/comparison/comparisonEngine';
import { getReportId } from '@/lib/utils/report-utils';
import { ReportGenerator } from '@/lib/comparison/reportGenerator';

// Simple upload directory that doesn't require user authentication
const uploadDir = path.join(process.cwd(), 'tmp', 'uploads');

export async function POST(req: NextRequest): Promise<NextResponse> {
	try {
		// Force reload environment variables (equivalent to load_dotenv(override=True))
		dotenv.config({ override: true });
		
		const data = await req.json();

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
		
		// Add debugging to verify the API key is loaded
		console.log('Environment reload check:');
		console.log('OPENAI_API_KEY exists:', !!apiKey);
		console.log('OPENAI_API_KEY length:', apiKey?.length || 0);
		console.log('OPENAI_API_KEY first 4 chars:', apiKey?.slice(0, 4) || 'NONE');
		
		if (!apiKey) {
			console.error("ERROR: OpenAI API key not found in environment variables");
			return NextResponse.json(
				{ error: 'OpenAI API key not configured' },
				{ status: 401 }
			);
		}

		// Ensure upload directory exists
		if (!fs.existsSync(uploadDir)) {
			fs.mkdirSync(uploadDir, { recursive: true });
		}

		const pdfProcessor = new PDFProcessor();
		const criteriaManager = new CriteriaManager();

		// Add criteria to the manager using the correct method
		if (evaluationMethod === 'criteria') {
			criteriaData.forEach((criterion: { name: string; weight: number; description: string }) => {
				criteriaManager.addCriterion(criterion.name, criterion.description, criterion.weight);
			});
		}

		// If no criteria provided or using prompt method, use default criteria
		if (criteriaManager.criteria.length === 0) {
			criteriaManager.criteria = criteriaManager.defaultCriteria;
		}

		console.log(`Processing ${documentsData.length} documents...`);

		const documentsMap: { [key: string]: string } = {};
		const docList: string[] = [];

		// Process documents
		for (const doc of documentsData) {
			let documentContent = '';

			// Handle base64 PDF content
			if (doc.content && doc.content.startsWith('data:application/pdf;base64,')) {
				try {
					const base64Data = doc.content.split(',')[1];
					const tempFileName = `temp_${Date.now()}_${Math.random().toString(36).substring(2)}.pdf`;
					const tempFilePath = path.join(uploadDir, tempFileName);

					const buffer = Buffer.from(base64Data, 'base64');
					fs.writeFileSync(tempFilePath, buffer);

					// Read the file as ArrayBuffer for PDFProcessor
					const fileBuffer = fs.readFileSync(tempFilePath);
					const arrayBuffer = fileBuffer.buffer.slice(fileBuffer.byteOffset, fileBuffer.byteOffset + fileBuffer.byteLength);
					documentContent = await pdfProcessor.extractTextFromPDF(arrayBuffer);

					// Clean up temporary file
					fs.unlinkSync(tempFilePath);
				} catch (error) {
					console.error(`Error processing PDF for ${doc.displayName}:`, error);
					documentContent = `Error processing PDF: ${error}`;
				}
			} else {
				// Handle plain text content
				documentContent = doc.content || '';
			}

			const docName = doc.displayName || `Document ${docList.length + 1}`;
			documentsMap[docName] = documentContent;
			docList.push(docName);
		}

		// Create comparison engine with proper constructor parameters
		const comparisonEngine = new ComparisonEngine(
			documentsMap,
			criteriaManager.criteria,
			apiKey,
			pdfProcessor,
			evaluationMethod === 'prompt' // useCustomPrompt
		);

		// Perform comparison using the correct method
		const results = await comparisonEngine.compareWithMergesort(docList);

		console.log("Comparison completed. Results:", results);

		// Generate CSV files for the report
		const reportGenerator = new ReportGenerator();
		const reportData = await reportGenerator.generateReport(
			docList,
			comparisonEngine.comparisonResults,
			reportName || "Report",
			results
		);
		const csvFiles = reportGenerator.createCsvFiles(reportData, "csv_reports", results);

		// Format the CSV files for response - fix the typing
		const formattedCsvFiles = csvFiles.map((csvFile: Record<string, string>) => {
			const filename = Object.keys(csvFile)[0];
			const content = csvFile[filename];
			return { filename, content };
		});

		const reportId = getReportId();
		const timestamp = new Date().toISOString();

		const apiKeyStatus = apiKey.length > 20
			? "Valid API key"
			: "Invalid or missing API key";

		// Return report data for client-side storage
		const reportDocument = {
			_id: reportId,
			report_id: reportId,
			timestamp: timestamp,
			documents: docList,
			top_ranked: results[0] || null,
			csv_files: formattedCsvFiles,
			criteria_count: criteriaManager.criteria.length,
			evaluation_method: evaluationMethod,
			custom_prompt: evaluationMethod === 'prompt' ? customPrompt : "",
			report_name: reportName || `Report ${new Date().toISOString().split('T')[0]}`,
			api_key_status: apiKeyStatus,
			ranking: results
		};

		return NextResponse.json({
			success: true,
			message: "Comparison completed successfully",
			ranked_documents: results,
			comparison_details: comparisonEngine.comparisonResults,
			report_id: reportId,
			report_data: reportDocument
		});
	} catch (error: any) {
		console.error("Error in document comparison:", error);
		return NextResponse.json(
			{ 
				error: "An error occurred during document comparison",
				details: error.message || "Unknown error"
			},
			{ status: 500 }
		);
	}
}
