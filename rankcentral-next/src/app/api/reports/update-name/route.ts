// src/app/api/reports/update-name/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { getDb } from '@/lib/db/mongodb';

/**
 * API route to update a report's name
 */
export async function POST(req: NextRequest): Promise<NextResponse> {
  try {
    // Check authentication
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get user ID from session
    const userId = session.user.id;

    // Parse request body
    const data = await req.json();
    const { timestamp, newName } = data;

    // Validate request data
    if (!timestamp) {
      return NextResponse.json(
        { error: 'Report timestamp is required' },
        { status: 400 }
      );
    }

    if (!newName || newName.trim() === '') {
      return NextResponse.json(
        { error: 'New report name is required' },
        { status: 400 }
      );
    }

    // Connect to database
    const db = await getDb();
    
    // Update report name
    const result = await db
      .collection('reports')
      .updateOne(
        { timestamp: timestamp, user_id: userId },
        { $set: { report_name: newName.trim() } }
      );

    if (result.matchedCount === 0) {
      return NextResponse.json(
        { error: 'Report not found or you do not have permission to update it' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Report name updated successfully'
    });

  } catch (error) {
    console.error('Error updating report name:', error);
    return NextResponse.json(
      { error: 'Error updating report name', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}