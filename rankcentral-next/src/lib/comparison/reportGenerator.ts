// src/lib/comparison/reportGenerator.ts
import { ComparisonResult, ReportData } from './types';
import { ComparisonDataProcessor } from './dataProcessor';
import { SHEET_NAMES } from './report_constants';
import { v4 as uuidv4 } from 'uuid';
import { sanitizeString } from '@/lib/utils/string-utils';

interface CsvFile {
  [filename: string]: string;
}

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
   * Create a set of CSV files from report data
   * @param reportData - Report data to convert to CSV files
   * @param folderName - Optional name for the virtual folder
   * @returns Array of objects containing filename and content
   */
  createCsvFiles(reportData: ReportData, folderName: string = "csv_reports"): CsvFile[] {
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
      
      // Generate Report Summary CSV (final rankings of all documents)
      if (reportData.winCounts && typeof reportData.winCounts === 'object') {
        try {
          const csvContent = this.exportReportSummaryToCSV(reportData);
          csvFiles.push({ [`${SHEET_NAMES.summary}.csv`]: csvContent });
        } catch (error) {
          console.error('Error generating report summary CSV:', error);
        }
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
      
      // JSON export disabled as per requirements
      
      console.log(`Generated ${csvFiles.length} CSV export files`);
      return csvFiles;
    } catch (error) {
      console.error('Error creating CSV files:', error);
      return [];
    }
  }

  /**
   * Export report to JSON format
   */
  exportReportToJSON(reportData: ReportData): string {
    return JSON.stringify(reportData, null, 2);
  }

  /**
   * Export report summary to CSV format (final rankings of all documents)
   */
  exportReportSummaryToCSV(reportData: ReportData): string {
    const { winCounts } = reportData;
    if (!winCounts) {
      return '';
    }
    
    let csv = 'Rank,Document\n';

    // Get sorted documents by win count
    const sortedEntries = Object.entries(winCounts)
      .sort(([, countA], [, countB]) => countB - countA);
    
    // Create a simple ranking of documents
    let rank = 1;
    for (const [document] of sortedEntries) {
      const docValue = this.formatCsvValue(document);
      csv += `${rank},${docValue}\n`;
      rank++;
    }

    return csv;
  }

  /**
   * Export pairwise comparisons to CSV format (detailed comparison results)
   */
  exportPairwiseComparisonsToCSV(reportData: ReportData): string {
    const { criterionDetails } = reportData;
    if (!criterionDetails || criterionDetails.length === 0) {
      return '';
    }

    // Construct enhanced headers for the pairwise comparison
    const baseHeaders = Object.keys(criterionDetails[0]);
    
    // Add additional headers for clarity
    const headers = baseHeaders.includes('Criterion') && baseHeaders.includes('Reasoning') ? 
      baseHeaders :
      ['Comparison ID', 'Document A', 'Document B', 'Criterion', 'Winner', 'Score', 'Reasoning'];
    
    let csv = headers.join(',') + '\n';

    for (const row of criterionDetails) {
      const values = headers.map(header => {
        let value = row[header];
        if (header === 'Comparison ID' && !row[header]) {
          // Generate a comparison ID if not present
          value = `${row['Document A']}_vs_${row['Document B']}_${row['Criterion']}`.replace(/\s+/g, '_');
        }
        return this.formatCsvValue(value);
      });
      csv += values.join(',') + '\n';
    }

    return csv;
  }
  
  /**
   * Legacy export methods kept for backwards compatibility
   */
  exportOverviewToCSV(reportData: ReportData): string {
    console.warn('exportOverviewToCSV is deprecated. Use exportReportSummaryToCSV instead.');
    return this.exportReportSummaryToCSV(reportData);
  }
  
  exportCriterionDetailsToCSV(reportData: ReportData): string {
    console.warn('exportCriterionDetailsToCSV is deprecated. Use exportPairwiseComparisonsToCSV instead.');
    return this.exportPairwiseComparisonsToCSV(reportData);
  }
  
  exportWinCountsToCSV(reportData: ReportData): string {
    console.warn('exportWinCountsToCSV is deprecated. Use exportReportSummaryToCSV instead.');
    
    // For backwards compatibility, provide win counts even though new format doesn't use them
    const { winCounts } = reportData;
    if (!winCounts) {
      return '';
    }
    
    let csv = 'Document,Win Count\n';
    const sortedEntries = Object.entries(winCounts)
      .sort(([, countA], [, countB]) => countB - countA);

    for (const [document, count] of sortedEntries) {
      const docValue = this.formatCsvValue(document);
      csv += `${docValue},${count}\n`;
    }

    return csv;
  }
  
  exportCriterionSummaryToCSV(reportData: ReportData): string {
    console.warn('exportCriterionSummaryToCSV is deprecated.');
    
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
        return this.formatCsvValue(value);
      });
      csv += values.join(',') + '\n';
    }

    return csv;
  }
  
  /**
   * Format a value for CSV export, escaping special characters and handling different data types
   * @param value The value to format
   * @returns Formatted string ready for CSV
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
   * Sanitize folder name to ensure it's valid for file systems
   * @param folderName Original folder name
   * @returns Sanitized folder name
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
