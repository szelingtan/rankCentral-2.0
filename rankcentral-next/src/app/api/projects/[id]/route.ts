import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import mongoose from 'mongoose';
import { Project } from '@/models/Project';
import { Report } from '@/models/Report';
import { connectMongoose } from '@/lib/db/mongoose';
import { ObjectId } from 'mongodb';
import { authOptions } from '@/lib/auth';

// Define an interface for the project document
interface ProjectDocument {
    _id: mongoose.Types.ObjectId | string;
    userId: string;
    name: string;
    description?: string;
    createdAt: string;
    lastUpdated: string;
    status: 'active' | 'completed' | 'archived';
    documents: string[];
    reports?: string[] | ObjectId[];
    __v?: number;
}

// GET /api/projects/[id] - Get a single project by ID
export async function GET(
	request: Request,
	{ params }: { params: Promise<{ id: string }> }
) {
	try {
		// Get the user session
		const session = await getServerSession(authOptions);

		if (!session?.user?.id) {
			return NextResponse.json(
				{ error: "You must be logged in to view projects" },
				{ status: 401 }
			);
		}

		// Await params before accessing its properties (Next.js 15 requirement)
		const { id } = await params;

		// Connect to the database using Mongoose
		await connectMongoose();

		// Check if the ID is valid
		if (!mongoose.isValidObjectId(id)) {
			return NextResponse.json(
				{ error: "Invalid project ID" },
				{ status: 400 }
			);
		}

		// Find the project
		const project = await Project.findOne({
			_id: id,
			userId: session.user.id
		}).lean() as ProjectDocument;

		if (!project) {
			return NextResponse.json(
				{ error: "Project not found" },
				{ status: 404 }
			);
		}

		// Get reports for this project if reports array exists
		let reports: Array<any> = [];
		if (project.reports && Array.isArray(project.reports) && project.reports.length > 0) {
			reports = await Report.find({
				_id: { $in: project.reports }
			}).lean();
		}

		// Return the project with report details
		return NextResponse.json({
			...project,
			reports
		});

	} catch (error) {
		console.error('Error fetching project:', error);
		return NextResponse.json(
			{ error: "Failed to fetch project" },
			{ status: 500 }
		);
	}
}

// PATCH /api/projects/[id] - Update a project
export async function PATCH(
	request: Request,
	{ params }: { params: Promise<{ id: string }> }
) {
	try {
		// Get the user session
		const session = await getServerSession(authOptions);

		if (!session?.user?.id) {
			return NextResponse.json(
				{ error: "You must be logged in to update projects" },
				{ status: 401 }
			);
		}

		// Await params before accessing its properties (Next.js 15 requirement)
		const { id } = await params;

		// Connect to the database using Mongoose
		await connectMongoose();

		// Check if the ID is valid
		if (!mongoose.isValidObjectId(id)) {
			return NextResponse.json(
				{ error: "Invalid project ID" },
				{ status: 400 }
			);
		}

		// Parse the request body
		const body = await request.json();

		// Find the project and check ownership
		const project = await Project.findOne({
			_id: id,
			userId: session.user.id
		});

		if (!project) {
			return NextResponse.json(
				{ error: "Project not found or you don't have permission to modify it" },
				{ status: 404 }
			);
		}

		// Prepare the update object
		const updateData: any = {
			lastUpdated: new Date()
		};

		// Update allowed fields only
		if (body.name && body.name.trim() !== '') {
			updateData.name = body.name.trim();
		}

		if (body.hasOwnProperty('description')) {
			updateData.description = body.description ? body.description.trim() : '';
		}

		if (body.status && ['active', 'completed', 'archived'].includes(body.status)) {
			updateData.status = body.status;
		}

		// Update the project
		const updatedProject = await Project.findByIdAndUpdate(
			id,
			{ $set: updateData },
			{ new: true } // Return the updated document
		).lean();

		return NextResponse.json(updatedProject);

	} catch (error) {
		console.error('Error updating project:', error);
		return NextResponse.json(
			{ error: "Failed to update project" },
			{ status: 500 }
		);
	}
}

// DELETE /api/projects/[id] - Delete a project
export async function DELETE(
	request: Request,
	{ params }: { params: Promise<{ id: string }> }
) {
	try {
		// Get the user session
		const session = await getServerSession(authOptions);

		if (!session?.user?.id) {
			return NextResponse.json(
				{ error: "You must be logged in to delete projects" },
				{ status: 401 }
			);
		}

		// Await params before accessing its properties (Next.js 15 requirement)
		const { id } = await params;

		// Connect to the database using Mongoose
		await connectMongoose();

		// Check if the ID is valid
		if (!mongoose.isValidObjectId(id)) {
			return NextResponse.json(
				{ error: "Invalid project ID" },
				{ status: 400 }
			);
		}

		// Find the project and check ownership
		const project = await Project.findOne({
			_id: id,
			userId: session.user.id
		});

		if (!project) {
			return NextResponse.json(
				{ error: "Project not found or you don't have permission to delete it" },
				{ status: 404 }
			);
		}

		// Delete the project
		await Project.findByIdAndDelete(id);

		// Note: In a real-world scenario, you might want to:
		// 1. Archive instead of delete
		// 2. Handle associated reports and documents
		// 3. Make this a soft delete by adding a 'deleted' flag

		return NextResponse.json(
			{ message: "Project deleted successfully" }
		);

	} catch (error) {
		console.error('Error deleting project:', error);
		return NextResponse.json(
			{ error: "Failed to delete project" },
			{ status: 500 }
		);
	}
}
