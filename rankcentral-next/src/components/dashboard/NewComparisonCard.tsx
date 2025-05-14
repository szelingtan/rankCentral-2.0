// src/components/dashboard/NewComparisonCard.tsx

import React from 'react';
import Link from 'next/link';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { PlusCircle, Upload, FileText, FileUp } from 'lucide-react';

export function NewComparisonCard() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Start a New Comparison</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="p-4 border rounded-lg text-center hover:bg-gray-50 transition-colors">
            <div className="mx-auto w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center mb-2">
              <FileUp className="h-6 w-6 text-blue-600" />
            </div>
            <h3 className="font-medium mb-1">Upload Documents</h3>
            <p className="text-sm text-gray-500">Compare PDFs, text files, or other document formats</p>
          </div>
          
          <div className="p-4 border rounded-lg text-center hover:bg-gray-50 transition-colors">
            <div className="mx-auto w-12 h-12 rounded-full bg-green-100 flex items-center justify-center mb-2">
              <FileText className="h-6 w-6 text-green-600" />
            </div>
            <h3 className="font-medium mb-1">Paste Content</h3>
            <p className="text-sm text-gray-500">Directly paste text content to compare</p>
          </div>
        </div>
      </CardContent>
      <CardFooter>
        <Link href="/documents/compare" className="w-full">
          <Button className="w-full">
            <PlusCircle className="mr-2 h-4 w-4" />
            Start New Comparison
          </Button>
        </Link>
      </CardFooter>
    </Card>
  );
}