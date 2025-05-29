/**
 * @fileoverview Report generation system for document comparison results.
 * Handles the creation of comprehensive reports including overview data,
 * criterion details, rankings, and CSV export functionality. Supports
 * both traditional comparison and merge sort-based ranking systems.
 */

// src/lib/comparison/reportGenerator.ts
import { ComparisonResult, ReportData } from './types';
import { ComparisonDataProcessor } from './dataProcessor';
import { SHEET_NAMES } from './report_constants';
import { v4 as uuidv4 } from 'uuid';
import { sanitizeString } from '@/lib/utils/string-utils';

/**
 * Interface for CSV file data structure.
 * Maps filenames to their string content for export purposes.
 * 
 * @interface CsvFile
 */
interface CsvFile {
  [filename: string]: string;
}

/**
 * Main report generation class that processes comparison results into
 * structured reports and exportable formats. Handles data transformation,
 * CSV generation, and report compilation for document comparison analysis.
 * 
 * @class ReportGenerator
 */
export class ReportGenerator {
  /**
   * Generates a comprehensive report from comparison results.
   * Processes comparison data, criterion evaluations, and document rankings
   * into a structured report format suitable for analysis and export.
   * 
   * @param {string[]} pdfList - List of PDF document names being compared
   * @param {ComparisonResult[]} comparisonResults - Array of comparison results to process
   * @param {string} [folderName="Report"] - Name for the report folder/category
   * @param {string[]} [documentsOrder] - Optional ordered list of documents from merge sort ranking
   * @returns {Promise<ReportData>} Promise resolving to structured report data
   * @async
   */
  async generateReport(
    pdfList: string[],
    comparisonResults: ComparisonResult[],
    folderName: string = "Report",
    documentsOrder?: string[] // Add parameter for merge sort results
  ): Promise<ReportData> {
    console.log(`Generating report with folder name: '${folderName}'`);
    const startTime = Date.now();

    const reportData = ComparisonDataProcessor.prepareReportData(pdfList, comparisonResults);
    const criterionData = ComparisonDataProcessor.prepareCriterionData(comparisonResults);
    
    const report: ReportData = {
      overview: reportData,
      criterionDetails: criterionData,
      ranking: documentsOrder || pdfList // Use documentsOrder if provided, otherwise fall back to original list
    };

    const endTime = Date.now();
    console.log(`Report generation completed in ${((endTime - startTime) / 1000).toFixed(2)} seconds`);

    return report;
  }

  /**
   * Creates CSV files from report data for export purposes.
   * Converts structured report data into CSV format with multiple sheets
   * for different aspects of the comparison analysis.
   * 
   * @param {ReportData} reportData - Report data to convert to CSV files
   * @param {string} [folderName="csv_reports"] - Optional name for the virtual folder
   * @param {string[]} [documentsOrder] - Order of documents from merge sort for unified ranking
   * @returns {CsvFile[]} Array of objects containing filename and CSV content
   */
  createCsvFiles(reportData: ReportData, folderName: string = "csv_reports", documentsOrder?: string[]): CsvFile[] {
    try {
      // Input validation
      if (!reportData) {
        console.error('Invalid report data provided');
        return [];
      }
      
      // Sanitized folder name kept for potential future use, but currently not used in file paths
      const sanitizedFolderName = this.sanitizeFolderName(folderName);
      const csvFiles: CsvFile[] = [];
      
      // Report ID generated but no longer used in filenames
      const reportId = uuidv4().substring(0, 8);
      

      
      // Generate Report Summary CSV (final rankings of all documents) - Always generate this
      try {
        const csvContent = this.exportReportSummaryToCSV(reportData, documentsOrder);
        csvFiles.push({ [`${SHEET_NAMES.summary}.csv`]: csvContent });
      } catch (error) {
        console.error('Error generating report summary CSV:', error);
      }
      
      // Generate Pairwise Comparisons CSV (detailed comparison results)
      if (reportData.criterionDetails && Array.isArray(reportData.criterionDetails) && reportData.criterionDetails.length > 0) {
        try {
          const csvContent = this.exportPairwiseComparisonsToCSV(reportData);
          csvFiles.push({ [`${SHEET_NAMES.pairwise}.csv`]: csvContent });
        } catch (error) {
          console.error('Error generating pairwise comparisons CSV:', error);
        }
      }
      
      // Generate Condensed Pairwise Comparisons CSV
      try {
        const condensedCsvContent = this.exportCondensedPairwiseComparisonsToCSV(reportData);
        csvFiles.push({ 'Condensed Pairwise Comparisons.csv': condensedCsvContent });
      } catch (error) {
        console.error('Error generating condensed pairwise comparisons CSV:', error);
      }
      
      // JSON export disabled as per requirements
      
      console.log(`Generated ${csvFiles.length} CSV export files`);
      return csvFiles;
    } catch (error) {
      console.error('Error creating CSV files:', error);
      return [];
    }
  }

