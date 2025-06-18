// src/lib/comparison/criterionEvaluator.ts
import { OpenAI } from 'openai';
import { CriterionEvaluation } from './types';

export class CriterionEvaluator {
	openaiApiKey: string;
	modelName: string;

	constructor(openaiApiKey: string, modelName: string = "gpt-4.1-mini") {
		this.openaiApiKey = openaiApiKey;
		this.modelName = modelName;
	}

	async evaluate(prompt: string, maxTokens: number): Promise<CriterionEvaluation> {
		if (!this.validateApiKey()) {
			console.error(`ERROR: Invalid or missing API key (length: ${this.openaiApiKey.length})`);
			return this.createErrorEvaluation("Invalid or missing API key");
		}

		try {
			const openai = new OpenAI({
				apiKey: this.openaiApiKey,
			});

			console.log(`\n🤖 Sending prompt to ${this.modelName} (API key: ${this.openaiApiKey.slice(0, 4)}...${this.openaiApiKey.slice(-4)})`);
			console.log(`📏 Prompt length: ${prompt.length} characters, Max tokens: ${maxTokens}`);
			console.log(`📝 Prompt preview (first 500 chars):\n${prompt.substring(0, 500)}...`);

			const response = await openai.chat.completions.create({
				temperature: 0,
				max_tokens: maxTokens,
				model: this.modelName,
				seed: 42, // Fixed seed for deterministic results
				messages: [
					{ role: "user", content: prompt }
				]
			});

			console.log(`✅ Received response from ${this.modelName}`);

			let result = response.choices[0].message.content || "";
			result = result.trim();

			console.log(`📥 Raw LLM response length: ${result.length} characters`);
			console.log(`📥 Raw LLM response preview:\n${result.substring(0, 300)}...`);

			if (result.includes("```json")) {
				result = result.split("```json")[1].split("```")[0].trim();
				console.log(`🔧 Extracted JSON from code block`);
			} else if (result.includes("```")) {
				result = result.split("```")[1].split("```")[0].trim();
				console.log(`🔧 Extracted content from code block`);
			}

			const jsonStart = result.indexOf('{');
			const jsonEnd = result.lastIndexOf('}') + 1;
			if (jsonStart >= 0 && jsonEnd > jsonStart) {
				result = result.substring(jsonStart, jsonEnd);
				console.log(`🔧 Extracted JSON object from response`);
			}

			console.log(`📋 Final JSON to parse:\n${result}`);

			const rawEval = JSON.parse(result);
			console.log(`✅ Successfully parsed JSON response`);
			console.log(`📊 Parsing LLM response fields:`, {
				criterion_name: rawEval.criterion_name || rawEval.criterionName,
				document_a_score: rawEval.document_a_score || rawEval.documentAScore,
				document_b_score: rawEval.document_b_score || rawEval.documentBScore,
				winner: rawEval.winner
			});

			const criterionEval: CriterionEvaluation = {
				criterionId: rawEval.criterion_id || rawEval.criterionId,
				criterionName: rawEval.criterion_name || rawEval.criterionName,
				documentAScore: rawEval.document_a_score || rawEval.documentAScore || 0,
				documentBScore: rawEval.document_b_score || rawEval.documentBScore || 0,
				documentAAnalysis: rawEval.document_a_analysis || rawEval.documentAAnalysis,
				documentBAnalysis: rawEval.document_b_analysis || rawEval.documentBAnalysis,
				comparativeAnalysis: rawEval.comparative_analysis || rawEval.comparativeAnalysis,
				reasoning: rawEval.reasoning,
				winner: this.normalizeWinner(rawEval.winner)
			};

			console.log(`📊 Final parsed evaluation:`, {
				criterionName: criterionEval.criterionName,
				documentAScore: criterionEval.documentAScore,
				documentBScore: criterionEval.documentBScore,
				winner: criterionEval.winner
			});

			this.validateCriterionEvaluation(criterionEval);
			return criterionEval;

		} catch (error) {
			console.error(`ERROR evaluating criterion: ${error instanceof Error ? error.message : 'Unknown error'}`);
			console.error(`API key validity: ${this.validateApiKey() ? 'Valid' : 'Invalid'}`);

			return this.createErrorEvaluation(`Error during evaluation: ${error instanceof Error ? error.message : 'Unknown error'}`);
		}
	}

	validateApiKey(): boolean {
		return (
			typeof this.openaiApiKey === 'string' &&
			this.openaiApiKey.length > 20
		);
	}

	createErrorEvaluation(errorMessage: string): CriterionEvaluation {
		return {
			documentAScore: 0,
			documentBScore: 0,
			documentAAnalysis: `Error: ${errorMessage}`,
			documentBAnalysis: `Error: ${errorMessage}`,
			comparativeAnalysis: `Unable to compare due to error: ${errorMessage}`,
			reasoning: `Error occurred: ${errorMessage}`,
			winner: "N/A"
		};
	}

	normalizeWinner(winner: string): "A" | "B" | "Tie" | "N/A" {
		if (!winner) {
			return "N/A";
		}

		const normalizedWinner = winner.toUpperCase();

		if (normalizedWinner === "A" || normalizedWinner === "DOCUMENT A") {
			return "A";
		}
		if (normalizedWinner === "B" || normalizedWinner === "DOCUMENT B") {
			return "B";
		}
		if (normalizedWinner === "TIE" || normalizedWinner === "EQUAL" || normalizedWinner === "DRAW") {
			return "Tie";
		}

		return "N/A";
	}

	validateCriterionEvaluation(criterionEval: CriterionEvaluation): void {
		criterionEval.documentAScore = Math.max(0, Math.min(5, Number(criterionEval.documentAScore) || 0));
		criterionEval.documentBScore = Math.max(0, Math.min(5, Number(criterionEval.documentBScore) || 0));

		if (!["A", "B", "Tie", "N/A"].includes(criterionEval.winner)) {
			criterionEval.winner = "N/A";
		}
	}
}
