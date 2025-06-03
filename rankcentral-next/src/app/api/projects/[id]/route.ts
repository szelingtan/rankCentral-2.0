import { NextResponse } from 'next/server';

/**
 * GET /api/projects/[id] - Session storage instruction endpoint
 * This endpoint no longer connects to databases or requires authentication.
 * All project data is now stored in browser session storage.
 */
export async function GET(
	request: Request,
	{ params }: { params: Promise<{ id: string }> }
) {
	try {
		const { id } = await params;

		return NextResponse.json({
			success: false,
			message: "Projects are now stored in session storage. Please check your browser's session storage for project data.",
			projectId: id,
			instruction: "Use SessionStorageManager.getProjects() to retrieve project data from session storage"
		});
	} catch (error) {
		console.error('Error in projects API:', error);
		return NextResponse.json(
			{ 
				success: false, 
				error: 'Project retrieval error',
				message: "Project data is stored in session storage. Use SessionStorageManager.getProjects() instead."
			},
			{ status: 500 }
		);
	}
}

/**
 * PATCH /api/projects/[id] - Session storage instruction endpoint
 * This endpoint instructs clients to update projects in session storage.
 */
export async function PATCH(
	request: Request,
	{ params }: { params: Promise<{ id: string }> }
) {
	try {
		const { id } = await params;
		const body = await request.json();
		
		return NextResponse.json({
			success: false,
			message: "Project updates are now handled in session storage. Use SessionStorageManager.updateProject() to modify projects.",
			projectId: id,
			instruction: "Use SessionStorageManager.updateProject() to modify project data in session storage",
			providedData: body
		});
		
	} catch (error) {
		console.error('Error in projects PATCH API:', error);
		return NextResponse.json(
			{ 
				success: false,
				error: "Project update error",
				message: "Projects are managed in session storage. Use SessionStorageManager.updateProject() instead."
			},
			{ status: 500 }
		);
	}
}

/**
 * DELETE /api/projects/[id] - Session storage instruction endpoint
 * This endpoint instructs clients to delete projects from session storage.
 */
export async function DELETE(
	request: Request,
	{ params }: { params: Promise<{ id: string }> }
) {
	try {
		const { id } = await params;
		
		return NextResponse.json({
			success: false,
			message: "Project deletion is now handled in session storage. Use SessionStorageManager.deleteProject() to remove projects.",
			projectId: id,
			instruction: "Use SessionStorageManager.deleteProject() to remove project data from session storage"
		});
		
	} catch (error) {
		console.error('Error in projects DELETE API:', error);
		return NextResponse.json(
			{ 
				success: false,
				error: "Project deletion error",
				message: "Projects are managed in session storage. Use SessionStorageManager.deleteProject() instead."
			},
			{ status: 500 }
		);
	}
}
