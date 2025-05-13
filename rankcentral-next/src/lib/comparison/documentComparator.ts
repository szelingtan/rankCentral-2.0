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

export class DocumentComparator {
	documents: Record<string, string>;
	criteria: Criterion[];
	openaiApiKey: string;
	pdfProcessor: any;
	useCustomPrompt: boolean;
	modelName: string;
	criterionEvaluator: CriterionEvaluator;
	promptGenerator: PromptGenerator;

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

		// Initialize components
		this.criterionEvaluator = new CriterionEvaluator(openaiApiKey, modelName);
		this.promptGenerator = new PromptGenerator();
	}

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
			console.log(`Processing criterion: ${criterion.name}`);
			const criterionName = criterion.name;
			const criterionWeight = criterion.weight;
			const criterionId = criterion.id || '';

			const doc1Content = this.documents[doc1Name];
			const doc2Content = this.documents[doc2Name];

			let prompt: string;
			if (this.useCustomPrompt || criterion.isCustomPrompt) {
				prompt = this.promptGenerator.generateCustomPrompt(
					doc1Name,
					doc2Name,
					doc1Content,
					doc2Content,
					criterion.description
				);
			} else {
				prompt = this.promptGenerator.generateCriterionPrompt(
					doc1Name,
					doc2Name,
					doc1Content,
					doc2Content,
					criterion
				);
			}

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
