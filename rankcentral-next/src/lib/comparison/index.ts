/**
 * @fileoverview Main export module for the comparison library.
 * Provides a centralized access point for all comparison-related components,
 * utilities, and types used in document comparison and ranking systems.
 */

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
import ApiClient from './apiClient';
export { ApiClient };

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
	// Create a new PDF processor instance for this comparison
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
