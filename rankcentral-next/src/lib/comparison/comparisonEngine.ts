// src/lib/comparison/comparisonEngine.ts
import { DocumentComparator } from './documentComparator';

interface Document {
	[key: string]: string;
}

interface Criterion {
	id: string;
	name: string;
	description: string;
	weight: number;
	scoringLevels?: Record<number, string>;
	isCustomPrompt?: boolean;
}

interface ComparisonResult {
	documentA: string;
	documentB: string;
	winner: string | null;
	error?: string;
	evaluationDetails?: any;
	criterionScores?: any;
}

export class ComparisonEngine {
	documents: Document;
	criteria: Criterion[];
	openaiApiKey: string;
	pdfProcessor: any;
	useCustomPrompt: boolean;
	comparisonResults: ComparisonResult[] = [];
	documentComparator: DocumentComparator;
	modelName: string;

	constructor(
		documents: Document,
		criteria: Criterion[],
		openaiApiKey: string,
		pdfProcessor: any = null,
		useCustomPrompt: boolean = false,
		modelName: string = 'gpt-4.1-mini'
	) {
		this.documents = documents;
		this.criteria = criteria;
		this.openaiApiKey = openaiApiKey;
		this.pdfProcessor = pdfProcessor;
		this.useCustomPrompt = useCustomPrompt;
		this.modelName = modelName;

		this.validateApiKey();

		this.documentComparator = new DocumentComparator(
			documents,
			criteria,
			openaiApiKey,
			pdfProcessor,
			useCustomPrompt,
			modelName
		);
	}

	validateApiKey(): boolean {
		const isValid = typeof this.openaiApiKey === 'string' && this.openaiApiKey.length > 20;
		if (!isValid) {
			console.warn(`WARNING: API key appears invalid (length: ${this.openaiApiKey.length})`);
		}
		return isValid;
	}

	async compareDocuments(doc1: string, doc2: string): Promise<ComparisonResult> {
		console.log(`\nComparing ${doc1} vs ${doc2}...`);

		const existingResult = this.findExistingComparison(doc1, doc2);
		if (existingResult) {
			console.log(`Using cached comparison for ${doc1} vs ${doc2}`);
			return existingResult;
		}

		try {
			const result = await this.documentComparator.compare(doc1, doc2);
			this.comparisonResults.push(result);
			return result;
		} catch (error) {
			const typedError = error as Error;
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
				const invertedResult = { ...result };
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

	async comparisonFunction(doc1: string, doc2: string): Promise<number> {
		if (doc1 === doc2) return 0;

		const result = await this.compareDocuments(doc1, doc2);

		if (result.error) {
			console.log(`Error in comparison: ${result.error}`);
			return 0;
		}

		if ((await result).winner === 'Tie' || result.winner === null) {
			return 0;
		} else if ((await result).winner === doc1) {
			return 1;
		} else {
			return -1;
		}
	}

	async compareWithMergesort(documents: string[]): Promise<string[]> {
		const startTime = Date.now();
		console.log(`Starting comparison of ${documents.length} documents using merge sort...`);

		if (documents.length <= 1) {
            return documents;
        }

        const sortedDocs = await this.mergesortWithComparator(
            documents,
            (a, b) => this.comparisonFunction(a, b)
        );

		const endTime = Date.now();
		const duration = (endTime - startTime) / 1000;
		console.log(`Comparison completed in ${duration.toFixed(2)} seconds`);
		console.log(`Final ranking: ${sortedDocs}`);

		return sortedDocs;
	}

	async mergesortWithComparator(
		items: string[],
		comparator: (a: string, b: string) => Promise<number>
	): Promise<string[]> {
		if (items.length <= 1) return items;

		const mid = Math.floor(items.length / 2);
		const left = await this.mergesortWithComparator(items.slice(0, mid), comparator);
		const right = await this.mergesortWithComparator(items.slice(mid), comparator);

		return this.mergeWithComparator(left, right, comparator);
	}

	async mergeWithComparator(
		left: string[],
		right: string[],
		comparator: (a: string, b: string) => Promise<number>
	): Promise<string[]> {
		const result: string[] = [];
		let i = 0;
		let j = 0;

		while (i < left.length && j < right.length) {
			const cmp = await comparator(left[i], right[j]);
			if (cmp >= 0) {
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
