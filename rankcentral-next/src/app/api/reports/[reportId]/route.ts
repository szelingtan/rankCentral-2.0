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
  { params }: { params: Promise<{ reportId: string }> }
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
    
    // Await params before accessing its properties (Next.js 15 requirement)
    const { reportId } = await params;
    
    // Connect to the database
    const { db } = await connectToDatabase();
    
    // Find the report using report_id (UUID string) instead of ObjectId
    const report = await db.collection('reports').findOne({
      report_id: reportId,
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
      report: report
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

/**
 * PATCH /api/reports/[reportId] - Update report details (e.g., name)
 */
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ reportId: string }> }
) {
  try {
    // Get the user session
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "You must be logged in to update reports" },
        { status: 401 }
      );
    }
    
    // Await params before accessing its properties (Next.js 15 requirement)
    const { reportId } = await params;
    
    const body = await request.json();
    const { reportName } = body;

    // Validate input
    if (!reportName || typeof reportName !== 'string' || reportName.trim().length === 0) {
      return NextResponse.json(
        { error: "Report name is required and must be a non-empty string" },
        { status: 400 }
      );
    }

    // Sanitize the report name
    const sanitizedName = reportName.trim().substring(0, 100); // Limit to 100 characters
    
    // Connect to the database
    const { db } = await connectToDatabase();
    
    // Try to find by report_id field first
    let updateResult = await db.collection('reports').updateOne(
      {
        report_id: reportId,
        user_id: session.user.id
      },
      {
        $set: {
          report_name: sanitizedName,
          last_updated: new Date()
        }
      }
    );

    // If not found by report_id, try by _id if it's a valid ObjectId
    if (updateResult.matchedCount === 0 && ObjectId.isValid(reportId)) {
      updateResult = await db.collection('reports').updateOne(
        {
          _id: new ObjectId(reportId),
          user_id: session.user.id
        },
        {
          $set: {
            report_name: sanitizedName,
            last_updated: new Date()
          }
        }
      );
    }

    if (updateResult.matchedCount === 0) {
      return NextResponse.json(
        { error: "Report not found or you don't have permission to update it" },
        { status: 404 }
      );
    }
    
    // Return success response
    return NextResponse.json({
      success: true,
      message: "Report updated successfully",
      reportName: sanitizedName
    });
    
  } catch (error) {
    console.error('Error updating report:', error);
    return NextResponse.json(
      { 
        success: false,
        error: "Failed to update report",
        details: error instanceof Error ? error.message : String(error)
      },
      { status: 500 }
    );
  }
}