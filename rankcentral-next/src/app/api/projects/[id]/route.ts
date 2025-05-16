import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { connectToDatabase } from '@/lib/db/mongodb';
import { ObjectId } from 'mongodb';

// GET /api/projects/[id] - Get a specific project
export async function GET(
	req: NextRequest,
	{ params }: { params: { id: string } }
): Promise<NextResponse> {
	const session = await getServerSession(authOptions);

	// Check if user is authenticated
	if (!session?.user?.id) {
		return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
	}

	const { id } = params;

	try {
		// Validate ObjectId format
		if (!ObjectId.isValid(id)) {
			return NextResponse.json({ message: 'Invalid project ID' }, { status: 400 });
		}

		const { db } = await connectToDatabase();
		const project = await db.collection('projects').findOne({
			_id: new ObjectId(id),
			userId: session.user.id // Only allow access to own projects
		});

		if (!project) {
			return NextResponse.json({ message: 'Project not found' }, { status: 404 });
		}

		// Convert MongoDB ObjectId to string for JSON serialization
		return NextResponse.json({
			...project,
			_id: project._id.toString()
		});
	} catch (error) {
		console.error('Error fetching project:', error);
		return NextResponse.json(
			{ message: 'Failed to fetch project' },
			{ status: 500 }
		);
	}
}

// PUT /api/projects/[id] - Update a project
export async function PUT(
	req: NextRequest,
	{ params }: { params: { id: string } }
): Promise<NextResponse> {
	const session = await getServerSession(authOptions);

	// Check if user is authenticated
	if (!session?.user?.id) {
		return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
	}

	const { id } = params;

	try {
		// Validate ObjectId format
		if (!ObjectId.isValid(id)) {
			return NextResponse.json({ message: 'Invalid project ID' }, { status: 400 });
		}

		const { name, description } = await req.json();

		// Validate required fields
		if (!name || name.trim() === '') {
			return NextResponse.json(
				{ message: 'Project name is required' },
				{ status: 400 }
			);
		}

		const { db } = await connectToDatabase();

		// Check if project exists and belongs to user
		const existingProject = await db.collection('projects').findOne({
			_id: new ObjectId(id),
			userId: session.user.id
		});

		if (!existingProject) {
			return NextResponse.json({ message: 'Project not found' }, { status: 404 });
		}

		// Update project
		const updateData = {
			$set: {
				name,
				description: description || '',
				updatedAt: new Date().toISOString()
			}
		};

		await db.collection('projects').updateOne(
			{ _id: new ObjectId(id), userId: session.user.id },
			updateData
		);

		// Return updated project
		const updatedProject = await db.collection('projects').findOne({
			_id: new ObjectId(id)
		});

		return NextResponse.json({
			...updatedProject,
			_id: updatedProject?._id.toString()
		});
	} catch (error) {
		console.error('Error updating project:', error);
		return NextResponse.json(
			{ message: 'Failed to update project' },
			{ status: 500 }
		);
	}
}

// DELETE /api/projects/[id] - Delete a project
export async function DELETE(
	req: NextRequest,
	{ params }: { params: { id: string } }
): Promise<NextResponse> {
	const session = await getServerSession(authOptions);

	// Check if user is authenticated
	if (!session?.user?.id) {
		return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
	}

	const { id } = params;

	try {
		// Validate ObjectId format
		if (!ObjectId.isValid(id)) {
			return NextResponse.json({ message: 'Invalid project ID' }, { status: 400 });
		}

		const { db } = await connectToDatabase();

		// Check if project exists and belongs to user
		const project = await db.collection('projects').findOne({
			_id: new ObjectId(id),
			userId: session.user.id
		});

		if (!project) {
			return NextResponse.json({ message: 'Project not found' }, { status: 404 });
		}

		// Delete project
		await db.collection('projects').deleteOne({
			_id: new ObjectId(id),
			userId: session.user.id
		});

		return NextResponse.json({ message: 'Project deleted successfully' });
	} catch (error) {
		console.error('Error deleting project:', error);
		return NextResponse.json(
			{ message: 'Failed to delete project' },
			{ status: 500 }
		);
	}
}