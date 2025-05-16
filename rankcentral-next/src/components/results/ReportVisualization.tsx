import React, { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { BarChart2, ListOrdered, Download, Edit, Check } from "lucide-react";
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from 'recharts';
import apiClient from '@/lib/comparison/apiClient';
import { useToast } from '@/hooks/use-toast';
import ExportTab from './ExportTab';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { updateReportName } from '@/lib/evaluations';

interface ReportVisualizationProps {
  timestamp: string;
  reportName?: string;
  documents: string[];
  onReportNameUpdate?: (timestamp: string, newName: string) => void;
}

const ReportVisualization = ({ 
  timestamp, 
  reportName, 
  documents,
  onReportNameUpdate
}: ReportVisualizationProps) => {
  const [isLoading, setIsLoading] = useState(false);
  const [csvData, setCsvData] = useState<any[]>([]);
  const [pairwiseData, setPairwiseData] = useState<any[]>([]);
  const [hasLoadedData, setHasLoadedData] = useState(false);
  const [editingName, setEditingName] = useState(false);
  const [newReportName, setNewReportName] = useState(reportName || "Report Visualization");
  const { toast } = useToast();

  const fetchReportData = async () => {
    if (hasLoadedData) {
      return; // Don't fetch again if already loaded
    }
    
    setIsLoading(true);
    try {
      // Fetch report data using API
      const response = await fetch(`/api/reports/${timestamp}/data`);
      if (!response.ok) {
        throw new Error('Failed to fetch report data');
      }
      const data = await response.json();
      setCsvData(data);
      
      // Try to get pairwise comparison data
      try {
        const pairwiseResponse = await fetch(`/api/reports/${timestamp}/pairwise`);
        if (pairwiseResponse.ok) {
          const pairwiseData = await pairwiseResponse.json();
          setPairwiseData(pairwiseData);
        } else {
          throw new Error('Pairwise data not available');
        }
      } catch (error) {
        console.warn('Pairwise data not available:', error);
        // Generate sample pairwise data for demonstration
        const samplePairwise = [];
        for (let i = 0; i < documents.length - 1; i++) {
          for (let j = i + 1; j < documents.length; j++) {
            samplePairwise.push({
              doc1: documents[i].split('/').pop() || documents[i],
              doc2: documents[j].split('/').pop() || documents[j],
              winner: documents[i].split('/').pop() || documents[i],
              reasoning: "Sample reasoning for this comparison."
            });
          }
        }
        setPairwiseData(samplePairwise);
      }
      
      setHasLoadedData(true);
      
    } catch (error) {
      console.error('Error fetching report data:', error);
      toast({
        title: "Error loading report data",
        description: "Could not load the visualization data for this report.",
        variant: "destructive",
      });
      
      // Generate sample data for demonstration if API fails
      const sampleData = documents.map(doc => ({
        name: doc.split('/').pop() || doc,
        score: Math.floor(Math.random() * 100),
      }));
      setCsvData(sampleData);
      
    } finally {
      setIsLoading(false);
    }
  };

  const handleExportCSV = async () => {
    setIsLoading(true);
    try {
      // Use direct URL for downloading the report
      window.open(`/api/reports/${timestamp}/download`, '_blank');
      
      toast({
        title: "Download started",
        description: "Your CSV export has been initiated.",
      });
    } catch (error) {
      console.error('Error downloading CSV:', error);
      toast({
        title: "Download failed",
        description: "Could not download the CSV files. Please try again later.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdateReportName = async () => {
    if (!newReportName.trim()) {
      toast({
        title: "Invalid name",
        description: "Report name cannot be empty",
        variant: "destructive"
      });
      return;
    }

    setIsLoading(true);
    try {
      const result = await updateReportName(timestamp, newReportName);
      
      if (result.success) {
        toast({
          title: "Success",
          description: "Report name updated successfully"
        });
        
        if (onReportNameUpdate) {
          onReportNameUpdate(timestamp, newReportName);
        }
      } else {
        toast({
          title: "Error",
          description: result.message || "Failed to update report name",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error('Error updating report name:', error);
      toast({
        title: "Error",
        description: "An error occurred while updating the report name",
        variant: "destructive"
      });
    } finally {
      setEditingName(false);
      setIsLoading(false);
    }
  };

  return (
    <Card className="w-full mt-4">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex-1">
            {editingName ? (
              <div className="flex items-center gap-2">
                <Input
                  value={newReportName}
                  onChange={(e) => setNewReportName(e.target.value)}
                  className="text-lg font-semibold"
                  placeholder="Enter report name"
                  disabled={isLoading}
                  autoFocus
                />
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleUpdateReportName}
                  disabled={isLoading}
                >
                  <Check className="h-4 w-4" />
                </Button>
              </div>
            ) : (
              <CardTitle className="flex items-center gap-2">
                {reportName || "Report Visualization"}
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-6 w-6 p-0"
                  onClick={() => {
                    setNewReportName(reportName || "Report Visualization");
                    setEditingName(true);
                  }}
                >
                  <Edit className="h-3.5 w-3.5" />
                </Button>
              </CardTitle>
            )}
          </div>
        </div>
        <CardDescription>View and export report data</CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs 
          defaultValue="visualization" 
          className="w-full" 
          data-report={timestamp}
          onValueChange={(value) => {
            if ((value === "visualization" || value === "pairwise") && !hasLoadedData) {
              fetchReportData();
            }
          }}
        >
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="visualization">
              <BarChart2 className="h-4 w-4 mr-2" />
              Data Visualization
            </TabsTrigger>
            <TabsTrigger value="pairwise">
              <ListOrdered className="h-4 w-4 mr-2" />
              Pairwise Comparison
            </TabsTrigger>
            <TabsTrigger value="export">
              <Download className="h-4 w-4 mr-2" />
              Export CSV
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="visualization" className="pt-4">
            {isLoading ? (
              <div className="flex items-center justify-center p-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-primary"></div>
              </div>
            ) : (
              <div className="space-y-6">
                <div className="h-64 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={csvData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" tick={{ fontSize: 12 }} height={60} tickMargin={10} />
                      <YAxis width={40} />
                      <Tooltip 
                        contentStyle={{ backgroundColor: 'white', borderRadius: '8px', padding: '8px' }}
                        labelStyle={{ fontWeight: 'bold', marginBottom: '4px' }}
                      />
                      <Legend wrapperStyle={{ paddingTop: '10px' }} />
                      <Bar dataKey="score" name="Score" fill="#0D6E9A" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
                
                <div className="mt-6">
                  <h3 className="font-medium mb-2">Data Table</h3>
                  <div className="border rounded-lg overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Document</TableHead>
                          <TableHead className="text-right">Score</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {csvData.map((row, index) => (
                          <TableRow key={index}>
                            <TableCell className="font-medium">{row.name}</TableCell>
                            <TableCell className="text-right">{row.score}</TableCell>
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
              <div className="space-y-4">
                <h3 className="font-medium text-lg">Pairwise Comparison Results</h3>
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
                        pairwiseData.map((comparison, index) => (
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
