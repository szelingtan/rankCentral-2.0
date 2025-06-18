/**
 * @fileoverview Management utilities for document evaluation criteria.
 * Provides functionality to create, manage, and configure evaluation criteria
 * with scoring rubrics for document comparison systems.
 */

// src/lib/comparison/criteriaManager.ts
import { Criterion, ScoringLevel } from './types';

// Re-export types for convenience
export type { Criterion, ScoringLevel } from './types';

/**
 * Manages evaluation criteria for document comparison systems.
 * Provides default criteria templates and utilities for creating
 * custom evaluation frameworks with scoring rubrics.
 * 
 * @class CriteriaManager
 */
export class CriteriaManager {
	/** @type {Criterion[]} Array of current evaluation criteria */
	criteria: Criterion[] = [];

	/** @type {Criterion[]} Default set of evaluation criteria with predefined scoring levels */
	defaultCriteria: Criterion[] = [
		{
			id: "1",
			name: "Clarity",
			description: "How clear and understandable is the document?",
			weight: 30,
			scoringLevels: {
				1: "Poor - Document is unclear and difficult to understand",
				2: "Fair - Document has significant clarity issues",
				3: "Good - Document is mostly clear with minor clarity issues",
				4: "Very Good - Document is clear and easy to understand",
				5: "Excellent - Document is exceptionally clear and easy to understand"
			}
		},
		{
			id: "2",
			name: "Relevance",
			description: "How relevant is the content to the subject matter?",
			weight: 30,
			scoringLevels: {
				1: "Poor - Content is mostly irrelevant to the subject matter",
				2: "Fair - Content has limited relevance to the subject matter",
				3: "Good - Content is mostly relevant with some gaps",
				4: "Very Good - Content is highly relevant to the subject matter",
				5: "Excellent - Content is exceptionally relevant and focused"
			}
		},
		{
			id: "3",
			name: "Thoroughness",
			description: "How comprehensive and complete is the document?",
			weight: 20,
			scoringLevels: {
				1: "Poor - Document lacks comprehensiveness and is incomplete",
				2: "Fair - Document covers basic aspects but has significant gaps",
				3: "Good - Document is mostly comprehensive with minor gaps",
				4: "Very Good - Document is comprehensive and covers all key areas",
				5: "Excellent - Document is exceptionally thorough and comprehensive"
			}
		},
		{
			id: "4",
			name: "Structure",
			description: "How well-organized is the document?",
			weight: 20,
			scoringLevels: {
				1: "Poor - Document is poorly organized and structured",
				2: "Fair - Document has basic structure but with significant issues",
				3: "Good - Document is reasonably well-organized with minor issues",
				4: "Very Good - Document is well-organized and structured",
				5: "Excellent - Document has exceptional organization and structure"
			}
		}
	];

	/**
	 * Creates a new CriteriaManager instance with empty criteria array.
	 */
	constructor() {
		this.criteria = [];
	}

	/**
	 * Retrieves criteria for evaluation, using defaults if none are configured.
	 * Returns current criteria or falls back to default criteria if none exist.
	 * 
	 * @returns {Criterion[]} Array of evaluation criteria
	 */
	getCriteriaFromUser(): Criterion[] {
		if (this.criteria.length === 0) {
			this.criteria = [...this.defaultCriteria];
			console.log("Using default criteria for document comparison.");
		}
		
		// Validate and normalize criteria
		this.validateAndFixCriteria();
		return this.criteria;
	}

