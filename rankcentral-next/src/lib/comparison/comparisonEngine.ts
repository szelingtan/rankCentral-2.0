/**
 * @fileoverview Document comparison engine that orchestrates document ranking using AI-powered comparisons.
 * Implements merge sort algorithm with async comparisons for scalable document ranking.
 */

// src/lib/comparison/comparisonEngine.ts
import { DocumentComparator } from './documentComparator';
import { PDFProcessor } from './pdfProcessor';
import { ComparisonResult, Criterion } from './types';

/**
 * Main engine for comparing and ranking documents using AI-powered analysis.
 * Implements merge sort with asynchronous comparisons for efficient document ranking.
 * @class ComparisonEngine
 */
export class ComparisonEngine {
	/** @type {Record<string, string>} Map of document names to their content */
	documents: Record<string, string>;
	/** @type {Criterion[]} Array of criteria for document evaluation */
	criteria: Criterion[];
	/** @type {string} OpenAI API key for AI-powered comparisons */
	openaiApiKey: string;
	/** @type {PDFProcessor} PDF processing utility */
	pdfProcessor: PDFProcessor;
	/** @type {boolean} Whether to use custom prompt for comparisons */
	useCustomPrompt: boolean;
	/** @type {ComparisonResult[]} Cache of completed comparisons */
	comparisonResults: ComparisonResult[] = [];
	/** @type {DocumentComparator} Core comparison logic handler */
	documentComparator: DocumentComparator;
	/** @type {string} AI model name to use for comparisons */
	modelName: string;

	/**
	 * Creates a new ComparisonEngine instance.
	 * @param {Record<string, string>} documents - Map of document names to content
	 * @param {Criterion[]} criteria - Array of evaluation criteria
	 * @param {string} openaiApiKey - OpenAI API key
	 * @param {PDFProcessor} [pdfProcessor=new PDFProcessor()] - PDF processing utility
	 * @param {boolean} [useCustomPrompt=false] - Whether to use custom prompt
	 * @param {string} [modelName='gpt-4.1-mini'] - AI model to use
	 */
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

	/**
	 * Validates the provided OpenAI API key format.
	 * @returns {boolean} True if API key appears valid, false otherwise
	 */
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

	/**
	 * Compares two documents and returns the comparison result.
	 * Uses caching to avoid redundant comparisons.
	 * @async
	 * @param {string} doc1 - Name of the first document
	 * @param {string} doc2 - Name of the second document
	 * @returns {Promise<ComparisonResult>} Result of the comparison
	 */
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

	/**
	 * Finds an existing comparison result in the cache.
	 * Checks both forward and reverse comparisons.
	 * @param {string} doc1 - Name of the first document
	 * @param {string} doc2 - Name of the second document
	 * @returns {ComparisonResult|null} Cached result if found, null otherwise
	 */
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

	/**
	 * Ranks documents using merge sort algorithm with async comparisons.
	 * @async
	 * @param {string[]} documents - Array of document names to rank
	 * @returns {Promise<string[]>} Array of document names in ranked order (best to worst)
	 */
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

	/**
	 * Comparison function for merge sort that determines which document ranks higher.
	 * @async
	 * @param {string} doc1 - Name of the first document
	 * @param {string} doc2 - Name of the second document
	 * @returns {Promise<number>} 1 if doc1 wins, -1 if doc2 wins, 0 for tie
	 */
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

	/**
	 * Asynchronous merge sort implementation for document ranking.
	 * @async
	 * @param {string[]} items - Array of items to sort
	 * @param {function} comparator - Async comparison function
	 * @returns {Promise<string[]>} Sorted array
	 */
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

	/**
	 * Merges two sorted arrays using async comparator function.
	 * @async
	 * @param {string[]} left - Left sorted array
	 * @param {string[]} right - Right sorted array
	 * @param {function} comparator - Async comparison function
	 * @returns {Promise<string[]>} Merged sorted array
	 */
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
