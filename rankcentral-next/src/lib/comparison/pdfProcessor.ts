// src/lib/comparison/pdfProcessor.ts
import { PDFDocument } from 'pdf-lib';

interface DocumentSections {
	[criterion: string]: string;
}

interface CriteriaSections {
	[documentName: string]: DocumentSections;
}

export class PDFProcessor {
	pdfContents: Record<string, string> = {};
	extractedCriteria: Record<string, any> = {};
	criteriaSections: CriteriaSections = {};

	constructor() {
		this.pdfContents = {};
		this.extractedCriteria = {};
		this.criteriaSections = {};
	}

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

	async extractTextFromPDF(arrayBuffer: ArrayBuffer): Promise<string> {
		try {
			const pdfDoc = await PDFDocument.load(arrayBuffer);
			return `[PDF content with ${pdfDoc.getPageCount()} pages]`;
		} catch (error) {
			throw new Error(`Error extracting text from PDF: ${error instanceof Error ? error.message : 'Unknown error'}`);
		}
	}

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

	private base64ToArrayBuffer(base64: string): ArrayBuffer {
		const binaryString = window.atob(base64);
		const bytes = new Uint8Array(binaryString.length);
		for (let i = 0; i < binaryString.length; i++) {
			bytes[i] = binaryString.charCodeAt(i);
		}
		return bytes.buffer;
	}

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
