// src/lib/comparison/dataProcessor.ts
import { ComparisonResult } from './types';

export class ComparisonDataProcessor {
	static extractDocumentScores(pdfList: string[], comparisonResults: ComparisonResult[]): Record<string, any> {
		const docScores: Record<string, any> = {};
		for (const doc of pdfList) {
			docScores[doc] = { totalScore: 0, count: 0, criteriaScores: {} };
		}

		for (const comp of comparisonResults) {
			const docA = comp.documentA || "";
			const docB = comp.documentB || "";

			if (!docA || !docB) continue;

			const evalDetails = comp.evaluationDetails as NonNullable<ComparisonResult['evaluationDetails']>;
			const overallScores = evalDetails?.overallScores || { documentA: 0, documentB: 0 };
			const docAScore = overallScores.documentA;
			const docBScore = overallScores.documentB;

			if (docAScore > 0) {
				docScores[docA].totalScore += docAScore;
				docScores[docA].count += 1;
			}

			if (docBScore > 0) {
				docScores[docB].totalScore += docBScore;
				docScores[docB].count += 1;
			}

			const criterionEvaluations = evalDetails?.criterionEvaluations || [];
			if (criterionEvaluations.length > 0) {
				ComparisonDataProcessor._processCriterionScores(criterionEvaluations, docA, docB, docScores);
			}
		}

		return docScores;
	}

	static _processCriterionScores(
		criterionEvaluations: any[],
		docA: string,
		docB: string,
		docScores: Record<string, any>
	): void {
		for (const evalItem of criterionEvaluations) {
			const criterionName = evalItem.criterionName || "";
			const docAScore = evalItem.documentAScore || 0;
			const docBScore = evalItem.documentBScore || 0;

			if (criterionName) {
				if (!docScores[docA].criteriaScores[criterionName]) {
					docScores[docA].criteriaScores[criterionName] = { total: 0, count: 0 };
				}
				if (!docScores[docB].criteriaScores[criterionName]) {
					docScores[docB].criteriaScores[criterionName] = { total: 0, count: 0 };
				}

				docScores[docA].criteriaScores[criterionName].total += docAScore;
				docScores[docA].criteriaScores[criterionName].count += 1;
				docScores[docB].criteriaScores[criterionName].total += docBScore;
				docScores[docB].criteriaScores[criterionName].count += 1;
			}
		}
	}

	static calculateWinCounts(pdfList: string[], comparisonResults: ComparisonResult[]): Record<string, number> {
		const winCounts: Record<string, number> = {};
		for (const doc of pdfList) {
			winCounts[doc] = comparisonResults.filter(comp => comp.winner === doc).length;
		}
		return winCounts;
	}

	static prepareReportData(pdfList: string[], comparisonResults: ComparisonResult[]): any[] {
		const reportData: any[] = [];

		for (const comp of comparisonResults) {
			const docA = comp.documentA || "";
			const docB = comp.documentB || "";
			const winner = comp.winner || "N/A";

			try {
				const evalDetails = comp.evaluationDetails as NonNullable<ComparisonResult['evaluationDetails']>;
				const explanation = evalDetails.explanation || "No explanation provided";
				const overallScores = evalDetails.overallScores || {};
				const docAScore = overallScores.documentA || 0;
				const docBScore = overallScores.documentB || 0;

				const reportEntry = {
					"Comparison": `${docA} vs ${docB}`,
					[`${docA} Score`]: docAScore,
					[`${docB} Score`]: docBScore,
					"Winner": winner,
					"Overall Explanation": explanation
				};
				reportData.push(reportEntry);
			} catch (error) {
				reportData.push({
					"Comparison": `${docA} vs ${docB}`,
					"Winner": winner,
					"Error": error instanceof Error ? error.message : String(error)
				});
			}
		}

		return reportData;
	}

	static prepareCriterionData(comparisonResults: ComparisonResult[]): any[] {
		const criterionData: any[] = [];

		for (const comp of comparisonResults) {
			const docA = comp.documentA || "";
			const docB = comp.documentB || "";

			try {
				const evalDetails = comp.evaluationDetails as NonNullable<ComparisonResult['evaluationDetails']>;
				const criterionEvaluations = evalDetails.criterionEvaluations || [];

				for (const evalItem of criterionEvaluations) {
					const criterionId = evalItem.criterionId || "";
					const criterionName = evalItem.criterionName || "";
					const criterionWinner = evalItem.winner || "";
					const docAScore = evalItem.documentAScore || 0;
					const docBScore = evalItem.documentBScore || 0;
					const reasoning = evalItem.reasoning || "No detailed reasoning provided";

					const criterionEntry = {
						"Comparison": `${docA} vs ${docB}`,
						"Criterion ID": criterionId,
						"Criterion Name": criterionName,
						"Document A Score": docAScore,
						"Document A Analysis": evalItem.documentAAnalysis || "No analysis provided",
						"Document B Score": docBScore,
						"Document B Analysis": evalItem.documentBAnalysis || "No analysis provided",
						"Comparative Analysis": evalItem.comparativeAnalysis || "No comparative analysis provided",
						"Detailed Reasoning": reasoning,
						"Winner": criterionWinner === "A" ? docA :
							criterionWinner === "B" ? docB : "Tie"
					};
					criterionData.push(criterionEntry);
				}
			} catch (error) {
				console.error("Error processing criterion data:", error);
			}
		}

		return criterionData;
	}

	static prepareCriterionSummary(pdfList: string[], comparisonResults: ComparisonResult[]): any[] {
		const criterionSummary: any[] = [];
		const allCriteria = new Set<string>();

		for (const comp of comparisonResults) {
			const evalDetails = comp.evaluationDetails as NonNullable<ComparisonResult['evaluationDetails']>;
			const criterionEvaluations = evalDetails.criterionEvaluations || [];
			for (const evalItem of criterionEvaluations) {
				const criterionName = evalItem.criterionName || "";
				if (criterionName) {
					allCriteria.add(criterionName);
				}
			}
		}

		const winCounts = ComparisonDataProcessor.calculateWinCounts(pdfList, comparisonResults);

		for (const doc of pdfList) {
			const docCriterionScores: Record<string, number> = {};

			for (const criterion of Array.from(allCriteria)) {
				const scores: number[] = [];

				for (const comp of comparisonResults) {
					const evalDetails = comp.evaluationDetails as NonNullable<ComparisonResult['evaluationDetails']>;
					const criterionEvaluations = evalDetails.criterionEvaluations || [];

					for (const evalItem of criterionEvaluations) {
						if (evalItem.criterionName === criterion) {
							if (comp.documentA === doc) {
								const score = evalItem.documentAScore || 0;
								if (score > 0) scores.push(score);
							} else if (comp.documentB === doc) {
								const score = evalItem.documentBScore || 0;
								if (score > 0) scores.push(score);
							}
						}
					}
				}

				docCriterionScores[criterion] = scores.length > 0
					? scores.reduce((sum, score) => sum + score, 0) / scores.length
					: 0;
			}

			const entry: Record<string, any> = {
				'Document': doc,
				'Win Count': winCounts[doc] || 0
			};

			for (const criterion of Array.from(allCriteria)) {
				entry[`${criterion} Score`] = Number(docCriterionScores[criterion].toFixed(2));
			}

			criterionSummary.push(entry);
		}

		return criterionSummary;
	}
}
