
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { FileText, Calendar, Edit, Check, FolderPlus, BarChart2, X, Loader2 } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import dayjs from 'dayjs';
import ReportVisualization from './ReportVisualization';

type Report = {
  reportId: string;
  timestamp: string;
  documents: string[];
  topRanked: string;
  criteriaCount: number;
  evaluationMethod: string;
  customPrompt?: string;
  reportName?: string;
  reportPath?: string;
};

type PastReportsProps = {
  reports: Report[];
  onRenameReport: (timestamp: string, newName: string) => void;
};

const PastReports = ({ reports, onRenameReport }: PastReportsProps) => {
  const [expandedReport, setExpandedReport] = useState<string | null>(null);
  const [editingName, setEditingName] = useState<string | null>(null);
  const [newName, setNewName] = useState<string>('');
  const [isUpdating, setIsUpdating] = useState<boolean>(false);
  
  const toggleExpand = (timestamp: string) => {
    if (expandedReport === timestamp) {
      setExpandedReport(null);
    } else {
      setExpandedReport(timestamp);
    }
  };
  
  const startEditing = (timestamp: string, currentName: string) => {
    setEditingName(timestamp);
    setNewName(currentName || '');
  };

  const cancelEditing = () => {
    setEditingName(null);
    setNewName('');
    setIsUpdating(false);
  };
  
  const saveReportName = async (timestamp: string, reportId: string) => {
    const trimmedName = newName.trim();
    
    if (!trimmedName) {
      toast.error("Report name cannot be empty");
      return;
    }

    if (trimmedName.length > 100) {
      toast.error("Report name cannot exceed 100 characters");
      return;
    }

    // Don't update if the name hasn't changed
    const currentReport = reports.find(r => r.timestamp === timestamp);
    if (currentReport && trimmedName === (currentReport.reportName || 'Comparison Report')) {
      setEditingName(null);
      setNewName('');
      return;
    }

    setIsUpdating(true);
    try {
      const response = await fetch('/api/reports/update-name', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          reportId: reportId,
          timestamp: timestamp,
          newName: trimmedName,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to update report name');
      }

      if (result.success) {
        onRenameReport(timestamp, trimmedName);
        toast.success("Report name updated successfully");
        setEditingName(null);
        setNewName('');
      } else {
        toast.error(result.error || "Failed to update report name");
      }
    } catch (error) {
      console.error('Error updating report name:', error);
      toast.error(error instanceof Error ? error.message : "An error occurred while updating the report name");
    } finally {
      setIsUpdating(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent, timestamp: string, reportId: string) => {
    if (e.key === 'Enter' && !isUpdating) {
      saveReportName(timestamp, reportId);
    } else if (e.key === 'Escape') {
      cancelEditing();
    }
  };

  const formatTimestamp = (timestamp: string) => {
    try {
      return dayjs(timestamp).format('MMM D, YYYY h:mm A');
    } catch (e) {
      return timestamp;
    }
  };

  // Function to handle direct navigation to the export tab
  const handleDownloadClick = (timestamp: string) => {
    // First expand the report if it's not already expanded
    if (expandedReport !== timestamp) {
      setExpandedReport(timestamp);
    }
    
    // Use setTimeout to ensure the DOM has been updated before trying to click
    setTimeout(() => {
      const exportTab = document.querySelector(`[data-report="${timestamp}"] [value="export"]`) as HTMLElement;
      if (exportTab) {
        exportTab.click();
      }
    }, 100);
  };

  return (
    <div className="space-y-6">
      {reports.map((report) => (
        <Card key={report.timestamp} className="overflow-hidden">
          <CardHeader className="bg-gray-50 pb-4">
            <div className="flex justify-between items-start">
              <div className="flex items-center gap-2">
                <FileText className="h-5 w-5 text-brand-primary" />
                {editingName === report.timestamp ? (
                  <div className="flex flex-col gap-2">
                    <div className="flex items-center gap-2">
                      <Input
                        value={newName}
                        onChange={(e) => setNewName(e.target.value)}
                        onKeyDown={(e) => handleKeyPress(e, report.timestamp, report.reportId)}
                        placeholder="Enter report name"
                        className="text-base font-medium h-8 w-56"
                        autoFocus
                        disabled={isUpdating}
                        maxLength={100}
                      />
                      <Button 
                        size="icon" 
                        variant="ghost" 
                        onClick={() => saveReportName(report.timestamp, report.reportId)}
                        disabled={isUpdating || !newName.trim()}
                        title="Save"
                      >
                        {isUpdating ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <Check className="h-4 w-4" />
                        )}
                      </Button>
                      <Button 
                        size="icon" 
                        variant="ghost" 
                        onClick={cancelEditing}
                        disabled={isUpdating}
                        title="Cancel"
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                    {newName.length > 0 && (
                      <div className="text-xs text-gray-500 ml-1">
                        {newName.length}/100 characters
                      </div>
                    )}
                  </div>
                ) : (
                  <CardTitle className="flex items-center gap-2">
                    {report.reportName || 'Comparison Report'}
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="h-5 w-5 ml-1" 
                      onClick={() => startEditing(
                        report.timestamp, 
                        report.reportName || 'Comparison Report'
                      )}
                      disabled={isUpdating}
                      title="Edit report name"
                    >
                      <Edit className="h-3 w-3" />
                    </Button>
                  </CardTitle>
                )}
              </div>
              
              <div className="flex items-center text-sm text-gray-500">
                <Calendar className="h-4 w-4 mr-1" />
                {formatTimestamp(report.timestamp)}
              </div>
            </div>
          </CardHeader>
          
          <CardContent className="p-4">
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <h3 className="text-sm font-medium text-gray-500">Documents</h3>
                  <p className="mt-1">{report.documents.length} document{report.documents.length !== 1 ? 's' : ''}</p>
                </div>
                
                <div>
                  <h3 className="text-sm font-medium text-gray-500">Top Ranked</h3>
                  <p className="mt-1">{report.topRanked ? report.topRanked.split('/').pop() : 'Not available'}</p>
                </div>
                
                <div>
                  <h3 className="text-sm font-medium text-gray-500">Evaluation Method</h3>
                  <p className="mt-1 capitalize">{report.evaluationMethod || 'Standard'}</p>
                </div>
              </div>
              
              <div className="flex flex-wrap gap-2 mt-4">
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="gap-1 text-brand-primary border-brand-primary"
                  onClick={() => toggleExpand(report.timestamp)}
                >
                  <BarChart2 className="h-4 w-4 mr-1" />
                  Report Details
                </Button>
                
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="gap-1 text-brand-primary border-brand-primary"
                  onClick={() => handleDownloadClick(report.timestamp)}
                >
                  <FolderPlus className="h-4 w-4 mr-1" />
                  Add to Project
                </Button>
              </div>
              
              {expandedReport === report.timestamp && (
                <ReportVisualization 
                  timestamp={report.timestamp}
                  reportName={report.reportName}
                  documents={report.documents}
                  reportId={report.reportId}
                />
              )}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};

export default PastReports;
