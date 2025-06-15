import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import mongoose from 'mongoose';
import { Project } from '@/models/Project';
import { connectMongoose } from '@/lib/db/mongoose';
import { authOptions } from '@/lib/auth';

// GET /api/projects - Get all projects for the current user
export async function GET(request: Request) {
  try {
    // Get the user session
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "You must be logged in to view projects" },
        { status: 401 }
      );
    }
    
    // Connect to the database using Mongoose
    await connectMongoose();
    
    // Get query parameters
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const search = searchParams.get('search');
    
    // Build query filters
    const query: any = { userId: session.user.id };
    
    if (status && ['active', 'completed', 'archived'].includes(status)) {
      query.status = status;
    }
    
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } }
      ];
    }
    
    // Fetch projects with pagination
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const skip = (page - 1) * limit;
    
    const projects = await Project.find(query)
      .sort({ lastUpdated: -1 })
      .skip(skip)
      .limit(limit)
      .lean();
    
    // Get total count for pagination
    const total = await Project.countDocuments(query);
    
    return NextResponse.json({
      projects,
      pagination: {
        total,
        page,
        limit,
        pages: Math.ceil(total / limit)
      }
    });
    
  } catch (error) {
    console.error('Error fetching projects:', error);
    return NextResponse.json(
      { error: "Failed to fetch projects" },
      { status: 500 }
    );
  }
}

// POST /api/projects - Create a new project
export async function POST(request: Request) {
  try {
    // Get the user session
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "You must be logged in to create projects" },
        { status: 401 }
      );
    }
    
    // Connect to the database using Mongoose
    await connectMongoose();
    
    // Parse the request body
    const body = await request.json();
    
    // Validate required fields
    if (!body.name || body.name.trim() === '') {
      return NextResponse.json(
        { error: "Project name is required" },
        { status: 400 }
      );
    }
    
    // Create a new project
    const newProject = new Project({
      name: body.name.trim(),
      description: body.description ? body.description.trim() : '',
      userId: session.user.id,
      createdAt: new Date(),
      lastUpdated: new Date(),
      status: 'active',
      documents: [],
      reports: []
    });
    
    // Save the project to the database
    await newProject.save();
    
    return NextResponse.json(newProject, { status: 201 });
    
  } catch (error) {
    console.error('Error creating project:', error);
    return NextResponse.json(
      { error: "Failed to create project" },
      { status: 500 }
    );
  }
}