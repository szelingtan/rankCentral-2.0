'use client';

import React, { useState, useEffect } from 'react';
import Layout from '@/components/Layout';
import PastReports from '@/components/results/PastReports';
import { useToast } from '@/hooks/use-toast';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { RefreshCw } from 'lucide-react';
import Link from 'next/link';

type EvaluationReport = {
  timestamp: string;
  documents: string[];
  top_ranked: string;
  report_path: string;
  criteria_count: number;
  evaluation_method: string;
  custom_prompt?: string;
  report_name?: string;
};

const Results = () => {
  const [pastReports, setPastReports] = useState<EvaluationReport[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { toast: uiToast } = useToast();
  
  const fetchReports = async () => {
    setIsLoading(true);
    
    try {
      // Use Next.js API route to fetch reports
      const response = await fetch('/api/reports/history');
      
      if (!response.ok) {
        throw new Error(`Failed to fetch reports: ${response.statusText}`);
      }
      
      const data = await response.json();
      
      // Make sure each report has the correct document format
      const formattedReports = Array.isArray(data.reports) 
        ? data.reports.map((report: any) => ({
            ...report,
            // Ensure documents array is complete
            documents: Array.isArray(report.documents) ? report.documents : [],
            // Ensure top_ranked is a string
            top_ranked: report.top_ranked || '',
            // Include report name if available
            report_name: report.report_name || ''
          }))
        : [];
      
      setPastReports(formattedReports);
      
      if (formattedReports.length === 0) {
        toast.info("You haven't generated any comparison reports yet.");
        uiToast({
          title: "No reports found",
          description: "You haven't generated any comparison reports yet.",
        });
      }
    } catch (error: any) {
      console.error('Error fetching reports:', error);
      setPastReports([]);
      toast.error('Error loading reports.');
      uiToast({
        title: "Unable to load reports",
        description: `There was an error loading past reports: ${error.message}`,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleRenameReport = (timestamp: string, newName: string) => {
    const updatedReports = pastReports.map(report =>
      report.timestamp === timestamp
        ? { ...report, report_name: newName }
        : report
    );
    setPastReports(updatedReports);
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
              <Link href="/projects" className="text-brand-primary hover:underline flex items-center gap-1">
                <span>View Projects</span>
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

        <div className="mt-4">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center p-8 bg-gray-50 rounded-md">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-primary mb-4"></div>
              <p className="text-gray-600">Loading reports...</p>
            </div>
          ) : pastReports.length > 0 ? (
            <PastReports reports={pastReports} onRenameReport={handleRenameReport}/>
          ) : (
            <div className="text-center py-12 bg-gray-50 rounded-lg">
              <p className="text-lg text-gray-600">No comparison reports found</p>
              <p className="text-gray-500 mt-2">Compare some documents to generate reports</p>
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
};

export default Results;