  /**
   * Exports report data to JSON format.
   * Provides a structured JSON representation of the complete report data
   * for programmatic access and storage.
   * 
   * @param {ReportData} reportData - Report data to convert to JSON
   * @returns {string} JSON string representation of the report data
   */
  exportReportToJSON(reportData: ReportData): string {
    return JSON.stringify(reportData, null, 2);
  }

  /**
   * Exports report summary to CSV format showing final document rankings.
   * Creates a ranked list of documents based on merge sort results or fallback methods.
   * 
   * @param {ReportData} reportData - Report data containing ranking information
   * @param {string[]} [documentsOrder] - Optional explicit document order from merge sort
   * @returns {string} CSV string with ranked document list
   */
  exportReportSummaryToCSV(reportData: ReportData, documentsOrder?: string[]): string {
    let csv = 'Rank,Document\n';

    // Priority 1: Use explicit documentsOrder if provided (from function parameter)
    if (documentsOrder && documentsOrder.length > 0) {
      documentsOrder.forEach((document, index) => {
        const docValue = this.formatCsvValue(document);
        csv += `${index + 1},${docValue}\n`;
      });
      return csv;
    }
    
    // Priority 2: Use ranking from report data (from merge sort)
    if (reportData.ranking && reportData.ranking.length > 0) {
      reportData.ranking.forEach((document, index) => {
        const docValue = this.formatCsvValue(document);
        csv += `${index + 1},${docValue}\n`;
      });
      return csv;
    }
    
    // If no ranking information is available
    return 'Rank,Document\n1,No ranking data available\n';
  }