	/**
	 * Validates and fixes common issues with criteria
	 */
	private validateAndFixCriteria(): void {
		console.log("🔍 Validating criteria...");
		
		this.criteria.forEach((criterion, index) => {
			// Fix missing ID
			if (!criterion.id) {
				criterion.id = String(index + 1);
				console.log(`Fixed missing ID for criterion: ${criterion.name}`);
			}
			
			// Fix missing scoring levels
			if (!criterion.scoringLevels || Object.keys(criterion.scoringLevels).length === 0) {
				criterion.scoringLevels = {
					1: 'Poor - Does not meet the criterion requirements',
					2: 'Fair - Partially meets some requirements with significant gaps',
					3: 'Good - Meets most requirements with minor gaps',
					4: 'Very Good - Fully meets all requirements',
					5: 'Excellent - Exceeds requirements in meaningful ways'
				};
				console.log(`Added default scoring levels for criterion: ${criterion.name}`);
			}
			
			// Validate weight
			if (typeof criterion.weight !== 'number' || criterion.weight <= 0) {
				criterion.weight = 25; // Default weight
				console.log(`Fixed invalid weight for criterion: ${criterion.name}`);
			}
		});
		
		// Normalize weights to sum to 100
		this.normalizeCriteriaWeights();
		
		console.log(`✅ Validated ${this.criteria.length} criteria`);
	}

	/**
	 * Adds a new evaluation criterion to the criteria list.
	 * Creates a criterion with the specified parameters and default scoring levels
	 * if none are provided.
	 * 
	 * @param {string} name - Name of the criterion
	 * @param {string} description - Description of what the criterion evaluates
	 * @param {number} weight - Weight/importance of this criterion (0-100)
	 * @param {ScoringLevel} [scoringLevels] - Optional custom scoring rubric levels
	 */
	addCriterion(
		name: string,
		description: string,
		weight: number,
		scoringLevels?: ScoringLevel
	): void {
		const criterionId = String(this.criteria.length + 1);

		if (!scoringLevels) {
			scoringLevels = {
				1: 'Poor - Does not meet the criterion requirements',
				2: 'Fair - Partially meets some requirements with significant gaps',
				3: 'Good - Meets most requirements with minor gaps',
				4: 'Very Good - Fully meets all requirements',
				5: 'Excellent - Exceeds requirements in meaningful ways'
			};
		}

		this.criteria.push({
			id: criterionId,
			name,
			description,
			weight,
			scoringLevels
		});
	}

	/**
	 * Updates an existing criterion with new values.
	 * Merges the provided updates with the existing criterion data.
	 * 
	 * @param {string} id - ID of the criterion to update
	 * @param {Partial<Criterion>} updates - Partial criterion object with updates
	 */
	updateCriterion(id: string, updates: Partial<Criterion>): void {
		const criterionIndex = this.criteria.findIndex(c => c.id === id);
		if (criterionIndex !== -1) {
			this.criteria[criterionIndex] = {
				...this.criteria[criterionIndex],
				...updates
			};
		}
	}

	/**
	 * Removes a criterion from the criteria list by ID.
	 * 
	 * @param {string} id - ID of the criterion to remove
	 */
	removeCriterion(id: string): void {
		this.criteria = this.criteria.filter(criterion => criterion.id !== id);
	}

	/**
	 * Retrieves a criterion by its unique ID.
	 * 
	 * @param {string} criterionId - ID of the criterion to find
	 * @returns {Criterion | undefined} The criterion if found, undefined otherwise
	 */
	getCriterionById(criterionId: string): Criterion | undefined {
		return this.criteria.find(criterion => criterion.id === criterionId);
	}

	/**
	 * Retrieves a criterion by its name (case-insensitive).
	 * 
	 * @param {string} name - Name of the criterion to find
	 * @returns {Criterion | undefined} The criterion if found, undefined otherwise
	 */
	getCriterionByName(name: string): Criterion | undefined {
		return this.criteria.find(
			criterion => criterion.name.toLowerCase() === name.toLowerCase()
		);
	}

	/**
	 * Normalizes criterion weights to total 100%.
	 * Recalculates all criterion weights as percentages of the total weight,
	 * ensuring they sum to 100 for proper weighted scoring.
	 */
	normalizeCriteriaWeights(): void {
		const totalWeight = this.criteria.reduce((sum, criterion) => sum + criterion.weight, 0);

		if (totalWeight === 0) return;

		this.criteria.forEach(criterion => {
			criterion.weight = Math.round((criterion.weight / totalWeight) * 100);
		});
	}
}
