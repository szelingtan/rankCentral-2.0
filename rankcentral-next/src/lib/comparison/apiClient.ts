// src/lib/comparison/apiClient.ts
import { ComparisonOptions, ComparisonResult, Document } from './types';

/**
 * Client for making API calls to the document comparison backend
 */
export default class ApiClient {
	private baseUrl: string;

	constructor(baseUrl: string = '/api') {
		this.baseUrl = baseUrl;
	}

	/**
	 * Upload documents for comparison
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
	 * Compare documents
	 */
	async compareDocuments(
		documents: Document[],
		options: ComparisonOptions
	): Promise<{ success: boolean; results: ComparisonResult[]; ranking: string[] }> {
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
	 * Get default criteria
	 */
	async getDefaultCriteria(): Promise<{ success: boolean; criteria: any[] }> {
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
	 * Get report history
	 */
	async getReportHistory(): Promise<{ success: boolean; reports: any[] }> {
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
	 * Get report details
	 */
	async getReportDetails(reportId: string): Promise<{ success: boolean; report: any }> {
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
	 * Download report as ZIP
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
	 * Update report name
	 */
	async updateReportName(reportId: string, newName: string): Promise<{ success: boolean }> {
		try {
			const response = await fetch(`${this.baseUrl}/reports/update-name`, {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
				},
				body: JSON.stringify({
					timestamp: reportId,
					newName,
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
