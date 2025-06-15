/**
 * @fileoverview API client for document comparison and ranking operations.
 * Provides methods for uploading documents, running comparisons, and managing reports.
 */

// src/lib/comparison/apiClient.ts
import { ComparisonOptions, ComparisonResult, Document, Criterion, Report, ReportSummary } from './types';

/**
 * Client for making API calls to the document comparison backend.
 * Handles HTTP requests for document operations, comparisons, and report management.
 * @class ApiClient
 */
export default class ApiClient {
	/** @type {string} Base URL for API endpoints */
	private baseUrl: string;

	/**
	 * Creates a new ApiClient instance.
	 * @param {string} [baseUrl='/api'] - Base URL for API endpoints
	 */
	constructor(baseUrl: string = '/api') {
		this.baseUrl = baseUrl;
	}

	/**
	 * Upload documents for comparison.
	 * @async
	 * @param {File[]} files - Array of files to upload
	 * @returns {Promise<{success: boolean, documents: Document[]}>} Upload result with document metadata
	 * @throws {Error} If upload fails or server returns error
	 */
	async uploadDocuments(files: File[]): Promise<{ success: boolean; documents: Document[] }> {
		try {
			const formData = new FormData();
			files.forEach(file => {
				formData.append('files[]', file);
			});

			const response = await fetch(`${this.baseUrl}/documents/upload`, {
				method: 'POST',
				body: formData,
			});

			if (!response.ok) {
				const errorData = await response.json();
				throw new Error(errorData.error || 'Upload failed');
			}

			return await response.json();
		} catch (error) {
			console.error('Error uploading documents:', error);
			throw error;
		}
	}

