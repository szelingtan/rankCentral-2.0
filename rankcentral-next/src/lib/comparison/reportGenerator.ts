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
      
      // Sanitize folder name for file system use
      const sanitizedFolderName = this.sanitizeFolderName(folderName);
      const csvFiles: CsvFile[] = [];
      
      // Generate unique report ID to include in filenames
      const reportId = uuidv4().substring(0, 8);
      
      // Generate CSV content for different report sections
      if (reportData.overview && Array.isArray(reportData.overview) && reportData.overview.length > 0) {
        try {
          const csvContent = this.exportOverviewToCSV(reportData);
          csvFiles.push({ [`${sanitizedFolderName}/${SHEET_NAMES.overall}_${reportId}.csv`]: csvContent });
        } catch (error) {
          console.error('Error generating overview CSV:', error);
        }
      }
      
      if (reportData.criterionDetails && Array.isArray(reportData.criterionDetails) && reportData.criterionDetails.length > 0) {
        try {
          const csvContent = this.exportCriterionDetailsToCSV(reportData);
          csvFiles.push({ [`${sanitizedFolderName}/${SHEET_NAMES.criteria}_${reportId}.csv`]: csvContent });
        } catch (error) {
          console.error('Error generating criterion details CSV:', error);
        }
      }
      
      if (reportData.winCounts && typeof reportData.winCounts === 'object') {
        try {
          const csvContent = this.exportWinCountsToCSV(reportData);
          csvFiles.push({ [`${sanitizedFolderName}/${SHEET_NAMES.wins}_${reportId}.csv`]: csvContent });
        } catch (error) {
          console.error('Error generating win counts CSV:', error);
        }
      }
      
      if (reportData.criterionSummary && Array.isArray(reportData.criterionSummary) && reportData.criterionSummary.length > 0) {
        try {
          const csvContent = this.exportCriterionSummaryToCSV(reportData);
          csvFiles.push({ [`${sanitizedFolderName}/${SHEET_NAMES.scores}_${reportId}.csv`]: csvContent });
        } catch (error) {
          console.error('Error generating criterion summary CSV:', error);
        }
      }
      
      // Additionally export full JSON data for debugging or advanced usage
      try {
        const jsonContent = this.exportReportToJSON(reportData);
        csvFiles.push({ [`${sanitizedFolderName}/full_report_${reportId}.json`]: jsonContent });
      } catch (error) {
        console.error('Error generating JSON export:', error);
      }
      
      console.log(`Generated ${csvFiles.length} export files in folder '${sanitizedFolderName}'`);
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
        return this.formatCsvValue(value);
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
        return this.formatCsvValue(value);
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
