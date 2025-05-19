import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { connectToDatabase } from '@/lib/db/mongodb';
import { ObjectId } from 'mongodb';

/**
 * GET /api/reports/[reportId] - Get detailed data for a specific report
 */
export async function GET(
  request: Request,
  { params }: { params: { reportId: string } }
) {
  try {
    // Get the user session
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "You must be logged in to view report details" },
        { status: 401 }
      );
    }
    
    // Get the report ID from params
    const { reportId } = params;
    
    // Connect to the database
    const { db } = await connectToDatabase();
    
    // Find the report
    const report = await db.collection('reports').findOne({
      _id: new ObjectId(reportId),
      user_id: session.user.id
    });
    
    if (!report) {
      return NextResponse.json(
        { error: "Report not found" },
        { status: 404 }
      );
    }
    
    // Return the report data
    return NextResponse.json({
      success: true,
      report: {
        ...report,
        _id: report._id.toString()
      }
    });
    
  } catch (error) {
    console.error('Error fetching report details:', error);
    return NextResponse.json(
      { 
        success: false,
        error: "Failed to fetch report details",
        details: error instanceof Error ? error.message : String(error)
      },
      { status: 500 }
    );
  }
}