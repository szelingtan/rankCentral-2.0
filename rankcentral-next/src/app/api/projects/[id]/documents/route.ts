import { NextResponse } from 'next/server';

/**
 * GET /api/projects/[id]/documents - Session storage instruction endpoint
 * This endpoint no longer connects to databases or requires authentication.
 * All project document data is now stored in browser session storage.
 */
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    return NextResponse.json({
      success: false,
      message: "Project documents are now stored in session storage. Please check your browser's session storage for project data.",
      projectId: id,
      instruction: "Use SessionStorageManager.getProjects() to retrieve project document data from session storage"
    });
  } catch (error) {
    console.error('Error in project documents API:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Project documents retrieval error',
        message: "Project data is stored in session storage. Use SessionStorageManager.getProjects() instead."
      },
      { status: 500 }
    );
  }
}

/**
 * POST /api/projects/[id]/documents - Session storage instruction endpoint
 * This endpoint instructs clients to add documents to projects in session storage.
 */
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    
    return NextResponse.json({
      success: false,
      message: "Project document management is now handled in session storage. Use SessionStorageManager.updateProject() to add documents.",
      projectId: id,
      instruction: "Use SessionStorageManager.updateProject() to modify project documents in session storage",
      providedData: body
    });
    
  } catch (error) {
    console.error('Error in project documents POST API:', error);
    return NextResponse.json(
      { 
        success: false,
        error: "Project document management error",
        message: "Project documents are managed in session storage. Use SessionStorageManager.updateProject() instead."
      },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/projects/[id]/documents - Session storage instruction endpoint
 * This endpoint instructs clients to remove documents from projects in session storage.
 */
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    
    return NextResponse.json({
      success: false,
      message: "Project document removal is now handled in session storage. Use SessionStorageManager.updateProject() to remove documents.",
      projectId: id,
      instruction: "Use SessionStorageManager.updateProject() to remove project documents in session storage",
      providedData: body
    });
    
  } catch (error) {
    console.error('Error in project documents DELETE API:', error);
    return NextResponse.json(
      { 
        success: false,
        error: "Project document removal error",
        message: "Project documents are managed in session storage. Use SessionStorageManager.updateProject() instead."
      },
      { status: 500 }
    );
  }
}