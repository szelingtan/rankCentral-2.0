/**
 * @fileoverview Document comparison engine that handles pairwise document evaluations.
 * Manages the comparison process between documents using various criteria and AI-powered
 * evaluation methods. Supports both criteria-based and custom prompt evaluation modes.
 */

// src/lib/comparison/documentComparator.ts
import { encode } from 'gpt-tokenizer';
import { CriterionEvaluator } from './criterionEvaluator';
import { PromptGenerator } from './promptGenerator';
import { 
	ComparisonResult, 
	CriterionEvaluation, 
	Criterion 
} from './types';
import { PDFProcessor } from './pdfProcessor';

/**
 * Main class for comparing documents using AI-powered evaluation.
 * Handles pairwise document comparisons with support for multiple criteria
 * and custom prompt-based evaluations.
 * 
 * @class DocumentComparator
 */
export class DocumentComparator {
	/** @type {Record<string, string>} Map of document names to their text content */
	documents: Record<string, string>;
	
	/** @type {Criterion[]} Array of evaluation criteria for document comparison */
	criteria: Criterion[];
	
	/** @type {string} OpenAI API key for AI-powered evaluations */
	openaiApiKey: string;
	
	/** @type {PDFProcessor} PDF processor instance for document text extraction */
	pdfProcessor: PDFProcessor;
	
	/** @type {boolean} Flag indicating whether to use custom prompt evaluation */
	useCustomPrompt: boolean;
	
	/** @type {string} AI model name to use for evaluations */
	modelName: string;
	
	/** @type {CriterionEvaluator} Component for evaluating individual criteria */
	criterionEvaluator: CriterionEvaluator;
	
	/** @type {PromptGenerator} Component for generating evaluation prompts */
	promptGenerator: PromptGenerator;

	/**
	 * Creates a new DocumentComparator instance.
	 * 
	 * @param {Record<string, string>} documents - Map of document names to text content
	 * @param {Criterion[]} criteria - Array of evaluation criteria
	 * @param {string} openaiApiKey - OpenAI API key for AI evaluations
	 * @param {PDFProcessor} pdfProcessor - PDF processor for text extraction (must be pre-configured)
	 * @param {boolean} [useCustomPrompt=false] - Whether to use custom prompt evaluation
	 * @param {string} [modelName='gpt-4.1-mini'] - AI model to use for evaluations
	 */
	constructor(
		documents: Record<string, string>,
		criteria: Criterion[],
		openaiApiKey: string,
		pdfProcessor: PDFProcessor,
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

		// Initialize components
		this.criterionEvaluator = new CriterionEvaluator(openaiApiKey, modelName);
		this.promptGenerator = new PromptGenerator();
	}

	/**
	 * Validates the OpenAI API key format and length.
	 * Checks if the provided API key meets basic requirements for validity.
	 * 
	 * @returns {boolean} True if the API key appears valid, false otherwise
	 */
	validateApiKey(): boolean {
		const isValid = (
			typeof this.openaiApiKey === 'string' &&
			this.openaiApiKey.length > 20
		);

		if (!isValid) {
			console.warn(`WARNING: API key appears invalid in DocumentComparator (length: ${this.openaiApiKey.length})`);
		}

		return isValid;
	}

