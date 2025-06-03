'use client';

import React, { useState, useEffect } from 'react';
import Layout from '@/components/Layout';
import PastReports from '@/components/results/PastReports';
import { useToast } from '@/hooks/use-toast';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { RefreshCw } from 'lucide-react';
import Link from 'next/link';
import { SessionStorageManager, SessionReport } from '@/lib/sessionStorage';

type EvaluationReport = {
  reportId: string;
  timestamp: string;
  documents: string[];
  topRanked: string;
  reportPath: string;
  criteriaCount: number;
  evaluationMethod: string;
  customPrompt?: string;
  reportName?: string;
};

const Results = () => {
  const [pastReports, setPastReports] = useState<EvaluationReport[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const { toast: uiToast } = useToast();

  const fetchReports = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      // Get reports from session storage
      const sessionReports = SessionStorageManager.getReports();
      
      // Convert session reports to the expected format
      const formattedReports: EvaluationReport[] = sessionReports.map((report: SessionReport) => ({
        reportId: report.report_id,
        timestamp: report.timestamp,
        documents: report.documents || [],
        topRanked: report.top_ranked || '',
        reportPath: '', // Not used with session storage
        criteriaCount: report.criteria_count || 0,
        evaluationMethod: report.evaluation_method || 'criteria',
        customPrompt: report.custom_prompt,
        reportName: report.report_name || 'Comparison Report'
      }));

      setPastReports(formattedReports);
      
      if (formattedReports.length === 0) {
        toast.info("You haven't generated any comparison reports yet.");
        uiToast({
          title: "No reports found",
          description: "You haven't generated any comparison reports yet.",
        });
      }
    } catch (error: any) {
      console.error('Error fetching reports from session storage:', error);
      setPastReports([]);
      
      const errorMessage = "Failed to load reports from session storage";
      setError(errorMessage);
      toast.error('Error loading reports.');
      uiToast({
        title: "Unable to load reports",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleRenameReport = (timestamp: string, newName: string) => {
    // Update the report name in session storage
    const sessionReports = SessionStorageManager.getReports();
    const updatedReports = sessionReports.map(report =>
      report.timestamp === timestamp
        ? { ...report, report_name: newName }
        : report
    );
    
    // Save back to session storage
    sessionStorage.setItem('rankcentral_reports', JSON.stringify(updatedReports));
    
    // Update local state
    const updatedLocalReports = pastReports.map(report =>
      report.timestamp === timestamp
        ? { ...report, reportName: newName }
        : report
    );
    setPastReports(updatedLocalReports);
  };

  useEffect(() => {
    fetchReports();
  }, []);

  return (
    <Layout>
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-800">Report History</h1>
            <div className="flex mt-2">
              <Link href="/documents" className="text-brand-primary hover:underline flex items-center gap-1">
                <span>Create New Report</span>
              </Link>
            </div>
          </div>
          <Button 
            onClick={fetchReports} 
            variant="outline" 
            disabled={isLoading}
            className="flex items-center gap-2"
          >
            <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>

        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 mb-6 rounded relative" role="alert">
            <strong className="font-bold">Error: </strong>
            <span className="block sm:inline">{error}</span>
            <Button
              variant="outline"
              size="sm"
              className="mt-3"
              onClick={fetchReports}
            >
              <RefreshCw className="h-3 w-3 mr-2" />
              Try Again
            </Button>
          </div>
        )}

        <div className="mt-4">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center p-8 bg-gray-50 rounded-md">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-primary mb-4"></div>
              <p className="text-gray-600">Loading reports...</p>
            </div>
          ) : pastReports.length > 0 ? (
            <PastReports reports={pastReports} onRenameReport={handleRenameReport}/>
          ) : !error ? (
            <div className="text-center py-12 bg-gray-50 rounded-lg">
              <p className="text-lg text-gray-600">No comparison reports found</p>
              <p className="text-gray-500 mt-2">Compare some documents to generate reports</p>
              <Link href="/documents" className="mt-4 inline-block">
                <Button className="bg-brand-primary hover:bg-brand-dark">
                  Start Comparing Documents
                </Button>
              </Link>
            </div>
          ) : null}
        </div>
      </div>
    </Layout>
  );
};

export default Results;
