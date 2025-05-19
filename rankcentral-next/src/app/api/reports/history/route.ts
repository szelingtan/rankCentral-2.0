import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { connectToDatabase } from '@/lib/db/mongodb';
import { ObjectId } from 'mongodb';

/**
 * GET /api/reports/history - Get report history for the current user
 */
export async function GET(request: Request) {
  try {
    // Get the user session
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "You must be logged in to view report history" },
        { status: 401 }
      );
    }
    
    // Connect to the database
    const { db } = await connectToDatabase();
    
    // Fetch reports for the current user
    const reports = await db.collection('reports')
      .find({ 
        user_id: session.user.id 
      })
      .sort({ timestamp: -1 })
      .limit(50) // Limit to 50 most recent reports
      .toArray();
    
    // Transform the reports to ensure proper formatting
    const formattedReports = reports.map(report => ({
      ...report,
      _id: report._id.toString(), // Convert ObjectId to string
      // Ensure all required fields exist with defaults if needed
      reportId: report.report_id || '',
      documents: Array.isArray(report.documents) ? report.documents : [],
      topRanked: report.top_ranked || '',
      reportName: report.report_name || 'Untitled Report',
      timestamp: report.timestamp || new Date().toISOString(),
      criteriaCount: report.criteria_count || 0,
      evaluationMethod: report.evaluation_method || 'standard',
    }));

    console.log("formatted:", formattedReports);
    
    // Return the reports
    return NextResponse.json({
      success: true,
      reports: formattedReports
    });
    
  } catch (error) {
    console.error('Error fetching report history:', error);
    return NextResponse.json(
      { 
        success: false,
        error: "Failed to fetch report history",
        details: error instanceof Error ? error.message : String(error)
      },
      { status: 500 }
    );
  }
}