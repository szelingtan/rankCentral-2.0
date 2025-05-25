import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { connectToDatabase } from '@/lib/db/mongodb';
import { ObjectId } from 'mongodb';

/**
 * PATCH /api/reports/update-name - Update the name of a report
 */
export async function PATCH(request: Request) {
  try {
    // Get the user session
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "You must be logged in to update report names" },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { reportId, timestamp, newName } = body;

    // Validate input
    if (!newName || typeof newName !== 'string') {
      return NextResponse.json(
        { error: "Report name is required and must be a string" },
        { status: 400 }
      );
    }

    const trimmedName = newName.trim();
    if (trimmedName.length === 0) {
      return NextResponse.json(
        { error: "Report name cannot be empty" },
        { status: 400 }
      );
    }

    if (trimmedName.length > 100) {
      return NextResponse.json(
        { error: "Report name cannot exceed 100 characters" },
        { status: 400 }
      );
    }

    if (!reportId && !timestamp) {
      return NextResponse.json(
        { error: "Either reportId or timestamp is required" },
        { status: 400 }
      );
    }

    // Sanitize the report name
    const sanitizedName = trimmedName.substring(0, 100); // Already validated length above

    // Connect to the database
    const { db } = await connectToDatabase();

    let updateResult;

    // Try to find and update by reportId first
    if (reportId) {
      // Try by report_id field first
      updateResult = await db.collection('reports').updateOne(
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
    }

    // If still not found and we have a timestamp, try by timestamp
    if ((!updateResult || updateResult.matchedCount === 0) && timestamp) {
      updateResult = await db.collection('reports').updateOne(
        {
          timestamp: timestamp,
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

    if (!updateResult || updateResult.matchedCount === 0) {
      return NextResponse.json(
        { error: "Report not found or you don't have permission to update it" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Report name updated successfully",
      reportName: sanitizedName
    });

  } catch (error) {
    console.error('Error updating report name:', error);
    return NextResponse.json(
      { 
        success: false,
        error: "Failed to update report name",
        details: error instanceof Error ? error.message : String(error)
      },
      { status: 500 }
    );
  }
}

/**
 * POST /api/reports/update-name - Update the name of a report (legacy support)
 */
export async function POST(request: Request) {
  // Support the existing API format for backward compatibility
  return PATCH(request);
}
