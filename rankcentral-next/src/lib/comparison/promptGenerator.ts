/**
 * @fileoverview Prompt generation utilities for AI-powered document comparison.
 * Creates structured prompts for criterion-based and custom evaluations.
 */

// src/lib/comparison/promptGenerator.ts
import { Criterion } from './types';

/**
 * Utility class for generating AI evaluation prompts.
 * Creates structured prompts for both criterion-based and custom document evaluations.
 * @class PromptGenerator
 */
export class PromptGenerator {
	/**
	 * Generates a structured prompt for evaluating documents against a specific criterion.
	 * Creates detailed instructions with scoring rubrics and evaluation guidelines.
	 * 
	 * @param {string} doc1Name - Name of the first document
	 * @param {string} doc2Name - Name of the second document
	 * @param {string} doc1Section - Relevant content from the first document
	 * @param {string} doc2Section - Relevant content from the second document
	 * @param {Criterion} criterion - Evaluation criterion with scoring levels
	 * @returns {string} Formatted prompt for AI evaluation
	 */
	generateCriterionPrompt(
		doc1Name: string,
		doc2Name: string,
		doc1Section: string,
		doc2Section: string,
		criterion: Criterion
	): string {
		let prompt = `
		Evaluate the following two documents specifically on this criterion: ${criterion.name}.
		
		# Documents:
		- Document A: ${doc1Name}
		- Document B: ${doc2Name}
		
		# Criterion Information:
		Name: ${criterion.name}
		Weight: ${criterion.weight}%
		Description: ${criterion.description}
		
		# Scoring Rubric:
		`;

		if (criterion.scoringLevels && Object.keys(criterion.scoringLevels).length > 0) {
			for (const [level, desc] of Object.entries(criterion.scoringLevels)) {
				let levelNum = level;
				if (typeof level === 'string' && /^\d+$/.test(level)) {
					levelNum = parseInt(level, 10).toString();
				}
				prompt += `  ${levelNum}: ${desc}\n`;
			}
		} else {
			prompt += "  1: Poor - Does not meet the criterion requirements\n";
			prompt += "  2: Fair - Meets some requirements with significant gaps\n";
			prompt += "  3: Good - Meets most requirements\n";
			prompt += "  4: Very Good - Meets all requirements\n";
			prompt += "  5: Excellent - Exceeds requirements\n";
		}

		prompt += `
		# Document A Relevant Section for ${criterion.name}:
		${doc1Section}
		
		# Document B Relevant Section for ${criterion.name}:
		${doc2Section}
		`;

		prompt += `
		Perform a thorough evaluation following these steps:
		
		1. Analyse Document A and Document B
			- Carefully assess Document A and Document B against the rubric criteria
			- Provide detailed reasoning with specific examples from the text
			- Assign a score from 1-5 based strictly on the rubric
		
		2. Comparative Analysis:
			- Directly compare how each document addresses this criterion
			- Highlight key differences in approach and effectiveness
			- Consider both qualitative and quantitative factors
			- Determine which document better satisfies the criterion
		
		3. Decision Reasoning:
			- Explain your decision process in detail
			- Justify why one document scores higher than the other
			- Reference specific content from both documents
			- Consider how well each meets the specific requirements of this criterion

		In your analyses, refer to the document names only, do not refer to them as Document A and Document B at all. 
		
		Respond with a JSON object containing these fields:
		{
			"criterion_name": "${criterion.name}",
			"document_a_score": [score between 1-5],
			"document_a_analysis": [detailed analysis with specific examples],
			"document_b_score": [score between 1-5],
			"document_b_analysis": [detailed analysis with specific examples],
			"comparative_analysis": [direct side-by-side comparison],
			"reasoning": [detailed justification for your decision],
			"winner": [either "A" or "B" or "Tie" if truly equal]
		}
		`;

		return prompt;
	}

	/**
	 * Generates a custom evaluation prompt based on user-provided instructions.
	 * Creates a flexible evaluation framework for custom comparison requirements.
	 * 
	 * @param {string} doc1Name - Name of the first document
	 * @param {string} doc2Name - Name of the second document
	 * @param {string} doc1Section - Content from the first document
	 * @param {string} doc2Section - Content from the second document
	 * @param {string} customPromptText - User-provided evaluation instructions
	 * @returns {string} Formatted custom evaluation prompt
	 */
	generateCustomPrompt(
		doc1Name: string,
		doc2Name: string,
		doc1Section: string,
		doc2Section: string,
		customPromptText: string
	): string {
		const prompt = `
		Compare and evaluate the following two documents based on the provided instructions.
		
		# Documents:
		- Document A: ${doc1Name}
		- Document B: ${doc2Name}
		
		# Document A Content:
		${doc1Section}
		
		# Document B Content:
		${doc2Section}
		
		# Evaluation Instructions:
		${customPromptText}
		
		# Evaluation Guidelines:
		- Thoroughly analyze both documents based on the given instructions
		- Consider all aspects requested in the evaluation instructions
		- Be objective and fair in your assessment
		- Use specific examples from the text to support your evaluation
		- Score each document on a scale of 1-5 (where 1 is poor and 5 is excellent)
		- Determine a clear winner or declare a tie if truly equal
		- Refer to the document names only, do not refer to them as Document A and Document B at all.
		- Criterion Name is always Custom Evaluation
		
		Respond with a JSON object containing these fields:
		{
			"criterion_name": "Custom Evaluation",
			"document_a_score": [score between 1-5],
			"document_a_analysis": [detailed analysis with specific examples],
			"document_b_score": [score between 1-5],
			"document_b_analysis": [detailed analysis with specific examples],
			"comparative_analysis": [direct side-by-side comparison based on the custom instructions],
			"reasoning": [detailed justification for your decision],
			"winner": [either "A" or "B" or "Tie" if truly equal]
		}
		`;

		return prompt;
	}
}
