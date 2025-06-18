/**
 * PDF processing utility for extracting and analyzing document content.
 * Uses PyPDF2 via Python subprocess for clean and reliable text extraction.
 */

import { execSync } from 'child_process';
import path from 'path';

/**
 * Interface for document inputs during processing
 */
export interface DocumentInput {
	displayName: string;
	content: string;
}

/**
 * Utility class for processing PDF documents and extracting text content.
 * Provides methods for loading PDFs, extracting text, and managing document content.
 */
export class PDFProcessor {
	private documentTexts: Record<string, string> = {};

	constructor() {
		this.documentTexts = {};
	}

	/**
	 * Process multiple documents (PDFs or text) and extract their content
	 */
	async processDocuments(documents: DocumentInput[]): Promise<Record<string, string>> {
		console.log(`Processing ${documents.length} documents...`);
		
		const results: Record<string, string> = {};
		
		for (const doc of documents) {
			try {
				console.log(`Processing: ${doc.displayName}`);
				
				if (this.isPDFContent(doc.content)) {
					console.log(`Detected PDF content for ${doc.displayName}`);
					const extractedText = await this.extractTextFromPDF(doc.content, doc.displayName);
					results[doc.displayName] = extractedText;
					this.documentTexts[doc.displayName] = extractedText;
					console.log(`Extracted ${extractedText.length} characters from PDF`);
				} else {
					console.log(`Processing as text content for ${doc.displayName}`);
					results[doc.displayName] = doc.content;
					this.documentTexts[doc.displayName] = doc.content;
					console.log(`Processed ${doc.content.length} characters of text`);
				}
			} catch (error) {
				console.error(`Error processing ${doc.displayName}:`, error);
				results[doc.displayName] = doc.content;
				this.documentTexts[doc.displayName] = doc.content;
			}
		}
		
		return results;
	}

	/**
	 * Determines if content is a PDF based on format indicators
	 */
	private isPDFContent(content: string): boolean {
		return (
			content.startsWith('data:application/pdf;base64') ||
			(content.length > 100 && !/^[a-zA-Z]/.test(content.trim().substring(0, 20)))
		);
	}

	/**
	 * Extract text from PDF content (base64 encoded) using PyPDF2
	 */
	async extractTextFromPDF(pdfContent: string, filename: string): Promise<string> {
		try {
			console.log(`Extracting text from PDF: ${filename}`);
			
			let base64Content = pdfContent;
			if (pdfContent.includes(',')) {
				base64Content = pdfContent.split(',')[1];
			}

			// Call Python script for PDF extraction
			const scriptPath = path.join(process.cwd(), 'src', 'lib', 'utils', 'pdf-extractor.py');
			const command = `python3 "${scriptPath}" "${base64Content}"`;
			
			console.log(`Running PyPDF2 extraction for ${filename}`);
			const output = execSync(command, { 
				encoding: 'utf8',
				maxBuffer: 10 * 1024 * 1024 // 10MB buffer for large PDFs
			});
			
			const result = JSON.parse(output);
			
			if (!result.success) {
				throw new Error(result.error || 'PDF extraction failed');
			}
			
			const extractedText = result.text;
			const metadata = result.metadata;
			
			if (!extractedText || extractedText.trim().length === 0) {
				console.warn(`PDF appears to be empty or contains no extractable text: ${filename}`);
				throw new Error(`PDF with ${metadata.page_count || 0} pages contains no extractable text`);
			}
			
			this.validateTextQuality(extractedText, metadata.page_count || 1, filename);
			
			console.log(`Successfully extracted ${extractedText.length} characters from ${filename} (${metadata.page_count} pages, ${metadata.word_count} words)`);
			return extractedText;
		} catch (error) {
			console.error(`Error extracting text from PDF ${filename}:`, error);
			throw new Error(`Error extracting text from PDF ${filename}: ${error instanceof Error ? error.message : 'Unknown error'}`);
		}
	}


	/**
	 * Validates the quality of extracted text
	 */
	private validateTextQuality(text: string, pageCount: number, filename: string): void {
		const wordCount = text.split(/\s+/).length;
		const avgWordsPerPage = wordCount / pageCount;
		
		if (wordCount < 10) {
			throw new Error(`Extracted text is too short (${wordCount} words) - may be a scanned PDF requiring OCR`);
		}
		
		if (avgWordsPerPage < 20) {
			console.warn(`Low text density detected for ${filename} (${avgWordsPerPage.toFixed(1)} words/page)`);
		}
		
		console.log(`Text quality validation passed for ${filename}: ${wordCount} words, ${avgWordsPerPage.toFixed(1)} words/page`);
	}

	/**
	 * Get all processed document texts
	 */
	getAllDocumentTexts(): Record<string, string> {
		return { ...this.documentTexts };
	}

	/**
	 * Get text content for a specific document
	 */
	getDocumentText(documentName: string): string {
		return this.documentTexts[documentName] || '';
	}

	/**
	 * Check if a document has been processed
	 */
	hasDocument(documentName: string): boolean {
		return documentName in this.documentTexts;
	}
}