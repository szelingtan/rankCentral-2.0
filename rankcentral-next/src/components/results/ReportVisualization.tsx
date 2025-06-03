import React, { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { BarChart2, ListOrdered, Download } from "lucide-react";
import { useToast } from '@/hooks/use-toast';
import ExportTab from './ExportTab';
import ApiClient from '@/lib/comparison/apiClient';
import { ReportData } from '@/lib/types';
import { SessionStorageManager } from '@/lib/sessionStorage';

interface RankingData {
  name: string;
  score: number;
}

interface PairwiseComparisonData {
  doc1: string;
  doc2: string;
  winner: string;
  reasoning: string;
}

interface ReportVisualizationProps {
  timestamp: string;
  reportName?: string;
  documents: string[];
  reportId: string;
}

const ReportVisualization = ({ timestamp, reportName, documents, reportId }: ReportVisualizationProps) => {
  // Debug: log props on mount
  console.log('[ReportVisualization] props', { timestamp, reportName, documents, reportId });
  const [isLoading, setIsLoading] = useState(false);
  const [csvData, setCsvData] = useState<RankingData[]>([]);
  const [pairwiseData, setPairwiseData] = useState<PairwiseComparisonData[]>([]);
  const [explanationText, setExplanationText] = useState<string>('');
  const [hasLoadedData, setHasLoadedData] = useState(false);
  const { toast } = useToast();
  
  const apiClient = new ApiClient(); // Create an instance of the API client
  
  // Use React's useEffect to load data immediately when component mounts
  React.useEffect(() => {
    // Debug: log effect trigger
    console.log('[ReportVisualization] useEffect triggered for reportId', reportId);
    // Reset data when reportId changes to prevent showing stale data
    setCsvData([]);
    setPairwiseData([]);
    setExplanationText('');
    setHasLoadedData(false);
    
    // Fetch new data
    fetchReportData();
  }, [reportId]);

  const fetchReportData = async () => {
    if (hasLoadedData) {
      console.log('[fetchReportData] Already loaded, skipping fetch.');
      return; // Don't fetch again if already loaded
    }
    
    setIsLoading(true);
    try {
      console.log('[fetchReportData] Fetching data for report ID:', reportId);
      // Fetch data directly from the backend
      const response = await apiClient.getReportDetails(reportId);
      console.log('[fetchReportData] Raw report data:', response.report);
      console.log('[fetchReportData] Documents in report:', response.report?.documents);
      console.log('[fetchReportData] Top ranked document:', (response.report as any)?.top_ranked);
      
      // Transform the report data into the format expected by the visualization component
      console.log('[fetchReportData] Processing report data:', response.report);
      
      // Prefer backend ranking array if present
      if (response.report && Array.isArray(response.report.ranking) && response.report.ranking.length > 0) {
        // Use the ranking array as the source of truth
        const formattedData: RankingData[] = response.report.ranking.map((doc: string, index: number) => {
          const name = doc.split('/').pop() || doc || 'Unknown';
          // Score is descending (higher rank = higher score)
          const score = response.report.ranking.length - index;
          return { name, score };
        });
        setCsvData(formattedData);
        console.log('[fetchReportData] setCsvData (from ranking):', formattedData);
      } else if (response.report && Array.isArray((response.report as any).documents)) {
        // Extract documents from the report itself
        const docs = (response.report as any).documents;
        // Use the top_ranked field to identify the highest ranked document
        const topRanked = (response.report as any).top_ranked || docs[0];
        console.log('[fetchReportData] docs:', docs);
        console.log('[fetchReportData] topRanked:', topRanked);
        
        // Create ranking data with document names as they appear in the documents array
        // The order in the documents array represents the ranking
        const formattedData: RankingData[] = docs.map((doc: string, index: number) => {
          // Higher score for documents earlier in the array (reverse index)
          const score = docs.length - index;
          // If this is the top ranked document, give it the highest score
          const finalScore = doc === topRanked ? docs.length + 1 : score;
          
          const name = doc.split('/').pop() || doc || 'Unknown';
          console.log(`[fetchReportData] RankingData: { name: ${name}, score: ${finalScore} }`);
          return {
            name,
            score: finalScore
          };
        });
        
        setCsvData(formattedData);
        console.log('[fetchReportData] setCsvData (from documents):', formattedData);
      } else if (response.report && response.report.results) {
        // If report has a results array with document rankings
        const formattedData: RankingData[] = response.report.results.map((item: any) => {
          let document = '';
          let score = 0;
          
          // Handle different formats of the item
          if (typeof item === 'object' && item !== null) {
            document = item.document || item.name || '';
            score = typeof item.score === 'number' ? item.score : 0;
          }
          const name = document.split('/').pop() || document || 'Unknown';
          console.log(`[fetchReportData] RankingData (results): { name: ${name}, score: ${score} }`);
          return {
            name,
            score
          };
        });
        setCsvData(formattedData);
        console.log('[fetchReportData] setCsvData (from results):', formattedData);
      } else {
        // Fallback to empty array if report format is unknown
        console.warn('[fetchReportData] Unknown report format:', response.report);
        // Create a safe default dataset
        const safeDefault: RankingData[] = documents.length > 0 
          ? documents.map((doc, index) => {
              const name = doc.split('/').pop() || `Document ${index + 1}`;
              const score = documents.length - index;
              console.log(`[fetchReportData] SafeDefault RankingData: { name: ${name}, score: ${score} }`);
              return { name, score };
            })
          : [{ name: 'No data available', score: 0 }];
        setCsvData(safeDefault);
        console.log('[fetchReportData] setCsvData (safe default):', safeDefault);
      }
      
      // Try to get the top document explanation - removed since we're simplifying rankings tab
      // We no longer show explanations in the rankings tab
      setExplanationText('');
      
      // Try to get pairwise comparison data
      try {
        const pairwiseResponse = await apiClient.getPairwiseComparisonResults(reportId);
        // Convert ComparisonResult[] to PairwiseComparisonData[]
        const formattedPairwiseData: PairwiseComparisonData[] = pairwiseResponse.results.map(result => {
          const doc1 = (result.documentA || result.document_a || '').split('/').pop() || 'Unknown';
          const doc2 = (result.documentB || result.document_b || '').split('/').pop() || 'Unknown';
          const winner = result.winner ? result.winner.split('/').pop() || result.winner : 'Tie';
          const reasoning = (result.evaluationDetails?.explanation || 
                           result.evaluation_details?.explanation ||
                           'No reasoning available.');
          console.log(`[fetchReportData] Pairwise: { doc1: ${doc1}, doc2: ${doc2}, winner: ${winner}, reasoning: ${reasoning} }`);
          return { doc1, doc2, winner, reasoning };
        });
        setPairwiseData(formattedPairwiseData);
        console.log('[fetchReportData] setPairwiseData:', formattedPairwiseData);
      } catch (error) {
        console.warn('[fetchReportData] Pairwise data not available:', error);
        // Generate sample pairwise data for demonstration
        const samplePairwise: PairwiseComparisonData[] = [];
        for (let i = 0; i < documents.length - 1; i++) {
          for (let j = i + 1; j < documents.length; j++) {
            const doc1 = documents[i].split('/').pop() || documents[i];
            const doc2 = documents[j].split('/').pop() || documents[j];
            samplePairwise.push({
              doc1,
              doc2,
              winner: doc1,
              reasoning: "Sample reasoning for this comparison."
            });
            console.log(`[fetchReportData] SamplePairwise: { doc1: ${doc1}, doc2: ${doc2}, winner: ${doc1} }`);
          }
        }
        setPairwiseData(samplePairwise);
        console.log('[fetchReportData] setPairwiseData (sample):', samplePairwise);
      }
      
      setHasLoadedData(true);
      console.log('[fetchReportData] setHasLoadedData(true)');
      
    } catch (error) {
      console.error('[fetchReportData] Error fetching report data:', error instanceof Error ? error.message : String(error));
      
      // Show a detailed error message to the user
      toast({
        title: "Error loading report data",
        description: error instanceof Error 
          ? `Could not load report data: ${error.message}` 
          : "Could not load the visualization data for this report.",
        variant: "destructive",
      });
      
      // Generate sample data for demonstration if API fails
      const sampleData: RankingData[] = documents.map(doc => {
        const name = doc.split('/').pop() || doc;
        const score = Math.floor(Math.random() * 100);
        console.log(`[fetchReportData] SampleData: { name: ${name}, score: ${score} }`);
        return { name, score };
      });
      setCsvData(sampleData);
      console.log('[fetchReportData] setCsvData (sample):', sampleData);
      
    } finally {
      setIsLoading(false);
      console.log('[fetchReportData] setIsLoading(false)');
    }
  };

  const handleExportCSV = async () => {
    setIsLoading(true);
    try {
      // Get report data from session storage
      const sessionReport = SessionStorageManager.getReport(reportId);
      
      if (!sessionReport) {
        throw new Error('Report not found in session storage');
      }

      // Use the createZipFromReportData utility function
      const { createZipFromReportData } = await import('@/lib/utils/report-utils');
      const zipBlob = await createZipFromReportData(sessionReport);
      
      if (!zipBlob) {
        throw new Error('Failed to create ZIP file');
      }

      // Create a safe name for the download file
      const safeReportName = reportName 
        ? reportName.replace(/[^a-z0-9]/gi, '_').toLowerCase()
        : `report_${reportId.substring(0, 8)}`;
      
      // Download the ZIP file
      const url = window.URL.createObjectURL(zipBlob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `${safeReportName}.zip`);
      document.body.appendChild(link);
      link.click();
      
      // Cleanup
      setTimeout(() => {
        link.parentNode?.removeChild(link);
        window.URL.revokeObjectURL(url);
      }, 100);
      
      toast({
        title: "Download started",
        description: "Your CSV export has been generated and downloaded.",
      });
    } catch (error) {
      console.error('Error generating CSV export:', error);
      toast({
        title: "Download failed",
        description: "Could not generate the CSV files. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Debug: show csvData in UI for quick inspection
  return (
    <Card className="w-full mt-4">
      <CardHeader>
        <CardTitle>{reportName || "Report Visualization"}</CardTitle>
        <CardDescription>View and export report data</CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs 
          defaultValue="rankings" 
          className="w-full" 
          data-report={timestamp}
          onValueChange={(value) => {
            if ((value === "rankings" || value === "pairwise") && !hasLoadedData) {
              fetchReportData();
            }
          }}
        >
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="rankings">
              <ListOrdered className="h-4 w-4 mr-2" />
              Rankings
            </TabsTrigger>
            <TabsTrigger value="pairwise">
              <BarChart2 className="h-4 w-4 mr-2" />
              Pairwise Comparison
            </TabsTrigger>
            <TabsTrigger value="export">
              <Download className="h-4 w-4 mr-2" />
              Export CSV
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="rankings" className="pt-4">
            {isLoading ? (
              <div className="flex items-center justify-center p-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-primary"></div>
              </div>
            ) : (
              <div className="space-y-6">
                <div className="space-y-4">
                  <h3 className="font-medium text-lg">Document Rankings</h3>
                  <div className="border rounded-lg overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="w-16">Rank</TableHead>
                          <TableHead>Document</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {csvData.map((row, index) => (
                          <TableRow key={index} className={index === 0 ? "bg-green-50" : ""}>
                            <TableCell className="font-bold">
                              <div className={`
                                flex items-center justify-center w-8 h-8 rounded-full text-white text-sm font-bold
                                ${index === 0 ? 'bg-green-500' : index === 1 ? 'bg-blue-500' : index === 2 ? 'bg-orange-500' : 'bg-gray-500'}
                              `}>
                                {index + 1}
                              </div>
                            </TableCell>
                            <TableCell className="font-medium">
                              <div className="flex items-center gap-2">
                                <span className="truncate max-w-xs md:max-w-md" title={row.name}>
                                  {row.name}
                                </span>
                                {index === 0 && (
                                  <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded-full flex-shrink-0">
                                    Top Ranked
                                  </span>
                                )}
                              </div>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </div>
              </div>
            )}
          </TabsContent>
          
          <TabsContent value="pairwise" className="pt-4">
            {isLoading ? (
              <div className="flex items-center justify-center p-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-primary"></div>
              </div>
            ) : (
              <div className="space-y-6">

                {/* Pairwise comparison table */}
                <div className="space-y-4">
                  <h3 className="font-medium text-lg">Detailed Pairwise Comparisons</h3>
                  <div className="border rounded-lg overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Document 1</TableHead>
                          <TableHead>Document 2</TableHead>
                          <TableHead>Winner</TableHead>
                          <TableHead className="hidden md:table-cell">Reasoning</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {pairwiseData.length > 0 ? (
                          pairwiseData.map((comparison: PairwiseComparisonData, index) => (
                            <TableRow key={index}>
                              <TableCell>{comparison.doc1}</TableCell>
                              <TableCell>{comparison.doc2}</TableCell>
                              <TableCell className="font-medium">{comparison.winner}</TableCell>
                              <TableCell className="hidden md:table-cell">
                                <div className="max-w-md text-sm text-gray-600 whitespace-normal">
                                  {comparison.reasoning}
                                </div>
                              </TableCell>
                            </TableRow>
                          ))
                        ) : (
                          <TableRow>
                            <TableCell colSpan={4} className="text-center py-4">
                              No pairwise comparison data available
                            </TableCell>
                          </TableRow>
                        )}
                      </TableBody>
                    </Table>
                  </div>
                </div>
              </div>
            )}
          </TabsContent>
          
          <TabsContent value="export" className="pt-4">
            <ExportTab 
              isLoading={isLoading} 
              onExport={handleExportCSV} 
            />
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};

export default ReportVisualization;