	/**
	 * Compare documents using specified criteria and evaluation method.
	 * @async
	 * @param {Document[]} documents - Documents to compare
	 * @param {ComparisonOptions} options - Comparison configuration options
	 * @returns {Promise<{success: boolean, results: ComparisonResult[], ranking: string[]}>} Comparison results and ranking
	 * @throws {Error} If comparison fails or server returns error
	 */
	async compareDocuments(
		documents: Document[],
		options: ComparisonOptions
	): Promise<{ success: boolean; results: ComparisonResult[]; ranking: string[]; report_id?: string }> {
		try {
			const response = await fetch(`${this.baseUrl}/documents/compare-documents`, {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
				},
				body: JSON.stringify({
					documents,
					criteria: options.criteria,
					evaluationMethod: options.evaluationMethod,
					customPrompt: options.customPrompt,
					reportName: options.reportName,
					modelName: options.modelName,
				}),
			});

			if (!response.ok) {
				const errorData = await response.json();
				throw new Error(errorData.error || 'Comparison failed');
			}

			return await response.json();
		} catch (error) {
			console.error('Error comparing documents:', error);
			throw error;
		}
	}

	/**
	 * Get default evaluation criteria.
	 * @async
	 * @returns {Promise<{success: boolean, criteria: Criterion[]}>} Default criteria configuration
	 * @throws {Error} If request fails or server returns error
	 */
	async getDefaultCriteria(): Promise<{ success: boolean; criteria: Criterion[] }> {
		try {
			const response = await fetch(`${this.baseUrl}/criteria/default`);

			if (!response.ok) {
				const errorData = await response.json();
				throw new Error(errorData.error || 'Failed to get default criteria');
			}

			return await response.json();
		} catch (error) {
			console.error('Error getting default criteria:', error);
			throw error;
		}
	}

	/**
	 * Get report history for the current user.
	 * @async
	 * @returns {Promise<{success: boolean, reports: ReportSummary[]}>} List of user's reports
	 * @throws {Error} If request fails or server returns error
	 */
	async getReportHistory(): Promise<{ success: boolean; reports: ReportSummary[] }> {
		try {
			const response = await fetch(`${this.baseUrl}/reports/history`);

			if (!response.ok) {
				const errorData = await response.json();
				throw new Error(errorData.error || 'Failed to get report history');
			}

			return await response.json();
		} catch (error) {
			console.error('Error getting report history:', error);
			throw error;
		}
	}

	/**
	 * Get detailed information for a specific report.
	 * @async
	 * @param {string} reportId - Unique identifier of the report
	 * @returns {Promise<{success: boolean, report: Report}>} Complete report data
	 * @throws {Error} If request fails or server returns error
	 */
	async getReportDetails(reportId: string): Promise<{ success: boolean; report: Report }> {
		try {
			const response = await fetch(`${this.baseUrl}/reports/${encodeURIComponent(reportId)}`);

			if (!response.ok) {
				const errorData = await response.json();
				throw new Error(errorData.error || 'Failed to get report details');
			}

			return await response.json();
		} catch (error) {
			console.error('Error getting report details:', error);
			throw error;
		}
	}

	/**
	 * Download report as ZIP file.
	 * @async
	 * @param {string} reportId - Unique identifier of the report
	 * @returns {Promise<Blob>} ZIP file blob containing report data
	 * @throws {Error} If download fails or server returns error
	 */
	async downloadReport(reportId: string): Promise<Blob> {
		try {
			const response = await fetch(`${this.baseUrl}/reports/${encodeURIComponent(reportId)}/download`);

			if (!response.ok) {
				const errorData = await response.json();
				throw new Error(errorData.error || 'Failed to download report');
			}

			return await response.blob();
		} catch (error) {
			console.error('Error downloading report:', error);
			throw error;
		}
	}

	/**
	 * Update the name of an existing report.
	 * @async
	 * @param {string} reportId - Unique identifier of the report
	 * @param {string} newName - New name for the report
	 * @returns {Promise<{success: boolean}>} Update operation result
	 * @throws {Error} If update fails or server returns error
	 */
	async updateReportName(reportId: string, newName: string): Promise<{ success: boolean }> {
		try {
			const response = await fetch(`${this.baseUrl}/reports/update-name`, {
				method: 'PATCH',
				headers: {
					'Content-Type': 'application/json',
				},
				body: JSON.stringify({
					reportId: reportId,
					newName: newName,
				}),
			});

			if (!response.ok) {
				const errorData = await response.json();
				throw new Error(errorData.error || 'Failed to update report name');
			}

			return await response.json();
		} catch (error) {
			console.error('Error updating report name:', error);
			throw error;
		}
	}

	/**
	 * Check the health status of the backend API.
	 * @async
	 * @returns {Promise<{isHealthy: boolean, message: string}>} Backend health status
	 * @throws {Error} If health check fails
	 */
	async checkBackendHealth(): Promise<{ isHealthy: boolean; message: string }> {
		try {
			const response = await fetch(`${this.baseUrl}/health`);

			if (!response.ok) {
				const errorData = await response.json();
				throw new Error(errorData.error || 'Backend health check failed');
			}

			return await response.json();
		} catch (error) {
			console.error('Error checking backend health:', error);
			throw error;
		}
	}

	/**
	 * Get pairwise comparison results for a specific report.
	 * @async
	 * @param {string} reportId - Unique identifier of the report
	 * @returns {Promise<{success: boolean, results: ComparisonResult[]}>} Detailed pairwise comparison data
	 * @throws {Error} If request fails or server returns error
	 */
	async getPairwiseComparisonResults(reportId: string): Promise<{ success: boolean; results: ComparisonResult[] }> {
		try {
			const response = await fetch(`${this.baseUrl}/reports/${encodeURIComponent(reportId)}/pairwise-comparison`);

			if (!response.ok) {
				const errorData = await response.json();
				throw new Error(errorData.error || 'Failed to get pairwise comparison results');
			}

			return await response.json();
		} catch (error) {
			console.error('Error getting pairwise comparison results:', error);
			throw error;
		}
	}

}
