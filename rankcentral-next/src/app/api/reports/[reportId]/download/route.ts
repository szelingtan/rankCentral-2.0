import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { connectToDatabase } from '@/lib/db/mongodb';
import { createZipFromReportData } from '@/lib/utils/report-utils';

/**
 * GET /api/reports/[reportId]/download - Download a report as a ZIP file
 */
export async function GET(
  request: Request,
  { params }: { params: Promise<{ reportId: string }> }
) {
  try {
    // Get the user session
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "You must be logged in to download reports" },
        { status: 401 }
      );
    }
    
    // Await params before accessing its properties (Next.js 15 requirement)
    const { reportId } = await params;
    
    // Connect to the database
    const { db } = await connectToDatabase();
    
    // Try to find report first by report_id field
    let report = await db.collection('reports').findOne({
      report_id: reportId, 
      user_id: session.user.id
    });
    
    // If not found, try by _id if reportId is a valid ObjectId
    if (!report) {
      try {
        const { ObjectId } = require('mongodb');
        if (ObjectId.isValid(reportId)) {
          report = await db.collection('reports').findOne({
            _id: new ObjectId(reportId),
            user_id: session.user.id
          });
        }
      } catch (error) {
        console.error('Error checking ObjectId:', error);
      }
    }
    
    if (!report) {
      return NextResponse.json(
        { error: "Report not found" },
        { status: 404 }
      );
    }
    
    // Check if CSV files exist in the report
    if (report.csv_files && Array.isArray(report.csv_files) && report.csv_files.length > 0) {
      // Create a ZIP file from the report data
      const zipBlob = await createZipFromReportData(report);
      
      if (!zipBlob) {
        return NextResponse.json(
          { error: "Failed to create ZIP file" },
          { status: 500 }
        );
      }
      
      // Convert the Blob to ArrayBuffer
      const arrayBuffer = await zipBlob.arrayBuffer();
      
      // Create a filename based on the report name or ID
      const filename = report.report_name ? 
        `${report.report_name.replace(/[^a-z0-9]/gi, '_')}.zip` : 
        `report-${reportId}.zip`;
      
      // Create a new Response with the ZIP file
      const response = new NextResponse(arrayBuffer, {
        status: 200,
        headers: {
          'Content-Type': 'application/zip',
          'Content-Disposition': `attachment; filename="${filename}"`
        }
      });
      
      return response;
    } else {
      return NextResponse.json(
        { error: "Report has no CSV files" },
        { status: 404 }
      );
    }
    
  } catch (error) {
    console.error('Error downloading report:', error);
    return NextResponse.json(
      { 
        success: false,
        error: "Failed to download report",
        details: error instanceof Error ? error.message : String(error)
      },
      { status: 500 }
    );
  }
}