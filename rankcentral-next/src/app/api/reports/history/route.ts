import { NextResponse } from 'next/server';

/**
 * GET /api/reports/history - Simple endpoint that instructs client to use session storage
 */
export async function GET(request: Request) {
  try {
    // Since we're now using session storage, we return an instruction for the client
    // to retrieve reports from their session storage instead
    return NextResponse.json({
      success: true,
      message: "Reports are now stored in your session. Please check your browser's session storage.",
      reports: [] // Empty array since reports should be fetched from session storage client-side
    });
    
  } catch (error) {
    console.error('Error in reports history endpoint:', error);
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