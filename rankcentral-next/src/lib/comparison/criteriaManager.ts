// src/lib/comparison/criteriaManager.ts
import { Criterion, ScoringLevel } from './types';

// Re-export types for convenience
export type { Criterion, ScoringLevel } from './types';

export class CriteriaManager {
	criteria: Criterion[] = [];

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

	constructor() {
		this.criteria = [];
	}

	getCriteriaFromUser(): Criterion[] {
		if (this.criteria.length === 0) {
			this.criteria = [...this.defaultCriteria];
			console.log("Using default criteria for document comparison.");
		}
		return this.criteria;
	}

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

	updateCriterion(id: string, updates: Partial<Criterion>): void {
		const criterionIndex = this.criteria.findIndex(c => c.id === id);
		if (criterionIndex !== -1) {
			this.criteria[criterionIndex] = {
				...this.criteria[criterionIndex],
				...updates
			};
		}
	}

	removeCriterion(id: string): void {
		this.criteria = this.criteria.filter(criterion => criterion.id !== id);
	}

	getCriterionById(criterionId: string): Criterion | undefined {
		return this.criteria.find(criterion => criterion.id === criterionId);
	}

	getCriterionByName(name: string): Criterion | undefined {
		return this.criteria.find(
			criterion => criterion.name.toLowerCase() === name.toLowerCase()
		);
	}

	normalizeCriteriaWeights(): void {
		const totalWeight = this.criteria.reduce((sum, criterion) => sum + criterion.weight, 0);

		if (totalWeight === 0) return;

		this.criteria.forEach(criterion => {
			criterion.weight = Math.round((criterion.weight / totalWeight) * 100);
		});
	}
}
