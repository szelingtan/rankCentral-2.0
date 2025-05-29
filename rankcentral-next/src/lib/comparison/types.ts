/**
 * @fileoverview Type definitions for document comparison and ranking system.
 * Defines interfaces for documents, criteria, evaluation results, and reports.
 */

// src/lib/comparison/types.ts

/**
 * Represents a document in the comparison system.
 * @interface Document
 */
export interface Document {
	/** @type {string} Unique identifier for the document */
	id: string;
	/** @type {string} Text content of the document */
	content: string;
	/** @type {string} [displayName] Human-readable name for display */
	displayName?: string;
	/** @type {string} [fileSize] Size of the document file */
	fileSize?: string;
}

/**
 * Scoring levels for criteria evaluation.
 * Maps numeric levels to descriptive text.
 * @interface ScoringLevel
 */
export interface ScoringLevel {
	/** @type {string} Description for each scoring level */
	[level: number]: string;
}

/**
 * Evaluation criterion for document comparison.
 * @interface Criterion
 */
export interface Criterion {
	/** @type {string} Unique identifier for the criterion */
	id: string;
	/** @type {string} Name of the criterion */
	name: string;
	/** @type {string} Detailed description of what the criterion evaluates */
	description: string;
	/** @type {number} Weight/importance of this criterion in overall scoring */
	weight: number;
	/** @type {ScoringLevel} [scoringLevels] Optional scoring level descriptions */
	scoringLevels?: ScoringLevel;
	/** @type {boolean} [isCustomPrompt] Whether this criterion uses a custom prompt */
	isCustomPrompt?: boolean;
}

/**
 * Evaluation result for a single criterion comparing two documents.
 * @interface CriterionEvaluation
 */
export interface CriterionEvaluation {
	/** @type {string} [criterionId] ID of the evaluated criterion */
	criterionId?: string;
	/** @type {string} [criterionName] Name of the evaluated criterion */
	criterionName?: string;
	/** @type {number} Score assigned to document A */
	documentAScore: number;
	/** @type {number} Score assigned to document B */
	documentBScore: number;
	/** @type {string} [documentAAnalysis] Detailed analysis of document A */
	documentAAnalysis?: string;
	/** @type {string} [documentBAnalysis] Detailed analysis of document B */
	documentBAnalysis?: string;
	/** @type {string} [comparativeAnalysis] Comparative analysis between documents */
	comparativeAnalysis?: string;
	/** @type {string} [reasoning] Reasoning behind the evaluation */
	reasoning?: string;
	/** @type {"A" | "B" | "Tie" | "N/A"} Which document wins for this criterion */
	winner: "A" | "B" | "Tie" | "N/A";
}

/**
 * Result of comparing two documents across all criteria.
 * @interface ComparisonResult
 */
export interface ComparisonResult {
	/** @type {string} Name of the first document */
	documentA: string;
	/** @type {string} Name of the second document */
	documentB: string;
	/** @type {string|null} Winner of the comparison or null for tie */
	winner: string | null;
	/** @type {string} [error] Error message if comparison failed */
	error?: string;
	/** @type {Object} [evaluationDetails] Detailed evaluation breakdown */
	evaluationDetails?: {
		/** @type {CriterionEvaluation[]} Individual criterion evaluations */
		criterionEvaluations: CriterionEvaluation[];
		/** @type {Object} Overall scores for both documents */
		overallScores: {
			documentA: number;
			documentB: number;
		};
		/** @type {string} Overall winner determination */
		overallWinner: string;
		/** @type {string} Explanation of the result */
		explanation: string;
	};
	/** @type {Object} [criterionScores] Scores by criterion */
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

/**
 * API response format for comparison results.
 * @interface ComparisonResultResponse
 */
export interface ComparisonResultResponse {
	/** @type {Array} Ranked list of documents with scores */
	ranked_documents: Array<{
		name: string;
		score: number;
		rank: number;
	}>;
	/** @type {ComparisonResult[]} Detailed comparison results */
	comparison_details: ComparisonResult[];
	/** @type {string} Unique identifier for the generated report */
	report_id: string;
}

/**
 * Structured data for report generation and display.
 * @interface ReportData
 */
export interface ReportData {
	/** @type {any[]} Overview data for the report */
	overview: any[];
	/** @type {any[]} Detailed criterion evaluation data */
	criterionDetails: any[];
	/** @type {any[]} [criterionSummary] Summary data by criterion */
	criterionSummary?: any[];
	/** @type {string[]} [ranking] Document ranking from merge sort results */
	ranking?: string[]; // Document ranking from merge sort results
}

/**
 * Complete report containing all evaluation data and metadata.
 * @interface Report
 */
export interface Report {
	/** @type {string} Unique identifier for the report */
	id: string;
	/** @type {string} User-provided name for the report */
	name: string;
	/** @type {string} ISO timestamp of report creation */
	createdAt: string;
	/** @type {Document[]} Documents that were evaluated */
	documents: Document[];
	/** @type {Criterion[]} Criteria used for evaluation */
	criteria: Criterion[];
	/** @type {ComparisonResult[]} Results of all pairwise comparisons */
	results: ComparisonResult[];
	/** @type {string[]} Final ranking of documents */
	ranking: string[];
	/** @type {Object} [metadata] Additional report metadata */
	metadata?: {
		evaluationMethod: EvaluationMethod;
		modelName?: string;
		customPrompt?: string;
	};
}

/**
 * Summary information for a report (used in lists/previews).
 * @interface ReportSummary
 */
export interface ReportSummary {
	/** @type {string} Unique identifier for the report */
	id: string;
	/** @type {string} User-provided name for the report */
	name: string;
	/** @type {string} ISO timestamp of report creation */
	createdAt: string;
	/** @type {number} Number of documents in the evaluation */
	documentCount: number;
	/** @type {EvaluationMethod} Method used for evaluation */
	evaluationMethod: EvaluationMethod;
}

/**
 * Method used for document evaluation.
 * @typedef {'criteria' | 'prompt'} EvaluationMethod
 */
export type EvaluationMethod = 'criteria' | 'prompt';

/**
 * Configuration options for running a comparison.
 * @interface ComparisonOptions
 */
export interface ComparisonOptions {
	/** @type {Criterion[]} Criteria to use for evaluation */
	criteria: Criterion[];
	/** @type {EvaluationMethod} Method to use for evaluation */
	evaluationMethod: EvaluationMethod;
	/** @type {string} [customPrompt] Custom prompt text for prompt-based evaluation */
	customPrompt?: string;
	/** @type {string} [reportName] Name to assign to the generated report */
	reportName?: string;
	/** @type {string} [modelName] AI model to use for evaluation */
	modelName?: string;
}
