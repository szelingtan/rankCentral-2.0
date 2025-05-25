import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import mongoose from 'mongoose';
import { Project } from '@/models/Project';
import { Report } from '@/models/Report';
import { connectToDatabase } from '@/lib/db/mongodb';

// Define an interface for the project document to ensure TypeScript knows about the reports field
interface ProjectDocument {
    _id: mongoose.Types.ObjectId;
    reports: mongoose.Types.ObjectId[];
    lastUpdated: Date;
    userId: string;
    [key: string]: any;
}

// GET /api/projects/[id]/reports - Get all reports for a project
export async function GET(
	request: Request,
	{ params }: { params: Promise<{ id: string }> }
) {
	try {
		const session = await getServerSession();

		if (!session?.user?.id) {
			return NextResponse.json(
				{ error: "You must be logged in to view project reports" },
				{ status: 401 }
			);
		}

		// Await params before accessing its properties (Next.js 15 requirement)
		const { id } = await params;

		await connectToDatabase();

		if (!mongoose.isValidObjectId(id)) {
			return NextResponse.json(
				{ error: "Invalid project ID" },
				{ status: 400 }
			);
		}

		// Get the project with proper typing
		const project = await Project.findOne({
			_id: id,
			userId: session.user.id
		}).lean();

		if (!project) {
			return NextResponse.json(
				{ error: "Project not found" },
				{ status: 404 }
			);
		}

		// Safe type assertion after checking project exists
		const typedProject = project as unknown as ProjectDocument;

		// Ensure TypeScript recognizes reports property
		const reports = await Report.find({
			_id: { $in: typedProject.reports }
		}).lean();

		return NextResponse.json({
			reports,
			count: reports.length
		});

	} catch (error) {
		console.error('Error fetching project reports:', error);
		return NextResponse.json(
			{ error: "Failed to fetch project reports" },
			{ status: 500 }
		);
	}
}

// POST /api/projects/[id]/reports - Add reports to a project
export async function POST(
	request: Request,
	{ params }: { params: Promise<{ id: string }> }
) {
	try {
		const session = await getServerSession();

		if (!session?.user?.id) {
			return NextResponse.json(
				{ error: "You must be logged in to add reports to projects" },
				{ status: 401 }
			);
		}

		// Await params before accessing its properties (Next.js 15 requirement)
		const { id } = await params;

		await connectToDatabase();

		if (!mongoose.isValidObjectId(id)) {
			return NextResponse.json(
				{ error: "Invalid project ID" },
				{ status: 400 }
			);
		}

		const body = await request.json();

		if (!body.reports || !Array.isArray(body.reports) || body.reports.length === 0) {
			return NextResponse.json(
				{ error: "Reports array is required and must not be empty" },
				{ status: 400 }
			);
		}

		const reportIds = [];
		for (const reportId of body.reports) {
			if (mongoose.isValidObjectId(reportId)) {
				reportIds.push(reportId);
			}
		}

		if (reportIds.length === 0) {
			return NextResponse.json(
				{ error: "No valid report IDs provided" },
				{ status: 400 }
			);
		}

		const existingReports = await Report.find({
			_id: { $in: reportIds },
			userId: session.user.id
		}).select('_id');

		if (existingReports.length === 0) {
			return NextResponse.json(
				{ error: "No valid reports found" },
				{ status: 404 }
			);
		}

		const validReportIds = existingReports.map(report => report._id);

		const project = await Project.findOne({
			_id: id,
			userId: session.user.id
		});

		if (!project) {
			return NextResponse.json(
				{ error: "Project not found" },
				{ status: 404 }
			);
		}

		// Safe type assertion after checking project exists
		const typedProject = project as unknown as ProjectDocument;

		const currentReportIds = typedProject.reports.map((id: mongoose.Types.ObjectId) => id.toString());
		const newReportIds = validReportIds.filter(id => !currentReportIds.includes(id.toString()));

		if (newReportIds.length === 0) {
			return NextResponse.json({
				message: "No new reports to add",
				reports: typedProject.reports,
				count: typedProject.reports.length
			});
		}

		typedProject.reports = [...typedProject.reports, ...newReportIds];
		typedProject.lastUpdated = new Date();
		await project.save();

		await Report.updateMany(
			{ _id: { $in: newReportIds } },
			{ $set: { projectId: typedProject._id } }
		);

		return NextResponse.json({
			message: `${newReportIds.length} reports added to project`,
			reports: typedProject.reports,
			count: typedProject.reports.length
		});

	} catch (error) {
		console.error('Error adding reports to project:', error);
		return NextResponse.json(
			{ error: "Failed to add reports to project" },
			{ status: 500 }
		);
	}
}

// DELETE /api/projects/[id]/reports - Remove reports from a project
export async function DELETE(
	request: Request,
	{ params }: { params: Promise<{ id: string }> }
) {
	try {
		const session = await getServerSession();

		if (!session?.user?.id) {
			return NextResponse.json(
				{ error: "You must be logged in to remove reports from projects" },
				{ status: 401 }
			);
		}

		// Await params before accessing its properties (Next.js 15 requirement)
		const { id } = await params;

		await connectToDatabase();

		if (!mongoose.isValidObjectId(id)) {
			return NextResponse.json(
				{ error: "Invalid project ID" },
				{ status: 400 }
			);
		}

		const body = await request.json();

		if (!body.reports || !Array.isArray(body.reports) || body.reports.length === 0) {
			return NextResponse.json(
				{ error: "Reports array is required and must not be empty" },
				{ status: 400 }
			);
		}

		const project = await Project.findOne({
			_id: id,
			userId: session.user.id
		});

		if (!project) {
			return NextResponse.json(
				{ error: "Project not found" },
				{ status: 404 }
			);
		}

		// Safe type assertion after checking project exists
		const typedProject = project as unknown as ProjectDocument;

		// Fix the typing issues
		const reportsToRemove = new Set<string>(body.reports.map((id: string) => id.toString()));
		const updatedReports = typedProject.reports.filter(
			(reportId: mongoose.Types.ObjectId) => !reportsToRemove.has(reportId.toString())
		);

		typedProject.reports = updatedReports;
		typedProject.lastUpdated = new Date();
		await project.save();

		// Convert strings to ObjectIds with proper typing
		const reportsToRemoveArray = Array.from(reportsToRemove);
		const objectIdsToRemove = reportsToRemoveArray.map(id => new mongoose.Types.ObjectId(id.toString()));

		await Report.updateMany(
			{ 
				_id: { $in: objectIdsToRemove },
				projectId: typedProject._id 
			},
			{ $unset: { projectId: "" } }
		);

		return NextResponse.json({
			message: `${reportsToRemoveArray.length} reports removed from project`,
			reports: typedProject.reports,
			count: typedProject.reports.length
		});

	} catch (error) {
		console.error('Error removing reports from project:', error);
		return NextResponse.json(
			{ error: "Failed to remove reports from project" },
			{ status: 500 }
		);
	}
}
