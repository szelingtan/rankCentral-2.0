import React from 'react';
import Link from 'next/link';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Eye, Download, FileText, Calendar, BarChart3 } from 'lucide-react';
import { downloadFile, createZipFromReportData } from '@/lib/utils/report-utils';

interface Report {
  report_id: string;
  report_name: string;
  formatted_timestamp: string;
  timestamp: string;
  document_count: number;
  top_ranked?: string;
  evaluation_method: 'criteria' | 'prompt';
  criteria_count?: number;
}

interface ReportsListProps {
  reports: Report[];
}

export function ReportsList({ reports }: ReportsListProps) {
  // Function to handle report download
  const handleDownload = async (reportId: string, reportName: string) => {
    try {
      const response = await fetch(`/api/reports/download/${reportId}`);
      if (!response.ok) {
        throw new Error('Failed to download report');
      }
      
      const blob = await response.blob();
      downloadFile(blob, `${reportName.replace(/\s+/g, '-')}.zip`);
    } catch (error) {
      console.error('Error downloading report:', error);
    }
  };
  
  // Function to get short document name
  const getShortDocName = (fullName?: string): string => {
    if (!fullName) return 'Unknown';
    
    // Remove path and extension
    const baseName = fullName.split('/').pop() || fullName;
    return baseName.length > 25 ? baseName.substring(0, 22) + '...' : baseName;
  };
  
  if (reports.length === 0) {
    return (
      <Card className="p-6 text-center">
        <FileText className="h-12 w-12 text-gray-400 mx-auto mb-3" />
        <h3 className="text-lg font-medium mb-2">No reports yet</h3>
        <p className="text-gray-500 mb-4">
          Start your first document comparison to see reports here.
        </p>
        <Link href="/documents/compare">
          <Button>Start a Comparison</Button>
        </Link>
      </Card>
    );
  }
  
  return (
    <div className="space-y-4">
      {reports.map((report) => (
        <Card key={report.report_id} className="p-4">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <h3 className="font-medium text-lg">{report.report_name}</h3>
                <Badge variant={report.evaluation_method === 'criteria' ? 'default' : 'outline'}>
                  {report.evaluation_method === 'criteria' 
                    ? `${report.criteria_count} Criteria` 
                    : 'Custom Prompt'}
                </Badge>
              </div>
              
              <div className="flex flex-wrap gap-x-4 gap-y-2 text-sm text-gray-500">
                <div className="flex items-center">
                  <Calendar className="h-4 w-4 mr-1" />
                  {report.formatted_timestamp}
                </div>
                <div className="flex items-center">
                  <FileText className="h-4 w-4 mr-1" />
                  {report.document_count} documents
                </div>
                {report.top_ranked && (
                  <div className="flex items-center">
                    <BarChart3 className="h-4 w-4 mr-1" />
                    Top: {getShortDocName(report.top_ranked)}
                  </div>
                )}
              </div>
            </div>
            
            <div className="flex gap-2 mt-2 md:mt-0">
              <Link href={`/reports/${report.report_id}`}>
                <Button variant="outline" size="sm">
                  <Eye className="h-4 w-4 mr-2" />
                  View
                </Button>
              </Link>
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => handleDownload(report.report_id, report.report_name)}
              >
                <Download className="h-4 w-4 mr-2" />
                Download
              </Button>
            </div>
          </div>
        </Card>
      ))}
    </div>
  );
}