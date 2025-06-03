import { NextResponse } from 'next/server';

/**
 * GET /api/reports/[reportId]/pairwise-comparison - Session storage instruction endpoint
 * This endpoint no longer connects to databases or requires authentication.
 * All comparison data is now stored in browser session storage.
 */
export async function GET(
  request: Request,
  { params }: { params: Promise<{ reportId: string }> }
) {
  try {
    const { reportId } = await params;

    return NextResponse.json({
      success: false,
      message: "Pairwise comparison data is now stored in session storage. Please check your browser's session storage for comparison results.",
      reportId: reportId,
      instruction: "Use SessionStorageManager.getReport() to retrieve pairwise comparison data from session storage"
    });
  } catch (error) {
    console.error('Error in pairwise comparison API:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Pairwise comparison retrieval error',
        message: "Comparison data is stored in session storage. Use SessionStorageManager.getReport() instead."
      },
      { status: 500 }
    );
  }
}