/**
 * @fileoverview Data processing utilities for comparison results. Handles the preparation
 * and formatting of comparison data for reporting and export purposes. This module is
 * specifically designed for prompt-based evaluation systems and does not handle ranking
 * or ordering of documents.
 */

// src/lib/comparison/dataProcessor.ts
import { ComparisonResult } from './types';

// NOTE: For prompt-based evaluation (merge sort ranking), this file is NOT used for ranking or ordering documents.
// Only the methods below are retained for reporting/export purposes.

/**
 * Utility class for processing and formatting comparison result data.
 * Provides static methods to transform comparison results into structured
 * report data for export and analysis purposes.
 * 
 * @class ComparisonDataProcessor
 */
export class ComparisonDataProcessor {
    /**
     * Prepares comparison results data for report generation.
     * Extracts key comparison information including scores, winners, and explanations
     * from comparison results and formats them for tabular display.
     * 
     * @param {string[]} pdfList - List of PDF document names being compared
     * @param {ComparisonResult[]} comparisonResults - Array of comparison results to process
     * @returns {any[]} Array of formatted report entries with comparison data
     * @static
     */
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

    /**
     * Prepares detailed criterion-level evaluation data for reporting.
     * Extracts individual criterion evaluations from comparison results,
     * including scores, analysis, and reasoning for each criterion.
     * 
     * @param {ComparisonResult[]} comparisonResults - Array of comparison results containing criterion evaluations
     * @returns {any[]} Array of formatted criterion evaluation entries
     * @static
     */
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
}
// All score aggregation and win/loss logic has been removed for prompt-based evaluation.
