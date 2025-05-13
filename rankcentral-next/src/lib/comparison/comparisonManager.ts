// src/lib/comparison/criteriaManager.ts
export class CriteriaManager {
	criteria: any[] = [];
	defaultCriteria: any[] = [
		{
			"id": "1",
			"name": "Clarity",
			"description": "How clear and understandable is the document?",
			"weight": 30,
			"scoringLevels": {
				1: "Poor - Document is unclear and difficult to understand",
				2: "Fair - Document has significant clarity issues",
				3: "Good - Document is mostly clear with minor clarity issues",
				4: "Very Good - Document is clear and easy to understand",
				5: "Excellent - Document is exceptionally clear and easy to understand"
			}
		},
		{
			"id": "2",
			"name": "Relevance",
			"description": "How relevant is the content to the subject matter?",
			"weight": 30,
			"scoringLevels": {
				1: "Poor - Content is mostly irrelevant to the subject matter",
				2: "Fair - Content has limited relevance to the subject matter",
				3: "Good - Content is mostly relevant with some gaps",
				4: "Very Good - Content is highly relevant to the subject matter",
				5: "Excellent - Content is exceptionally relevant and focused"
			}
		},
		{
			"id": "3",
			"name": "Thoroughness",
			"description": "How comprehensive and complete is the document?",
			"weight": 20,
			"scoringLevels": {
				1: "Poor - Document lacks comprehensiveness and is incomplete",
				2: "Fair - Document covers basic aspects but has significant gaps",
				3: "Good - Document is mostly comprehensive with minor gaps",
				4: "Very Good - Document is comprehensive and covers all key areas",
				5: "Excellent - Document is exceptionally thorough and comprehensive"
			}
		},
		{
			"id": "4", 
			"name": "Structure",
			"description": "How well-organized is the document?",
			"weight": 20,
			"scoringLevels": {
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

	getCriteriaFromUser(): any[] {
		// In non-interactive contexts (web app), return the existing criteria or defaults
		if (!this.criteria || this.criteria.length === 0) {
			// If no criteria set yet, use default criteria
			this.criteria = this.defaultCriteria;
			console.log("Using default criteria for document comparison.");
		}
		
		return this.criteria;
	}

	addCriterion(name: string, description: string, weight: number, scoringLevels?: Record<number, string>): void {
		const criterionId = String(this.criteria.length + 1);
		
		// Use default scoring levels if none provided
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

	getCriterionById(criterionId: string): any {
		for (const criterion of this.criteria) {
			if (criterion.id === criterionId) {
				return criterion;
			}
		}
		return {};
	}

	getCriterionByName(name: string): any {
		for (const criterion of this.criteria) {
			if (criterion.name.toLowerCase() === name.toLowerCase()) {
				return criterion;
			}
		}
		return {};
	}
}
