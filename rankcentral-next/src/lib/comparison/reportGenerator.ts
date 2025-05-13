// src/lib/comparison/reportGenerator.ts
import { ComparisonResult, ReportData } from './types';
import { ComparisonDataProcessor } from './dataProcessor';

export class ReportGenerator {
	/**
	 * Generate a report from comparison results
	 */
	async generateReport(
		pdfList: string[],
		comparisonResults: ComparisonResult[],
		folderName: string = "Report"
	): Promise<ReportData> {
		console.log(`Generating report with folder name: '${folderName}'`);
		const startTime = Date.now();

		const reportData = ComparisonDataProcessor.prepareReportData(pdfList, comparisonResults);
		const criterionData = ComparisonDataProcessor.prepareCriterionData(comparisonResults);
		const winCounts = ComparisonDataProcessor.calculateWinCounts(pdfList, comparisonResults);
		const criterionSummary = ComparisonDataProcessor.prepareCriterionSummary(pdfList, comparisonResults);

		const report: ReportData = {
			overview: reportData,
			criterionDetails: criterionData,
			winCounts,
			criterionSummary
		};

		const endTime = Date.now();
		console.log(`Report generation completed in ${((endTime - startTime) / 1000).toFixed(2)} seconds`);

		return report;
	}

	/**
	 * Export report to JSON format
	 */
	exportReportToJSON(reportData: ReportData): string {
		return JSON.stringify(reportData, null, 2);
	}

	/**
	 * Export report overview to CSV format
	 */
	exportOverviewToCSV(reportData: ReportData): string {
		const { overview } = reportData;
		if (!overview || overview.length === 0) {
			return '';
		}

		const headers = Object.keys(overview[0]);
		let csv = headers.join(',') + '\n';

		for (const row of overview) {
			const values = headers.map(header => {
				const value = row[header];
				if (typeof value === 'string' && value.includes(',')) {
					return `"${value.replace(/"/g, '""')}"`;
				}
				return value;
			});
			csv += values.join(',') + '\n';
		}

		return csv;
	}

	/**
	 * Export criterion details to CSV format
	 */
	exportCriterionDetailsToCSV(reportData: ReportData): string {
		const { criterionDetails } = reportData;
		if (!criterionDetails || criterionDetails.length === 0) {
			return '';
		}

		const headers = Object.keys(criterionDetails[0]);
		let csv = headers.join(',') + '\n';

		for (const row of criterionDetails) {
			const values = headers.map(header => {
				const value = row[header];
				if (typeof value === 'string' && value.includes(',')) {
					return `"${value.replace(/"/g, '""')}"`;
				}
				return value;
			});
			csv += values.join(',') + '\n';
		}

		return csv;
	}

	/**
	 * Export win counts to CSV format
	 */
	exportWinCountsToCSV(reportData: ReportData): string {
		const { winCounts } = reportData;
		let csv = 'Document,Win Count\n';

		const sortedEntries = Object.entries(winCounts)
			.sort(([, countA], [, countB]) => countB - countA);

		for (const [document, count] of sortedEntries) {
			const docValue = document.includes(',') ? `"${document.replace(/"/g, '""')}"` : document;
			csv += `${docValue},${count}\n`;
		}

		return csv;
	}

	/**
	 * Export criterion summary to CSV format
	 */
	exportCriterionSummaryToCSV(reportData: ReportData): string {
		const { criterionSummary } = reportData;
		if (!criterionSummary || criterionSummary.length === 0) {
			return '';
		}

		const headers = Object.keys(criterionSummary[0]);
		let csv = headers.join(',') + '\n';

		const sortedSummary = [...criterionSummary]
			.sort((a, b) => b['Win Count'] - a['Win Count']);

		for (const row of sortedSummary) {
			const values = headers.map(header => {
				const value = row[header];
				if (typeof value === 'string' && value.includes(',')) {
					return `"${value.replace(/"/g, '""')}"`;
				}
				return value;
			});
			csv += values.join(',') + '\n';
		}

		return csv;
	}
}
