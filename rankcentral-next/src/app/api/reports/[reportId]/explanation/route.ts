import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db/mongodb';
import { ObjectId } from 'mongodb';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { SHEET_NAMES } from '@/lib/comparison/report_constants';

export async function GET(
  request: Request,
  { params }: { params: { reportId: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    
    // Check authentication
    if (!session || !session.user) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }

    const reportId = params.reportId;
    
    // Connect to the database
    const { db } = await connectToDatabase();
    
    // Find the report in the database
    let report;
    if (ObjectId.isValid(reportId)) {
      report = await db.collection('reports').findOne({
        _id: new ObjectId(reportId),
        user_id: session.user.id
      });
    }
    
    if (!report) {
      return NextResponse.json(
        { success: false, error: "Report not found" },
        { status: 404 }
      );
    }

    // Get the explanation from the CSV files
    let explanation = '';
    if (report.csv_files && Array.isArray(report.csv_files)) {
      for (const fileObj of report.csv_files) {
        if (typeof fileObj === 'object') {
          // Check for Top Document Explanation file in various formats
          if (fileObj.filename && fileObj.content) {
            // New format with separate filename and content fields
            if (fileObj.filename.includes(SHEET_NAMES.explanation)) {
              explanation = fileObj.content;
              break;
            }
          } else {
            // Original format with filename:content pairs
            for (const [filename, content] of Object.entries(fileObj)) {
              if (filename.includes(SHEET_NAMES.explanation) && typeof content === 'string') {
                explanation = content;
                break;
              }
            }
          }
        }
      }
    }

    // Parse the explanation from CSV format to just the text
    if (explanation) {
      const lines = explanation.split('\n');
      if (lines.length > 1) {
        // Skip the header row and extract the explanation text
        explanation = lines.slice(1).join('\n');
        // Remove surrounding quotes if present
        explanation = explanation.replace(/^"(.*)"$/s, '$1');
        // Replace escaped quotes with regular quotes
        explanation = explanation.replace(/""/g, '"');
      }
    }
    
    // If no explanation was found, generate a basic one based on win counts
    if (!explanation && report.winCounts) {
      const { winCounts } = report;
      const topDocEntries = Object.entries(winCounts)
        .sort(([, countA], [, countB]) => (countB as number) - (countA as number));
      
      if (topDocEntries.length > 0) {
        const [docName, winCount] = topDocEntries[0];
        explanation = `${docName} is ranked as the top document based on its overall performance, winning ${winCount} comparisons.`;
      }
    }

    return NextResponse.json({
      success: true,
      explanation: explanation || "No explanation available for the top-ranked document."
    });
    
  } catch (error) {
    console.error('Error fetching explanation:', error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch explanation" },
      { status: 500 }
    );
  }
}
