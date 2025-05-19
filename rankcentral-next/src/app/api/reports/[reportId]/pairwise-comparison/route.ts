import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { connectToDatabase } from '@/lib/db/mongodb';
import { ObjectId } from 'mongodb';

/**
 * GET /api/reports/[reportId]/pairwise-comparison - Get pairwise comparison results for a report
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
        { error: "You must be logged in to view pairwise comparison results" },
        { status: 401 }
      );
    }
    
    // Get the report ID from params
    const { reportId } = params;
    
    // Connect to the database
    const { db } = await connectToDatabase();
    
    // Find the report by report_id field (UUID) instead of trying to convert to ObjectId
    // This is essential because report_id is a UUID string, not a MongoDB ObjectId
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
    
    // Extract pairwise comparison data from the report
    // This assumes the report data structure contains comparison_details with pairwise comparisons
    let pairwiseResults = [];
    
    try {
      // If the report has comparison_details as a JSON string, parse it
      if (report.comparison_details && typeof report.comparison_details === 'string') {
        const comparisonDetails = JSON.parse(report.comparison_details);
        pairwiseResults = comparisonDetails.map(comparison => ({
          doc1: comparison.documentA || comparison.document_a,
          doc2: comparison.documentB || comparison.document_b,
          winner: comparison.winner,
          reasoning: comparison.evaluationDetails?.explanation || comparison.evaluation_details?.explanation || "No explanation provided"
        }));
      } 
      // If comparison_details is already an object
      else if (report.comparison_details && Array.isArray(report.comparison_details)) {
        pairwiseResults = report.comparison_details.map(comparison => ({
          doc1: comparison.documentA || comparison.document_a,
          doc2: comparison.documentB || comparison.document_b,
          winner: comparison.winner,
          reasoning: comparison.evaluationDetails?.explanation || comparison.evaluation_details?.explanation || "No explanation provided"
        }));
      }
    } catch (error) {
      console.error('Error processing pairwise comparison data:', error);
    }
    
    return NextResponse.json({
      success: true,
      results: pairwiseResults
    });
    
  } catch (error) {
    console.error('Error fetching pairwise comparison results:', error);
    return NextResponse.json(
      { 
        success: false,
        error: "Failed to fetch pairwise comparison results",
        details: error instanceof Error ? error.message : String(error)
      },
      { status: 500 }
    );
  }
}