import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { connectToDatabase } from '@/lib/db/mongodb';
import { ObjectId } from 'mongodb';

// GET /api/projects - Get all projects for the current user
export async function GET(req: NextRequest): Promise<NextResponse> {
	const session = await getServerSession(authOptions);

	// Check if user is authenticated
	if (!session?.user?.id) {
		return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
	}

	try {
		const { db } = await connectToDatabase();
		const projects = await db
			.collection('projects')
			.find({ userId: session.user.id })
			.sort({ createdAt: -1 })
			.toArray();

		// Convert MongoDB ObjectIds to strings for JSON serialization
		const serializedProjects = projects.map((project) => ({
			...project,
			_id: project._id.toString(),
		}));

		return NextResponse.json(serializedProjects);
	} catch (error) {
		console.error('Error fetching projects:', error);
		return NextResponse.json(
			{ message: 'Failed to fetch projects' },
			{ status: 500 }
		);
	}
}

// POST /api/projects - Create a new project
export async function POST(req: NextRequest): Promise<NextResponse> {
	const session = await getServerSession(authOptions);

	// Check if user is authenticated
	if (!session?.user?.id) {
		return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
	}

	try {
		const { name, description } = await req.json();

		// Validate required fields
		if (!name || name.trim() === '') {
			return NextResponse.json(
				{ message: 'Project name is required' },
				{ status: 400 }
			);
		}

		const { db } = await connectToDatabase();

		// Create new project document
		const newProject = {
			name,
			description: description || '',
			userId: session.user.id,
			createdAt: new Date().toISOString(),
			updatedAt: new Date().toISOString(),
			documents: [],
			comparisons: [],
		};

		const result = await db.collection('projects').insertOne(newProject);

		// Return created project with string ID
		return NextResponse.json({
			...newProject,
			_id: result.insertedId.toString(),
		});
	} catch (error) {
		console.error('Error creating project:', error);
		return NextResponse.json(
			{ message: 'Failed to create project' },
			{ status: 500 }
		);
	}
}