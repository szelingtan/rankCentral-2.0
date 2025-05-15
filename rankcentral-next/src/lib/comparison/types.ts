// src/lib/comparison/types.ts

export interface Document {
	id: string;
	content: string;
	displayName?: string;
	fileSize?: string;
}

export interface ScoringLevel {
	[level: number]: string;
}

export interface Criterion {
	id: string;
	name: string;
	description: string;
	weight: number;
	scoringLevels?: ScoringLevel;
	isCustomPrompt?: boolean;
}

export interface CriterionEvaluation {
	criterionId?: string;
	criterionName?: string;
	documentAScore: number;
	documentBScore: number;
	documentAAnalysis?: string;
	documentBAnalysis?: string;
	comparativeAnalysis?: string;
	reasoning?: string;
	winner: "A" | "B" | "Tie" | "N/A";
}

export interface ComparisonResult {
	documentA: string;
	documentB: string;
	winner: string | null;
	error?: string;
	evaluationDetails?: {
		criterionEvaluations: CriterionEvaluation[];
		overallScores: {
			documentA: number;
			documentB: number;
		};
		overallWinner: string;
		explanation: string;
	};
	criterionScores?: Record<string, {
		documentA: number;
		documentB: number;
	}>;
}

export interface ReportData {
	overview: any[];
	criterionDetails: any[];
	winCounts: Record<string, number>;
	criterionSummary: any[];
}

export type EvaluationMethod = 'criteria' | 'prompt';

export interface ComparisonOptions {
	criteria: Criterion[];
	evaluationMethod: EvaluationMethod;
	customPrompt?: string;
	reportName?: string;
	modelName?: string;
}
