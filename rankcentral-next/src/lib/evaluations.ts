// src/lib/evaluations.ts
import ApiClient from './comparison/apiClient';

/**
 * Updates the name of a report
 * @param reportId The ID of the report to update
 * @param newName The new name for the report
 * @returns A promise that resolves to an object indicating success or failure
 */
export async function updateReportName(
  reportId: string, 
  newName: string
): Promise<{ success: boolean; message?: string }> {
  try {
    const apiClient = new ApiClient();
    const result = await apiClient.updateReportName(reportId, newName);
    return { success: true };
  } catch (error) {
    console.error('Error updating report name:', error);
    return { 
      success: false, 
      message: error instanceof Error ? error.message : 'Failed to update report name'
    };
  }
}