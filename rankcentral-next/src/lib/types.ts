// src/lib/types.ts

export interface Document {
  name: string;
  content: string;
  type: 'text' | 'pdf';
}

export interface CsvFile {
  filename: string;
  content: string;
}

export interface ReportData {
  timestamp: string;
  documents: string[];
  top_ranked: string;
  csv_files: CsvFile[];
  criteria_count: number;
  evaluation_method: 'prompt' | 'criteria';
  custom_prompt: string;
  report_name: string;
  api_key_status: 'Valid API key' | 'Invalid API key';
  results?: any[];
}
