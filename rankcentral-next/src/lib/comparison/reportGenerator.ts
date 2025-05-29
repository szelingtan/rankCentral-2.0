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
   * @param documentsOrder - Order of documents from merge sort (for unified ranking)
   * @returns Array of objects containing filename and content
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
      
      // Generate Top Document Explanation CSV (explaining why the top document is ranked first)
      try {
        const csvContent = this.exportTopDocumentExplanationToCSV(reportData);
        csvFiles.push({ [`${SHEET_NAMES.explanation}.csv`]: csvContent });
      } catch (error) {
        console.error('Error generating top document explanation CSV:', error);
      }
      
      // Generate Report Summary CSV (final rankings of all documents)
      if (reportData.winCounts && typeof reportData.winCounts === 'object') {
        try {
          const csvContent = this.exportReportSummaryToCSV(reportData, documentsOrder);
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
   * Now uses the same ranking order as the UI (merge sort results)
   */
  exportReportSummaryToCSV(reportData: ReportData, documentsOrder?: string[]): string {
    let csv = 'Rank,Document\n';

    // Use the documents array order if provided (this comes from merge sort results)
    if (documentsOrder && documentsOrder.length > 0) {
      documentsOrder.forEach((document, index) => {
        const docValue = this.formatCsvValue(document);
        csv += `${index + 1},${docValue}\n`;
      });
      return csv;
    }

    // Fallback to win counts for backward compatibility (though this should not be used)
    const { winCounts } = reportData;
    if (!winCounts) {
      return '';
    }

    // Get sorted documents by win count (fallback method)
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
      const detailedReasoning = row['Detailed Reasoning'] || row['Reasoning'] || 
                               row['Comparative Analysis'] || 'No reasoning provided';

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
   * Export explanation for the top-ranked document to CSV format
   */
  exportTopDocumentExplanationToCSV(reportData: ReportData): string {
    const { winCounts, criterionDetails } = reportData;
    if (!winCounts || Object.keys(winCounts).length === 0) {
      return 'Explanation\nNo documents were analyzed in this report.';
    }
    
    // Get all documents sorted by win count to understand the ranking
    const sortedDocEntries = Object.entries(winCounts)
      .sort(([, countA], [, countB]) => countB - countA);
    
    if (sortedDocEntries.length === 0) {
      return 'Explanation\nNo ranking data available.';
    }
    
    const [topDocName, topDocWins] = sortedDocEntries[0];
    const totalDocs = Object.keys(winCounts).length;
    
    // Get clean document name for display (handle cases where topDocName might be empty)
    const topDocDisplayName = topDocName ? (topDocName.split('/').pop() || topDocName) : 'Unknown Document';
    
    // Ensure we have a valid top document name
    if (!topDocName || topDocName.trim() === '') {
      return 'Explanation\nUnable to determine the top-ranked document from the available data.';
    }
    
    // Build a comprehensive explanation of why this document ranks first
    let explanation = `${topDocDisplayName} emerges as the top-ranked document`;
    
    // If we have criterion details, provide detailed analysis
    if (criterionDetails && criterionDetails.length > 0) {
      // Get all comparisons involving the top document
      const topDocComparisons = criterionDetails.filter(item => {
        // Handle both direct field access and Comparison field parsing
        let docAName = '';
        let docBName = '';
        
        if (item['Document A'] && item['Document B']) {
          // Direct field access (from prepareCriterionData)
          docAName = item['Document A'];
          docBName = item['Document B'];
        } else if (item['Comparison'] && typeof item['Comparison'] === 'string') {
          // Parse from Comparison field
          const parts = item['Comparison'].split(' vs ');
          if (parts.length === 2) {
            docAName = parts[0].trim();
            docBName = parts[1].trim();
          }
        }
        
        return docAName === topDocName || docBName === topDocName;
      });
      
      // Get winning comparisons for this document
      const winningCriteria = topDocComparisons.filter(item => {
        // Handle both direct field access and Comparison field parsing
        let docAName = '';
        let docBName = '';
        
        if (item['Document A'] && item['Document B']) {
          docAName = item['Document A'];
          docBName = item['Document B'];
        } else if (item['Comparison'] && typeof item['Comparison'] === 'string') {
          const parts = item['Comparison'].split(' vs ');
          if (parts.length === 2) {
            docAName = parts[0].trim();
            docBName = parts[1].trim();
          }
        }
        
        const winner = item['Winner'];
        return (docAName === topDocName && winner === docAName) || 
               (docBName === topDocName && winner === docBName);
      });
      
      explanation += ` out of ${totalDocs} documents, securing victory in ${topDocWins} head-to-head comparisons.`;
      
      // Analyze performance by criteria
      const criterionPerformance: Record<string, { wins: number, total: number, scores: number[], reasonings: string[] }> = {};
      
      for (const item of topDocComparisons) {
        const criterion = item['Criterion Name'] || item['criterionName'] || 'Unknown Criterion';
        
        // Handle both direct field access and Comparison field parsing
        let docAName = '';
        let docBName = '';
        
        if (item['Document A'] && item['Document B']) {
          docAName = item['Document A'];
          docBName = item['Document B'];
        } else if (item['Comparison'] && typeof item['Comparison'] === 'string') {
          const parts = item['Comparison'].split(' vs ');
          if (parts.length === 2) {
            docAName = parts[0].trim();
            docBName = parts[1].trim();
          }
        }
        
        const winner = item['Winner'];
        const reasoning = item['Detailed Reasoning'] || item['Reasoning'] || item['Comparative Analysis'] || '';
        
        if (!criterionPerformance[criterion]) {
          criterionPerformance[criterion] = { wins: 0, total: 0, scores: [], reasonings: [] };
        }
        
        criterionPerformance[criterion].total += 1;
        
        // Check if top document won this criterion
        if ((docAName === topDocName && winner === docAName) || 
            (docBName === topDocName && winner === docBName)) {
          criterionPerformance[criterion].wins += 1;
        }
        
        // Get the score for the top document
        let topDocScore = 0;
        if (docAName === topDocName) {
          topDocScore = item['Document A Score'] || 0;
        } else if (docBName === topDocName) {
          topDocScore = item['Document B Score'] || 0;
        }
        
        if (topDocScore > 0) {
          criterionPerformance[criterion].scores.push(topDocScore);
        }
        
        // Collect reasoning that mentions strengths
        if (reasoning && reasoning.length > 50) {
          criterionPerformance[criterion].reasonings.push(reasoning);
        }
      }
      
      // Identify strongest criteria (high win rate and scores)
      const strongCriteria = Object.entries(criterionPerformance)
        .filter(([, perf]) => perf.wins / perf.total >= 0.5 && perf.scores.length > 0)
        .sort(([, perfA], [, perfB]) => {
          const winRateA = perfA.wins / perfA.total;
          const winRateB = perfB.wins / perfB.total;
          const avgScoreA = perfA.scores.reduce((sum, score) => sum + score, 0) / perfA.scores.length;
          const avgScoreB = perfB.scores.reduce((sum, score) => sum + score, 0) / perfB.scores.length;
          return (winRateB + avgScoreB/5) - (winRateA + avgScoreA/5);
        })
        .slice(0, 3);
      
      if (strongCriteria.length > 0) {
        explanation += `\n\n${topDocDisplayName} demonstrates exceptional strength across multiple evaluation criteria:`;
        
        strongCriteria.forEach(([criterion, performance], index) => {
          const winRate = Math.round((performance.wins / performance.total) * 100);
          const avgScore = performance.scores.length > 0 
            ? (performance.scores.reduce((sum, score) => sum + score, 0) / performance.scores.length).toFixed(1)
            : 'N/A';
          
          explanation += `\n\n${index + 1}. ${criterion}: Wins ${winRate}% of comparisons with an average score of ${avgScore}/5.0`;
          
          // Add specific reasoning for this criterion
          const bestReasoning = performance.reasonings
            .find(r => r.toLowerCase().includes(topDocDisplayName.toLowerCase()) || 
                      r.toLowerCase().includes('superior') || 
                      r.toLowerCase().includes('excellent') ||
                      r.toLowerCase().includes('outstanding')) ||
            performance.reasonings[0];
          
          if (bestReasoning) {
            // Extract the most relevant sentence about strengths
            const sentences = bestReasoning.split(/[.!?]+/).filter((s: string) => s.trim().length > 20);
            const strengthSentence = sentences.find((s: string) => 
              s.toLowerCase().includes('strength') || 
              s.toLowerCase().includes('excel') ||
              s.toLowerCase().includes('superior') ||
              s.toLowerCase().includes('better') ||
              s.toLowerCase().includes('advantage')
            ) || sentences[0];
            
            if (strengthSentence && strengthSentence.trim()) {
              explanation += ` Key insight: ${strengthSentence.trim()}.`;
            }
          }
        });
      }
      
      // Compare with other top documents
      if (sortedDocEntries.length > 1) {
        const [secondDocName, secondDocWins] = sortedDocEntries[1];
        const secondDocDisplayName = secondDocName ? (secondDocName.split('/').pop() || secondDocName) : 'Unknown Document';
        const winMargin = topDocWins - secondDocWins;
        
        if (winMargin === 0) {
          explanation += `\n\n${topDocDisplayName} is tied for first place with ${secondDocDisplayName}, both winning ${topDocWins} comparison${topDocWins !== 1 ? 's' : ''} each`;
        } else {
          explanation += `\n\n${topDocDisplayName} outperforms its closest competitor, ${secondDocDisplayName}, by ${winMargin} comparison${winMargin !== 1 ? 's' : ''}`;
        }
        
        // Find direct comparison between top two documents
        const directComparison = criterionDetails.find(item => {
          // Handle both direct field access and Comparison field parsing
          let docAName = '';
          let docBName = '';
          
          if (item['Document A'] && item['Document B']) {
            docAName = item['Document A'];
            docBName = item['Document B'];
          } else if (item['Comparison'] && typeof item['Comparison'] === 'string') {
            const parts = item['Comparison'].split(' vs ');
            if (parts.length === 2) {
              docAName = parts[0].trim();
              docBName = parts[1].trim();
            }
          }
          
          return (docAName === topDocName && docBName === secondDocName) ||
                 (docAName === secondDocName && docBName === topDocName);
        });
        
        if (directComparison) {
          const reasoning = directComparison['Detailed Reasoning'] || directComparison['Reasoning'] || directComparison['Comparative Analysis'];
          if (reasoning) {
            // Extract key differentiator
            const sentences = reasoning.split(/[.!?]+/).filter((s: string) => s.trim().length > 15);
            const differentiator = sentences.find((s: string) => 
              s.toLowerCase().includes('while') || 
              s.toLowerCase().includes('however') ||
              s.toLowerCase().includes('contrast') ||
              s.toLowerCase().includes('whereas')
            ) || sentences[Math.floor(sentences.length / 2)];
            
            if (differentiator && differentiator.trim()) {
              explanation += `, with evaluators noting: "${differentiator.trim()}."`;
            }
          }
        }
      }
      
    } else {
      explanation += ` based on overall performance across ${totalDocs} documents, winning in ${topDocWins} comparisons.`;
    }
    
    // Add evaluation method context
    const evalMethod = (reportData as any).evaluationMethod;
    if (evalMethod) {
      if (evalMethod === 'prompt') {
        const customPrompt = (reportData as any).customPrompt || '';
        if (customPrompt) {
          explanation += `\n\nThis comprehensive ranking was determined using a custom evaluation framework: "${customPrompt}"`;
        } else {
          explanation += `\n\nThis ranking was determined using a tailored prompt-based evaluation methodology.`;
        }
      } else if (evalMethod === 'criteria') {
        explanation += `\n\nThis analysis is based on a systematic criteria-based evaluation framework, ensuring objective and consistent assessment across all documents.`;
      }
    }
    
    // Simple CSV with just the explanation
    return `Explanation\n"${explanation.replace(/"/g, '""')}"`;
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
