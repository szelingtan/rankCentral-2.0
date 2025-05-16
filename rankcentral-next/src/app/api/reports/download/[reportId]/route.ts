// src/app/api/reports/download/[reportId]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { getDb } from '@/lib/db/mongodb';
import { createZipFromReportData } from '@/lib/utils/report-utils';

/**
 * API route to download a report
 */
export async function GET(
  req: NextRequest,
  { params }: { params: { reportId: string } }
): Promise<NextResponse> {
  try {
    // Check authentication
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get user ID from session
    const userId = session.user.id;
    const reportId = params.reportId;

    if (!reportId) {
      return NextResponse.json(
        { error: 'Report ID is required' },
        { status: 400 }
      );
    }

    // Connect to database
    const db = await getDb();
    
    // Get report data
    const report = await db
      .collection('reports')
      .findOne({ 
        $or: [
          { report_id: reportId, user_id: userId },
          { timestamp: reportId, user_id: userId }
        ]
      });

    if (!report) {
      return NextResponse.json(
        { error: 'Report not found' },
        { status: 404 }
      );
    }

    // Create ZIP file from report data
    const reportData = JSON.parse(report.reportData || '{}');
    
    // Add metadata from the MongoDB document to the ZIP
    const zipData = {
      ...reportData,
      report_id: report.report_id,
      timestamp: report.timestamp,
      documents: report.documents,
      top_ranked: report.top_ranked,
      criteria_count: report.criteria_count,
      evaluation_method: report.evaluation_method,
      custom_prompt: report.custom_prompt,
      report_name: report.report_name
    };

    const zipFile = await createZipFromReportData(zipData);

    if (!zipFile) {
      return NextResponse.json(
        { error: 'Failed to create ZIP file' },
        { status: 500 }
      );
    }

    // Set headers for file download
    const fileName = `${report.report_name || 'report'}-${reportId.substring(0, 8)}.zip`.replace(/\s+/g, '-');
    
    // Return the ZIP file
    return new NextResponse(zipFile, {
      headers: {
        'Content-Type': 'application/zip',
        'Content-Disposition': `attachment; filename="${fileName}"`,
      },
    });

  } catch (error) {
    console.error('Error downloading report:', error);
    return NextResponse.json(
      { error: 'Error downloading report', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}