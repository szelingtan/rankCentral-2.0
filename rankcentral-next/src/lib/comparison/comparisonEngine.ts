// src/lib/comparison/comparisonEngine.ts
import { DocumentComparator } from './documentComparator';
import { PDFProcessor } from './pdfProcessor';
import { ComparisonResult, Criterion } from './types';

export class ComparisonEngine {
	documents: Record<string, string>;
	criteria: Criterion[];
	openaiApiKey: string;
	pdfProcessor: any;
	useCustomPrompt: boolean;
	comparisonResults: ComparisonResult[] = [];
	documentComparator: DocumentComparator;
	modelName: string;

	constructor(
		documents: Record<string, string>,
		criteria: Criterion[],
		openaiApiKey: string,
		pdfProcessor = new PDFProcessor(),
		useCustomPrompt = false,
		modelName = 'gpt-4.1-mini'
	) {
		this.documents = documents;
		this.criteria = criteria;
		this.openaiApiKey = openaiApiKey;
		this.pdfProcessor = pdfProcessor;
		this.useCustomPrompt = useCustomPrompt;
		this.modelName = modelName;

		// Validate API key
		this.validateApiKey();

		// Initialize document comparator
		this.documentComparator = new DocumentComparator(
			documents, criteria, openaiApiKey, pdfProcessor, useCustomPrompt, modelName
		);
	}

	validateApiKey(): boolean {
		const isValid = (
			typeof this.openaiApiKey === 'string' &&
			this.openaiApiKey.length > 20
		);

		if (!isValid) {
			console.warn(`WARNING: API key appears invalid (length: ${this.openaiApiKey.length})`);
		}

		return isValid;
	}

	async compareDocuments(doc1: string, doc2: string): Promise<ComparisonResult> {
		console.log(`\nComparing ${doc1} vs ${doc2}...`);

		try {
			const existingResult = this.findExistingComparison(doc1, doc2);
			if (existingResult) {
				console.log(`Using cached comparison for ${doc1} vs ${doc2}`);
				return existingResult;
			}

			const result = await this.documentComparator.compare(doc1, doc2);
			this.comparisonResults.push(result);
			return result;
		} catch (error) {
			const typedError = error instanceof Error ? error : new Error('Unknown error');
			const errorMsg = `Error comparing ${doc1} vs ${doc2}: ${typedError.message}`;
			console.error(errorMsg);

			const errorResult: ComparisonResult = {
				documentA: doc1,
				documentB: doc2,
				winner: null,
				error: errorMsg
			};

			this.comparisonResults.push(errorResult);
			return errorResult;
		}
	}

	findExistingComparison(doc1: string, doc2: string): ComparisonResult | null {
		for (const result of this.comparisonResults) {
			if (result.documentA === doc1 && result.documentB === doc2) {
				return result;
			}

			if (result.documentA === doc2 && result.documentB === doc1) {
				const invertedResult: ComparisonResult = { ...result };
				invertedResult.documentA = doc1;
				invertedResult.documentB = doc2;

				if (result.winner === result.documentA) {
					invertedResult.winner = doc1;
				} else if (result.winner === result.documentB) {
					invertedResult.winner = doc2;
				}

				return invertedResult;
			}
		}

		return null;
	}

	async compareWithMergesort(documents: string[]): Promise<string[]> {
		const startTime = Date.now();
		console.log(`Starting comparison of ${documents.length} documents using merge sort...`);

		if (documents.length <= 1) {
			return documents;
		}

		const comparator = async (doc1: string, doc2: string): Promise<number> => this.comparisonFunction(doc1, doc2);

		const sortedDocs = await this.mergesortWithComparator(documents, comparator);

		const endTime = Date.now();
		const duration = (endTime - startTime) / 1000;
		console.log(`Comparison completed in ${duration.toFixed(2)} seconds`);
		console.log(`Final ranking: ${sortedDocs}`);

		return sortedDocs;
	}

	// Update comparisonFunction to handle asynchronous calls
	async comparisonFunction(doc1: string, doc2: string): Promise<number> {
		if (doc1 === doc2) {
			return 0;
		}

		try {
			const result = await this.compareDocuments(doc1, doc2);

			if (result.error) {
				console.log(`Error in comparison: ${result.error}`);
				return 0;
			}

			if (result.winner === "Tie" || result.winner === null) {
				return 0;
			} else if (result.winner === doc1) {
				return 1;
			} else {
				return -1;
			}
		} catch (error) {
			console.error(`Error during comparison: ${error}`);
			return 0;
		}
	}

	// Update mergesortWithComparator to handle asynchronous comparator
	async mergesortWithComparator(
		items: string[],
		comparator: (a: string, b: string) => Promise<number>
	): Promise<string[]> {
		if (items.length <= 1) {
			return items;
		}

		const mid = Math.floor(items.length / 2);
		const leftHalf = await this.mergesortWithComparator(items.slice(0, mid), comparator);
		const rightHalf = await this.mergesortWithComparator(items.slice(mid), comparator);

		return this.mergeWithComparator(leftHalf, rightHalf, comparator);
	}

	// Update mergeWithComparator to handle asynchronous comparator
	async mergeWithComparator(
		left: string[],
		right: string[],
		comparator: (a: string, b: string) => Promise<number>
	): Promise<string[]> {
		const result: string[] = [];
		let i = 0;
		let j = 0;

		while (i < left.length && j < right.length) {
			const comparisonResult = await comparator(left[i], right[j]);

			if (comparisonResult >= 0) {
				result.push(left[i]);
				i++;
			} else {
				result.push(right[j]);
				j++;
			}
		}

		return [...result, ...left.slice(i), ...right.slice(j)];
	}
}