	/**
	 * Compares two documents using all configured criteria.
	 * Performs a comprehensive comparison by evaluating each criterion
	 * and computing weighted scores to determine the overall winner.
	 * 
	 * @param {string} doc1Name - Name of the first document to compare
	 * @param {string} doc2Name - Name of the second document to compare
	 * @returns {Promise<ComparisonResult>} Promise resolving to detailed comparison results
	 * @async
	 */
	async compare(doc1Name: string, doc2Name: string): Promise<ComparisonResult> {
		const allCriterionEvaluations: CriterionEvaluation[] = [];
		let docAWeightedScore = 0;
		let docBWeightedScore = 0;

		if (!this.validateApiKey()) {
			const errorMsg = "Invalid OpenAI API key";
			return {
				documentA: doc1Name,
				documentB: doc2Name,
				winner: null,
				error: errorMsg,
				evaluationDetails: {
					criterionEvaluations: [],
					overallScores: { documentA: 0, documentB: 0 },
					overallWinner: "Error",
					explanation: errorMsg
				},
				criterionScores: {}
			};
		}

		for (const criterion of this.criteria) {
			console.log(`\n🔍 Processing criterion: ${criterion.name} (weight: ${criterion.weight}%)`);
			console.log(`   Criterion ID: ${criterion.id}`);
			console.log(`   Custom prompt flag: ${criterion.isCustomPrompt || false}`);
			console.log(`   Use custom prompt: ${this.useCustomPrompt}`);
			console.log(`   Has scoring levels: ${!!criterion.scoringLevels}`);
			
			const criterionName = criterion.name;
			const criterionWeight = criterion.weight;
			const criterionId = criterion.id || '';

			// Get full document content
			const doc1Content = this.documents[doc1Name];
			const doc2Content = this.documents[doc2Name];

			console.log(`📄 Document content lengths: ${doc1Name}=${doc1Content?.length || 0} chars, ${doc2Name}=${doc2Content?.length || 0} chars`);

			if (!doc1Content || !doc2Content) {
				console.error(`❌ Missing document content: ${doc1Name}=${!!doc1Content}, ${doc2Name}=${!!doc2Content}`);
				continue;
			}

			if (doc1Content.length < 50 || doc2Content.length < 50) {
				console.warn(`⚠️  Very short document content detected - possible extraction issue`);
			}			// For criteria-based evaluation, use full document content
			// For custom prompts, use full content
			let doc1Section = doc1Content;
			let doc2Section = doc2Content;

			console.log(`📋 Using full document content for evaluation`);
			console.log(`Content lengths: ${doc1Name}=${doc1Section.length} chars, ${doc2Name}=${doc2Section.length} chars`);

			// Log content being sent to LLM (first 200 chars)
			console.log(`📤 Content being sent to LLM:`);
			console.log(`  ${doc1Name}: "${doc1Section.substring(0, 200)}..."`);
			console.log(`  ${doc2Name}: "${doc2Section.substring(0, 200)}..."`);

			// Add validation before sending to LLM
			if (!doc1Section || doc1Section.trim().length === 0) {
				console.warn(`⚠️  WARNING: Empty content for ${doc1Name}`);
			}
			if (!doc2Section || doc2Section.trim().length === 0) {
				console.warn(`⚠️  WARNING: Empty content for ${doc2Name}`);
			}

			console.log(`📊 Content lengths - ${doc1Name}: ${doc1Section.length}, ${doc2Name}: ${doc2Section.length}`);

			// Validate content quality before sending to LLM
			if (doc1Section.trim().length < 20 || doc2Section.trim().length < 20) {
				console.error(`❌ Content too short for meaningful evaluation. Skipping criterion: ${criterionName}`);
				console.log(`❌ ${doc1Name} content length: ${doc1Section.trim().length}`);
				console.log(`❌ ${doc2Name} content length: ${doc2Section.trim().length}`);
				continue;
			}

			let prompt: string;
			if (this.useCustomPrompt || criterion.isCustomPrompt) {
				console.log(`🔧 Using custom prompt generation for criterion: ${criterion.name}`);
				prompt = this.promptGenerator.generateCustomPrompt(
					doc1Name,
					doc2Name,
					doc1Section,
					doc2Section,
					criterion.description
				);
			} else {
				console.log(`🔧 Using criteria-based prompt generation for criterion: ${criterion.name}`);
				prompt = this.promptGenerator.generateCriterionPrompt(
					doc1Name,
					doc2Name,
					doc1Section,
					doc2Section,
					criterion
				);
			}

			console.log(`📤 Generated prompt length: ${prompt.length} characters`);
			console.log(`📤 Prompt preview (first 300 chars):\n${prompt.substring(0, 300)}...`);

			const promptTokens = encode(prompt).length;
			const maxTokens = Math.max(1000, Math.min(4096 - promptTokens - 50, 1500));

			const criterionEval = await this.criterionEvaluator.evaluate(prompt, maxTokens);

			if (!criterionEval.criterionId) {
				criterionEval.criterionId = criterionId;
			}

			if (!criterionEval.criterionName) {
				criterionEval.criterionName = criterionName;
			}

			const docAScore = criterionEval.documentAScore || 0;
			const docBScore = criterionEval.documentBScore || 0;

			const weightedA = (docAScore / 5) * criterionWeight;
			const weightedB = (docBScore / 5) * criterionWeight;

			docAWeightedScore += weightedA;
			docBWeightedScore += weightedB;

			allCriterionEvaluations.push(criterionEval);

			const winner = criterionEval.winner;
			console.log(`    Scores - A: ${docAScore}, B: ${docBScore}, Winner: ${winner}`);
		}

		const [overallWinner, winnerName, explanation] = this.determineWinner(
			doc1Name,
			doc2Name,
			docAWeightedScore,
			docBWeightedScore,
			allCriterionEvaluations
		);

		const evaluation = {
			criterionEvaluations: allCriterionEvaluations,
			overallScores: {
				documentA: docAWeightedScore,
				documentB: docBWeightedScore
			},
			overallWinner,
			explanation
		};

		const comparisonResult: ComparisonResult = {
			documentA: doc1Name,
			documentB: doc2Name,
			winner: winnerName !== "Tie" ? winnerName : null,
			evaluationDetails: evaluation,
			criterionScores: Object.fromEntries(
				this.criteria.map(criterion => [
					criterion.name,
					{
						documentA: allCriterionEvaluations.find(ce => ce.criterionName === criterion.name)?.documentAScore || 0,
						documentB: allCriterionEvaluations.find(ce => ce.criterionName === criterion.name)?.documentBScore || 0
					}
				])
			)
		};

		console.log(`Comparison complete: Winner is ${winnerName}`);
		return comparisonResult;
	}

