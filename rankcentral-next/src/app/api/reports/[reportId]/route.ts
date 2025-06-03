import { NextResponse } from 'next/server';

/**
 * GET /api/reports/[reportId] - Simple endpoint that instructs client to use session storage
 * This endpoint no longer connects to databases or requires authentication.
 * All report data is now stored in browser session storage.
 */
export async function GET(
  request: Request,
  { params }: { params: Promise<{ reportId: string }> }
) {
  try {
    const { reportId } = await params;

    return NextResponse.json({
      success: false,
      message: "Reports are now stored in session storage. Please check your browser's session storage for report data.",
      reportId: reportId,
      instruction: "Use SessionStorageManager.getReport() to retrieve report data from session storage"
    });
  } catch (error) {
    console.error('Error in report API:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Report retrieval error',
        message: "Reports are stored in session storage. Use SessionStorageManager.getReport() instead."
      },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/reports/[reportId] - Update report details (now uses session storage)
 * This endpoint instructs clients to update reports in session storage instead.
 */
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ reportId: string }> }
) {
  try {
    const { reportId } = await params;
    const body = await request.json();
    
    return NextResponse.json({
      success: false,
      message: "Report updates are now handled in session storage. Use SessionStorageManager.updateReport() to update report data.",
      reportId: reportId,
      instruction: "Use SessionStorageManager.updateReport() to modify reports in session storage",
      providedData: body
    });
    
  } catch (error) {
    console.error('Error in report update API:', error);
    return NextResponse.json(
      { 
        success: false,
        error: "Report update error",
        message: "Reports are stored in session storage. Use SessionStorageManager.updateReport() instead."
      },
      { status: 500 }
    );
  }
}