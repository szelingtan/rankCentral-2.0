// src/lib/utils/report-utils.ts

import { v4 as uuidv4 } from 'uuid';
import JSZip from 'jszip';

/**
 * Generate a unique report ID
 * @returns A unique report ID
 */
export function getReportId(): string {
	return uuidv4();
}

/**
 * Format a timestamp for display or file names
 * @param timestamp ISO timestamp string
 * @returns Formatted date string
 */
export function formatTimestamp(timestamp: string): string {
	try {
		const date = new Date(timestamp);
		return date.toLocaleString('en-US', { // need to change to sg time
			year: 'numeric',
			month: 'short',
			day: '2-digit',
			hour: '2-digit',
			minute: '2-digit',
			second: '2-digit',
			hour12: true
		});
	} catch (e) {
		console.error(`Error formatting timestamp: ${e}`);
		return timestamp;
	}
}

/**
 * Create a ZIP file from report data
 * @param reportData Report data to include in the ZIP
 * @returns Blob containing the ZIP file
 */
export async function createZipFromReportData(reportData: any): Promise<Blob | null> {
	try {
		const zip = new JSZip();

		const metadata = {
			report_id: reportData.report_id,
			timestamp: reportData.timestamp,
			documents: reportData.documents,
			top_ranked: reportData.top_ranked,
			criteria_count: reportData.criteria_count,
			evaluation_method: reportData.evaluation_method,
			custom_prompt: reportData.custom_prompt,
			report_name: reportData.report_name
		};

		zip.file('metadata.json', JSON.stringify(metadata, null, 2));

		if (reportData.comparison_details) {
			zip.file('comparison_details.json', JSON.stringify(reportData.comparison_details, null, 2));
		}

		if (reportData.csv_files && Array.isArray(reportData.csv_files)) {
			const csvFolder = zip.folder('csv_data');

			for (const fileObj of reportData.csv_files) {
				for (const [filename, content] of Object.entries(fileObj)) {
					csvFolder?.file(filename, content as string);
				}
			}
		}

		return await zip.generateAsync({ type: 'blob' });
	} catch (e) {
		console.error(`Error creating ZIP file: ${e}`);
		return null;
	}
}

/**
 * Download a file
 * @param blob File content as a Blob
 * @param filename Name to save the file as
 */
export function downloadFile(blob: Blob, filename: string): void {
	const url = URL.createObjectURL(blob);
	const a = document.createElement('a');
	a.href = url;
	a.download = filename;
	document.body.appendChild(a);
	a.click();

	setTimeout(() => {
		document.body.removeChild(a);
		URL.revokeObjectURL(url);
	}, 100);
}

/**
 * Generate a summary of report results
 * @param report Report data
 * @returns Formatted summary text
 */
export function generateReportSummary(report: any): string {
	try {
		const timestamp = formatTimestamp(report.timestamp);
		const documentCount = report.documents?.length || 0;
		const topRanked = report.top_ranked || 'None';
		const evaluationMethod = report.evaluation_method === 'criteria'
			? `Criteria-based (${report.criteria_count} criteria)`
			: 'Custom prompt';

		return `Report: ${report.report_name || 'Unnamed'}\n` +
			`Created: ${timestamp}\n` +
			`Documents compared: ${documentCount}\n` +
			`Top ranked: ${topRanked}\n` +
			`Evaluation method: ${evaluationMethod}`;
	} catch (e) {
		console.error(`Error generating report summary: ${e}`);
		return 'Error generating report summary';
	}
}