  /**
   * Exports detailed pairwise comparison results to CSV format.
   * Creates a comprehensive table showing all criterion evaluations,
   * scores, analysis, and reasoning for each comparison pair.
   * 
   * @param {ReportData} reportData - Report data containing criterion details
   * @returns {string} CSV string with detailed comparison results
   */
  exportPairwiseComparisonsToCSV(reportData: ReportData): string {
    const { criterionDetails } = reportData;
    if (!criterionDetails || criterionDetails.length === 0) {
      // Instead of returning an empty string, create a minimal placeholder row
      // to ensure the file is not empty
      const headers = [
        'No.',
        'Criterion',
        'Document A Name',
        'Document A Score',
        'Document A Analysis',
        'Document B Name',
        'Document B Score',
        'Document B Analysis',
        'Detailed Reasoning'
      ];
      
      let csv = headers.join(',') + '\n';
      csv += '1,No comparison data available,,,,,,,\n';
      return csv;
    }

    // Define the new headers according to the required structure
    const headers = [
      'No.',
      'Criterion',
      'Document A Name',
      'Document A Score',
      'Document A Analysis',
      'Document B Name',
      'Document B Score',
      'Document B Analysis',
      'Detailed Reasoning'
    ];
    
    let csv = headers.join(',') + '\n';

    // Extract document names from the comparison field (e.g., "DocA vs DocB")
    criterionDetails.forEach((row, index) => {
      // Get criterion name - use criterionName if available, otherwise check if the evaluation method is prompt-based
      let criterion = row['Criterion Name'] || row['criterionName'] || 'Unknown Criterion';
      
      // For custom prompt evaluations, keep the criterion name consistent with UI ranking
      // Don't replace with the actual prompt text to maintain ranking consistency
      if (row['evaluationMethod'] === 'prompt' || (reportData as any).evaluationMethod === 'prompt') {
        // Use consistent criterion name for custom prompt evaluations
        criterion = 'Custom Evaluation';
      }

      // Extract document names
      let documentA = '';
      let documentB = '';
      
      if (row['Comparison'] && typeof row['Comparison'] === 'string') {
        const parts = row['Comparison'].split(' vs ');
        if (parts.length === 2) {
          documentA = parts[0].trim();
          documentB = parts[1].trim();
        }
      } else {
        documentA = row['Document A'] || '';
        documentB = row['Document B'] || '';
      }
      
      // Handle scores and analysis
      const docAScore = row['Document A Score'] !== undefined ? row['Document A Score'] : '';
      const docBScore = row['Document B Score'] !== undefined ? row['Document B Score'] : '';
      const docAAnalysis = row['Document A Analysis'] || '';
      const docBAnalysis = row['Document B Analysis'] || '';
      
      // Get the detailed reasoning (may be in different fields depending on data structure)
      const detailedReasoning = row['Detailed Reasoning'] || row['Reasoning'] || row['Comparative Analysis'] || 'No reasoning provided';

      // Build the row values
      const rowNumber = index + 1;
      const values = [
        rowNumber,
        this.formatCsvValue(criterion),
        this.formatCsvValue(documentA),
        this.formatCsvValue(docAScore),
        this.formatCsvValue(docAAnalysis),
        this.formatCsvValue(documentB),
        this.formatCsvValue(docBScore),
        this.formatCsvValue(docBAnalysis),
        this.formatCsvValue(detailedReasoning)
      ];
      
      csv += values.join(',') + '\n';
    });
    
    return csv;
  }
  
  /**
   * Exports a condensed pairwise comparison CSV with only Document A, Document B, and Detailed Reasoning columns.
   * @param {ReportData} reportData - Report data containing criterion details
   * @returns {string} CSV string with condensed pairwise comparison results
   */
  exportCondensedPairwiseComparisonsToCSV(reportData: ReportData): string {
    const { criterionDetails } = reportData;
    const headers = [
      'No.',
      'Document A',
      'Document B',
      'Detailed Reasoning'
    ];
    let csv = headers.join(',') + '\n';
    if (!criterionDetails || criterionDetails.length === 0) {
      csv += ',,,No comparison data available\n';
      return csv;
    }
    criterionDetails.forEach((row, index) => {
      // Extract document names
      let documentA = '';
      let documentB = '';
      if (row['Comparison'] && typeof row['Comparison'] === 'string') {
        const parts = row['Comparison'].split(' vs ');
        if (parts.length === 2) {
          documentA = parts[0].trim();
          documentB = parts[1].trim();
        }
      } else {
        documentA = row['Document A'] || '';
        documentB = row['Document B'] || '';
      }
      // Get the detailed reasoning (may be in different fields depending on data structure)
      const detailedReasoning = row['Detailed Reasoning'] || row['Reasoning'] || row['Comparative Analysis'] || 'No reasoning provided';
      const values = [
        index + 1,
        this.formatCsvValue(documentA),
        this.formatCsvValue(documentB),
        this.formatCsvValue(detailedReasoning)
      ];
      csv += values.join(',') + '\n';
    });
    return csv;
  }
  
  /**
   * Legacy export methods maintained for backwards compatibility.
   * These methods are deprecated and redirect to newer implementations.
   */
  
