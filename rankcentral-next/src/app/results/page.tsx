'use client';

import React, { useState, useEffect } from 'react';
import Layout from '@/components/Layout';
import PastReports from '@/components/results/PastReports';
import { useToast } from '@/hooks/use-toast';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { RefreshCw } from 'lucide-react';
import ApiClient from '@/lib/comparison/apiClient';  // Import the class
import Link from 'next/link';

// Create an instance of the ApiClient
const apiClient = new ApiClient();

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

// Define API URL for the backend connection message
const apiUrl = typeof window !== 'undefined' ? `${window.location.protocol}//${window.location.hostname}:8000` : 'http://localhost:8000';

const Results = () => {
  const [pastReports, setPastReports] = useState<EvaluationReport[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [backendError, setBackendError] = useState<string | null>(null);

  const apiClient = new ApiClient(); // Create an instance of the API client
  const { toast: uiToast } = useToast();

  const fetchReports = async () => {
    setIsLoading(true);
    setBackendError(null);
    
    try {
      // Make a fetch request to our Next.js API endpoint
      const response = await apiClient.getReportHistory();

      console.log('pastReports response:', response);
      
      const data = response.reports || [];
      
      // Make sure each report has the correct document format
      const formattedReports = Array.isArray(data) 
        ? data.map((report: any) => ({
            ...report,
            // Ensure documents array is complete
            documents: Array.isArray(report.documents) ? report.documents : [],
            // Ensure top_ranked is a string
            topRanked: report.topRanked || '',
            // Include report name if available
            reportName: report.reportName || ''
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
      
      // Create a more user-friendly error message
      let errorMessage = error.message || "Unknown error";
      
      // Add debugging info to the console
      console.debug('Error details:', {
        name: error.name,
        message: error.message,
        stack: error.stack
      });
      
      setBackendError(`Error loading reports: ${errorMessage}`);
      toast.error('Error loading reports from the backend.');
      uiToast({
        title: "Unable to load reports",
        description: `There was an error loading reports. Please try again later.`,
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

        {backendError && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 mb-6 rounded relative" role="alert">
            <strong className="font-bold">Error loading reports: </strong>
            <span className="block sm:inline">{backendError}</span>
            <p className="mt-2 font-medium">Possible issues:</p>
            <p className="mt-1">1. Connection to database might be failing</p>
            <p className="mt-1">2. You might need to refresh your session</p>
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
          ) : !backendError ? (
            <div className="text-center py-12 bg-gray-50 rounded-lg">
              <p className="text-lg text-gray-600">No comparison reports found</p>
              <p className="text-gray-500 mt-2">Compare some documents to generate reports</p>
            </div>
          ) : null}
        </div>
      </div>
    </Layout>
  );
};

export default Results;
