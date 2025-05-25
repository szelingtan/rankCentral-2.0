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
	// Support for legacy snake_case properties from database
	document_a?: string;
	document_b?: string;
	evaluation_details?: {
		criterion_evaluations?: CriterionEvaluation[];
		overall_scores?: {
			document_a: number;
			document_b: number;
		};
		overall_winner?: string;
		explanation?: string;
	};
}

export interface ComparisonResultResponse {
	ranked_documents: Array<{
		name: string;
		score: number;
		rank: number;
	}>;
	comparison_details: ComparisonResult[];
	report_id: string;
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