	/**
	 * Determines the overall winner between two documents based on weighted scores.
	 * Analyzes criterion evaluations and weighted scores to determine which document
	 * performed better overall, including tie scenarios.
	 * 
	 * @param {string} doc1Name - Name of the first document
	 * @param {string} doc2Name - Name of the second document
	 * @param {number} docAWeightedScore - Weighted score for document A
	 * @param {number} docBWeightedScore - Weighted score for document B
	 * @param {CriterionEvaluation[]} criterionEvaluations - Array of individual criterion evaluations
	 * @returns {[string, string, string]} Tuple containing overall winner, winner name, and explanation
	 */
	determineWinner(
		doc1Name: string,
		doc2Name: string,
		docAWeightedScore: number,
		docBWeightedScore: number,
		criterionEvaluations: CriterionEvaluation[]
	): [string, string, string] {
		let overallWinner = "A";
		if (docAWeightedScore < docBWeightedScore) {
			overallWinner = "B";
		} else if (docAWeightedScore === docBWeightedScore) {
			overallWinner = "Tie";
		}

		let winnerName = doc1Name;
		if (overallWinner === "B") {
			winnerName = doc2Name;
		} else if (overallWinner === "Tie") {
			winnerName = "Tie";
		}

		let explanation = "";
		if (overallWinner !== "Tie") {
			explanation = `Document ${overallWinner} (${winnerName}) is the overall winner with a weighted score of `;
			explanation += `${docAWeightedScore.toFixed(2)} vs ${docBWeightedScore.toFixed(2)}. `;
		} else {
			explanation = `Documents are tied with equal weighted scores of ${docAWeightedScore.toFixed(2)}. `;
		}

		const winningCriteria: string[] = [];
		for (const evalItem of criterionEvaluations) {
			const criterion = evalItem.criterionName || '';
			const winner = evalItem.winner;
			if (winner === overallWinner && winner !== "Tie" && winner !== "N/A") {
				winningCriteria.push(criterion);
			}
		}

		if (winningCriteria.length > 0) {
			explanation += `Document ${overallWinner} performed better in: ${winningCriteria.join(', ')}. `;
		}

		explanation += "This assessment is based on both independent scoring against the rubrics and direct comparison between the documents.";

		return [overallWinner, winnerName, explanation];
	}
}
