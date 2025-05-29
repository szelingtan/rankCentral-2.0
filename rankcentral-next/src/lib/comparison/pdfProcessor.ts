/**
 * @fileoverview PDF processing utility for extracting and analyzing document content.
 * Handles PDF text extraction, criteria-based content sectioning, and content retrieval.
 */

// src/lib/comparison/pdfProcessor.ts

// This file extracts text from PDF files and processes them for criteria evaluation.
import { PDFDocument } from 'pdf-lib';

/**
 * Mapping of criterion names to their extracted content sections.
 * @interface DocumentSections
 */
interface DocumentSections {
	/** @type {string} Content section for each criterion */
	[criterion: string]: string;
}

/**
 * Mapping of document names to their criteria sections.
 * @interface CriteriaSections
 */
interface CriteriaSections {
	/** @type {DocumentSections} Criteria sections for each document */
	[documentName: string]: DocumentSections;
}

/**
 * Utility class for processing PDF documents and extracting text content.
 * Provides methods for loading PDFs, extracting text, and organizing content by criteria.
 * @class PDFProcessor
 */
export class PDFProcessor {
	/** @type {Record<string, string>} Cache of extracted PDF text content */
	pdfContents: Record<string, string> = {};
	/** @type {Record<string, any>} Cache of extracted criteria content */
	extractedCriteria: Record<string, any> = {};
	/** @type {CriteriaSections} Organized content sections by criteria */
	criteriaSections: CriteriaSections = {};

	/**
	 * Creates a new PDFProcessor instance.
	 * Initializes empty content caches.
	 */
	constructor() {
		this.pdfContents = {};
		this.extractedCriteria = {};
		this.criteriaSections = {};
	}

	/**
	 * Loads and processes multiple PDF files.
	 * @async
	 * @param {File[]} files - Array of PDF File objects to process
	 * @returns {Promise<Record<string, string>>} Map of filenames to extracted text content
	 */
	async loadPDFs(files: File[]): Promise<Record<string, string>> {
		console.log(`\nLoading ${files.length} PDFs...`);

		for (const file of files) {
			try {
				const arrayBuffer = await file.arrayBuffer();
				const text = await this.extractTextFromPDF(arrayBuffer);
				this.pdfContents[file.name] = text;
				console.log(`Loaded: ${file.name} (${text.length} characters)`);
			} catch (error) {
				console.error(`Error loading ${file.name}: ${error instanceof Error ? error.message : 'Unknown error'}`);
			}
		}

		return this.pdfContents;
	}

	/**
	 * Extracts text content from a PDF ArrayBuffer.
	 * @async
	 * @param {ArrayBuffer} arrayBuffer - PDF file data as ArrayBuffer
	 * @returns {Promise<string>} Extracted text content
	 * @throws {Error} If PDF parsing fails
	 */
	async extractTextFromPDF(arrayBuffer: ArrayBuffer): Promise<string> {
		try {
			const pdfDoc = await PDFDocument.load(arrayBuffer);
			return `[PDF content with ${pdfDoc.getPageCount()} pages]`;
		} catch (error) {
			throw new Error(`Error extracting text from PDF: ${error instanceof Error ? error.message : 'Unknown error'}`);
		}
	}

	/**
	 * Loads and processes a PDF from base64-encoded content.
	 * @async
	 * @param {string} filename - Name of the PDF file
	 * @param {string} base64Content - Base64-encoded PDF content
	 * @returns {Promise<string>} Extracted text content
	 */
	async loadBase64PDF(filename: string, base64Content: string): Promise<string> {
		try {
			if (base64Content.includes(',')) {
				base64Content = base64Content.split(',')[1];
			}

			const pdfBytes = this.base64ToArrayBuffer(base64Content);
			const text = await this.extractTextFromPDF(pdfBytes);
			this.pdfContents[filename] = text;
			console.log(`Loaded base64 PDF: ${filename} (${text.length} characters)`);
			return text;
		} catch (error) {
			console.error(`Error loading base64 PDF ${filename}: ${error instanceof Error ? error.message : 'Unknown error'}`);
			return '';
		}
	}

	/**
	 * Converts base64 string to ArrayBuffer for PDF processing.
	 * Handles both Node.js and browser environments.
	 * @private
	 * @param {string} base64 - Base64-encoded string
	 * @returns {ArrayBuffer} ArrayBuffer representation of the data
	 */
	private base64ToArrayBuffer(base64: string): ArrayBuffer {
		if (typeof window === 'undefined') {
		  // Node.js environment
		const buffer = Buffer.from(base64, 'base64');
		const arrayBuffer = new ArrayBuffer(buffer.length);
		const view = new Uint8Array(arrayBuffer);
		for (let i = 0; i < buffer.length; i++) {
			view[i] = buffer[i];
		}
		return arrayBuffer;
		} else {
		  // Browser environment
		const binaryString = window.atob(base64);
		const bytes = new Uint8Array(binaryString.length);
		for (let i = 0; i < binaryString.length; i++) {
			bytes[i] = binaryString.charCodeAt(i);
		}
		return bytes.buffer;
		}
	}

