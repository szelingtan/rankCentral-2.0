import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { FileText, BarChart, Calendar } from 'lucide-react';

interface StatsProps {
  stats: {
    totalReports: number;
    uniqueDocuments: number;
    lastComparisonDate: string;
  };
}

export function DashboardStats({ stats }: StatsProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Your Stats</CardTitle>
        <CardDescription>Overview of your document comparisons</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="flex items-center">
            <div className="p-2 rounded-full bg-blue-100">
              <BarChart className="h-5 w-5 text-blue-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Total Reports</p>
              <p className="text-2xl font-bold">{stats.totalReports}</p>
            </div>
          </div>
          
          <div className="flex items-center">
            <div className="p-2 rounded-full bg-green-100">
              <FileText className="h-5 w-5 text-green-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Documents Compared</p>
              <p className="text-2xl font-bold">{stats.uniqueDocuments}</p>
            </div>
          </div>
          
          <div className="flex items-center">
            <div className="p-2 rounded-full bg-purple-100">
              <Calendar className="h-5 w-5 text-purple-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Last Comparison</p>
              <p className="text-lg font-semibold">{stats.lastComparisonDate}</p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}