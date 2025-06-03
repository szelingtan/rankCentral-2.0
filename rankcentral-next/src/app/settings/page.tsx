"use client";

import React, { useState, useEffect } from 'react';
import Layout from '@/components/Layout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import { Trash2, Download, Upload, Database, Shield, AlertTriangle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { SessionStorageManager } from '@/lib/sessionStorage';

export default function SettingsPage() {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [sessionData, setSessionData] = useState<any>(null);

  useEffect(() => {
    loadSessionData();
  }, []);

  const loadSessionData = () => {
    const data = SessionStorageManager.exportData();
    setSessionData(data);
  };

  const handleClearData = async () => {
    if (!confirm('Are you sure you want to clear all your session data? This cannot be undone.')) {
      return;
    }

    try {
      SessionStorageManager.clearAll();
      loadSessionData();
      toast({
        title: "Data cleared",
        description: "All session data has been cleared successfully",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to clear session data",
        variant: "destructive"
      });
    }
  };

  const handleExportData = () => {
    try {
      const data = SessionStorageManager.exportData();
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `rankcentral-data-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      
      toast({
        title: "Data exported",
        description: "Your session data has been downloaded",
      });
    } catch (error) {
      toast({
        title: "Export failed",
        description: "Failed to export session data",
        variant: "destructive"
      });
    }
  };

  const handleImportData = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = JSON.parse(e.target?.result as string);
        SessionStorageManager.importData(data);
        loadSessionData();
        toast({
          title: "Data imported",
          description: "Your session data has been imported successfully",
        });
      } catch (error) {
        toast({
          title: "Import failed",
          description: "Failed to import data. Please check the file format.",
          variant: "destructive"
        });
      }
    };
    reader.readAsText(file);
  };

  return (
    <Layout>
      <div className="container mx-auto max-w-4xl px-4">
        <h1 className="text-3xl font-bold text-gray-800 mb-2">Settings</h1>
        <p className="text-gray-600 mb-6">Manage your session data and preferences</p>
        
        <Tabs defaultValue="data" className="w-full">
          <TabsList className="grid w-full grid-cols-2 mb-6">
            <TabsTrigger value="data" className="flex items-center">
              <Database className="mr-2 h-4 w-4" />
              Session Data
            </TabsTrigger>
            <TabsTrigger value="privacy" className="flex items-center">
              <Shield className="mr-2 h-4 w-4" />
              Privacy
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="data">
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Session Data Management</CardTitle>
                  <CardDescription>
                    View and manage your locally stored data. All data is stored in your browser session.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="text-center p-4 bg-gray-50 rounded-lg">
                        <div className="text-2xl font-bold text-brand-primary">
                          {sessionData?.documents?.length || 0}
                        </div>
                        <div className="text-sm text-gray-600">Documents</div>
                      </div>
                      <div className="text-center p-4 bg-gray-50 rounded-lg">
                        <div className="text-2xl font-bold text-brand-primary">
                          {sessionData?.reports?.length || 0}
                        </div>
                        <div className="text-sm text-gray-600">Reports</div>
                      </div>
                      <div className="text-center p-4 bg-gray-50 rounded-lg">
                        <div className="text-2xl font-bold text-brand-primary">
                          {sessionData?.projects?.length || 0}
                        </div>
                        <div className="text-sm text-gray-600">Projects</div>
                      </div>
                    </div>
                    
                    <Separator />
                    
                    <div className="flex flex-wrap gap-3">
                      <Button onClick={handleExportData} variant="outline">
                        <Download className="mr-2 h-4 w-4" />
                        Export Data
                      </Button>
                      
                      <div className="relative">
                        <input
                          type="file"
                          id="import-data"
                          accept=".json"
                          onChange={handleImportData}
                          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                        />
                        <Button variant="outline">
                          <Upload className="mr-2 h-4 w-4" />
                          Import Data
                        </Button>
                      </div>
                      
                      <Button 
                        onClick={handleClearData} 
                        variant="destructive"
                        disabled={isLoading}
                      >
                        <Trash2 className="mr-2 h-4 w-4" />
                        Clear All Data
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
          
          <TabsContent value="privacy">
            <Card>
              <CardHeader>
                <CardTitle>Privacy & Security</CardTitle>
                <CardDescription>
                  Information about how your data is handled
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-start gap-3 p-4 bg-blue-50 rounded-lg">
                  <Shield className="h-5 w-5 text-blue-600 mt-0.5" />
                  <div>
                    <h3 className="font-medium text-blue-900">Local Storage Only</h3>
                    <p className="text-sm text-blue-700 mt-1">
                      All your documents and reports are stored locally in your browser session. 
                      No data is sent to external servers or databases.
                    </p>
                  </div>
                </div>
                
                <div className="flex items-start gap-3 p-4 bg-amber-50 rounded-lg">
                  <AlertTriangle className="h-5 w-5 text-amber-600 mt-0.5" />
                  <div>
                    <h3 className="font-medium text-amber-900">Session-Based Storage</h3>
                    <p className="text-sm text-amber-700 mt-1">
                      Your data will be automatically cleared when you close your browser. 
                      Use the export feature to save your data permanently.
                    </p>
                  </div>
                </div>
                
                <div className="flex items-start gap-3 p-4 bg-green-50 rounded-lg">
                  <Database className="h-5 w-5 text-green-600 mt-0.5" />
                  <div>
                    <h3 className="font-medium text-green-900">No Account Required</h3>
                    <p className="text-sm text-green-700 mt-1">
                      This application doesn't require user accounts or authentication. 
                      You can use it anonymously without providing any personal information.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </Layout>
  );
}