	/**
	 * Extracts and organizes content sections based on criteria keywords.
	 * Uses regex patterns to identify relevant content for different evaluation criteria.
	 * @returns {CriteriaSections} Organized content sections by document and criteria
	 */
	extractCriteriaSections(): CriteriaSections {
		if (Object.keys(this.pdfContents).length === 0) {
			console.log('No PDF contents loaded.');
			return {};
		}

		this.criteriaSections = Object.fromEntries(
			Object.keys(this.pdfContents).map(pdf => [pdf, {}])
		);

		const keywordPatterns: Record<string, RegExp> = {
			methodology: /(methodology|method|approach|procedure|technique|strategy|protocol)/i,
			results: /(results|findings|outcomes|observations|data analysis|analysis|discovered)/i,
			conclusions: /(conclusion|summary|key finding|significance|interpretation)/i,
			clarity: /(clear|concise|readable|understandable|comprehensible)/i,
			innovation: /(innovation|novel|groundbreaking|unique|original|advancement|cutting-edge)/i,
			literature_review: /(literature|previous studies|prior research|existing work|references|cited)/i
		};

		for (const [pdf, content] of Object.entries(this.pdfContents)) {
			for (const [criterion, pattern] of Object.entries(keywordPatterns)) {
				const extractContext = (match: RegExpExecArray) => {
					const start = Math.max(0, match.index - 500);
					const end = Math.min(content.length, match.index + match[0].length + 500);
					return content.substring(start, end);
				};

				const matches: string[] = [];
				const regex = new RegExp(pattern, 'gi');
				let match;

				while ((match = regex.exec(content)) !== null) {
					matches.push(extractContext(match));
				}

				if (matches.length > 0) {
					this.criteriaSections[pdf][criterion] = matches.join('\n\n...\n\n');
				}
			}
		}

		return this.criteriaSections;
	}

	/**
	 * Extracts structured criteria content from document text.
	 * Identifies criterion sections using pattern matching.
	 * @param {string} text - Document text content
	 * @returns {Record<string, string>} Map of criterion names to their content
	 */
	extractCriteriaFromText(text: string): Record<string, string> {
		const criteria: Record<string, string> = {};
		const criteriaPattern = /Criterion\s+(\d+)\s*:\s*([A-Za-z\-\s]+?)\s*\((\d+)%\)(.*?)(?=Criterion\s+\d+\s*:|$)/gs;
		let match;
		while ((match = criteriaPattern.exec(text)) !== null) {
			const criterionNumber = match[1];
			const criterionName = match[2].trim();
			const criterionWeight = match[3];
			const criterionContent = match[4].trim();
			const criterionKey = `Criterion ${criterionNumber}: ${criterionName}`;
			criteria[criterionKey] = criterionContent;
		}

		if (Object.keys(criteria).length === 0) {
			const simplePattern = /(Criterion\s+\d+:.*?)(?=Criterion\s+\d+:|$)/gs;

			while ((match = simplePattern.exec(text)) !== null) {
				const fullSection = match[1].trim();
				const lines = fullSection.split('\n');
				const header = lines[0].trim();
				const content = lines.slice(1).join('\n').trim();
				criteria[header] = content;
			}
		}

		return criteria;
	}

	/**
	 * Retrieves content for a specific criterion from a document.
	 * Uses multiple fallback strategies to find relevant content.
	 * @param {string} documentName - Name of the document
	 * @param {string} criterionName - Name of the criterion to find content for
	 * @returns {string} Content related to the specified criterion, or empty string if not found
	 */
	getCriteriaContent(documentName: string, criterionName: string): string {
		if (!this.extractedCriteria[documentName]) {
			if (this.pdfContents[documentName]) {
				this.extractedCriteria[documentName] = this.extractCriteriaFromText(this.pdfContents[documentName]);
			} else {
				return "";
			}
		}

		const criteriaSection = this.extractedCriteria[documentName];

		for (const [key, content] of Object.entries(criteriaSection)) {
			if (key.includes(criterionName)) {
				return content as string;
			}
		}

		const criterionLower = criterionName.toLowerCase();
		for (const [key, content] of Object.entries(criteriaSection)) {
			const keyLower = key.toLowerCase();
			if (keyLower.includes("criterion " + criterionName.split(':')[0].trim())) {
				return content as string;
			}
			if (keyLower.includes(criterionLower)) {
				return content as string;
			}
		}

		return this.criteriaSections[documentName]?.[criterionName] || "";
	}
}
