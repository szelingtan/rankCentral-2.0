import { NextResponse } from 'next/server';

/**
 * GET /api/reports/[reportId]/download - Session storage instruction endpoint
 * This endpoint no longer connects to databases or requires authentication.
 * All report download functionality is now handled client-side with session storage.
 */
export async function GET(
  request: Request,
  { params }: { params: Promise<{ reportId: string }> }
) {
  try {
    const { reportId } = await params;

    return NextResponse.json({
      success: false,
      message: "Report downloads are now handled client-side using session storage. The download functionality has been moved to the browser.",
      reportId: reportId,
      instruction: "Use SessionStorageManager.getReport() to retrieve report data and generate downloads client-side"
    });
  } catch (error) {
    console.error('Error in download API:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Download functionality moved to client-side',
        message: "Downloads are now handled in the browser using session storage. Use SessionStorageManager.getReport() instead."
      },
      { status: 500 }
    );
  }
}