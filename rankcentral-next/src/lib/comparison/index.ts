// src/lib/comparison/index.ts
// Export all components from this directory

import { ComparisonEngine } from './comparisonEngine';
import { PDFProcessor } from './pdfProcessor';
// Core types
export * from './types';

// Main components
export { ComparisonEngine } from './comparisonEngine';
export { DocumentComparator } from './documentComparator';
export { CriterionEvaluator } from './criterionEvaluator';
export { PromptGenerator } from './promptGenerator';
export { CriteriaManager } from './criteriaManager';
export { ReportGenerator } from './reportGenerator';
export { ComparisonDataProcessor } from './dataProcessor';
export { ApiClient } from './apiClient';

// Utility functions
export { mergesortWithComparator, mergeWithComparator, MergesortRanker } from './mergesortRanking';

// Factory function to create a comparison engine
export function createComparisonEngine(
	documents: Record<string, string>,
	criteria: any[],
	openaiApiKey: string,
	useCustomPrompt = false,
	modelName = 'gpt-4.1-mini'
) {
	const pdfProcessor = new PDFProcessor();
	return new ComparisonEngine(
		documents,
		criteria,
		openaiApiKey,
		pdfProcessor,
		useCustomPrompt,
		modelName
	);
}