  /**
   * @deprecated Use exportReportSummaryToCSV instead
   * @param {ReportData} reportData - Report data to export
   * @returns {string} CSV string with overview data
   */
  exportOverviewToCSV(reportData: ReportData): string {
    console.warn('exportOverviewToCSV is deprecated. Use exportReportSummaryToCSV instead.');
    return this.exportReportSummaryToCSV(reportData);
  }
  
  /**
   * @deprecated Use exportPairwiseComparisonsToCSV instead
   * @param {ReportData} reportData - Report data to export
   * @returns {string} CSV string with criterion details
   */
  exportCriterionDetailsToCSV(reportData: ReportData): string {
    console.warn('exportCriterionDetailsToCSV is deprecated. Use exportPairwiseComparisonsToCSV instead.');
    return this.exportPairwiseComparisonsToCSV(reportData);
  }
  
  /**
   * @deprecated This method is no longer supported
   * @param {ReportData} reportData - Report data to export
   * @returns {string} Empty or minimal CSV string
   */
  exportCriterionSummaryToCSV(reportData: ReportData): string {
    console.warn('exportCriterionSummaryToCSV is deprecated.');
    
    const { criterionSummary } = reportData;
    if (!criterionSummary || criterionSummary.length === 0) {
      return '';
    }

    const headers = Object.keys(criterionSummary[0]);
    let csv = headers.join(',') + '\n';

    // No sorting needed as this is deprecated
    const sortedSummary = [...criterionSummary];

    for (const row of sortedSummary) {
      const values = headers.map(header => {
        const value = row[header];
        return this.formatCsvValue(value);
      });
      csv += values.join(',') + '\n';
    }

    return csv;
  }
  
  /**
   * Formats a value for CSV export by escaping special characters and handling different data types.
   * Ensures proper CSV formatting by wrapping values with special characters in quotes
   * and escaping internal quotes.
   * 
   * @param {any} value - The value to format for CSV export
   * @returns {string} Formatted string ready for CSV inclusion
   * @private
   */
  private formatCsvValue(value: any): string {
    if (value === null || value === undefined) {
      return '';
    }
    
    if (typeof value === 'string') {
      // Escape quotes and wrap in quotes if contains special chars
      if (value.includes(',') || value.includes('"') || value.includes('\n')) {
        return `"${value.replace(/"/g, '""')}"`;
      }
      return value;
    }
    
    if (typeof value === 'number' || typeof value === 'boolean') {
      return String(value);
    }
    
    if (typeof value === 'object') {
      try {
        // Convert objects to JSON strings and escape properly
        return `"${JSON.stringify(value).replace(/"/g, '""')}"`;
      } catch (error) {
        console.error('Error serializing object for CSV:', error);
        return '';
      }
    }
    
    return String(value);
  }

  /**
   * Sanitizes folder names to ensure they are valid for file systems.
   * Removes invalid characters and generates unique names when necessary.
   * Includes timestamp and UUID components for uniqueness.
   * 
   * @param {string} folderName - Original folder name to sanitize
   * @returns {string} Sanitized folder name safe for file system use
   */
  sanitizeFolderName(folderName: string): string {
    if (!folderName || folderName.trim() === '') {
      // Generate a unique folder name with timestamp and UUID
      const timestamp = new Date().toISOString().replace(/:/g, '-').split('.')[0];
      const uniqueId = uuidv4().substring(0, 8);
      return `csv_reports_${timestamp}_${uniqueId}`;
    }
    
    // Use the imported sanitizeString utility for basic sanitization
    let sanitized = sanitizeString(folderName);
    
    // Ensure the name is suitable for file systems
    if (!sanitized || sanitized.length === 0) {
      const uniqueId = uuidv4().substring(0, 8);
      sanitized = `report_${uniqueId}`;
    }
    
    // Limit length
    if (sanitized.length > 50) {
      const uniqueId = uuidv4().substring(0, 8);
      sanitized = `${sanitized.substring(0, 38)}_${uniqueId}`;
    }
    
    return sanitized;
  }
}

export default ReportGenerator;
