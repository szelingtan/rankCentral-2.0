import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import mongoose from 'mongoose';
import { Project } from '@/models/Project';
import { connectToDatabase } from '@/lib/db/mongodb';
import fs from 'fs';
import path from 'path';

// Define interface for project documents
interface ProjectDocument {
    _id: string;
    name: string;
    description: string;
    userId: string;
    createdAt: Date;
    lastUpdated: Date;
    status: 'active' | 'completed' | 'archived';
    documents: string[];
    reports: string[];
    __v: number;
}

// GET /api/projects/[id]/documents - Get all documents for a project
export async function GET(
    request: Request,
    { params }: { params: { id: string } }
) {
    try {
    // Get the user session
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "You must be logged in to view project documents" },
        { status: 401 }
      );
    }
    
    // Connect to the database
    await connectToDatabase();
    
    // Check if the ID is valid
    if (!mongoose.isValidObjectId(params.id)) {
      return NextResponse.json(
        { error: "Invalid project ID" },
        { status: 400 }
      );
    }
    
    // Find the project - remove .lean() to get a full Mongoose document
    const project = await Project.findOne({
      _id: params.id,
      userId: session.user.id
    }) as unknown as ProjectDocument;
    
    if (!project) {
      return NextResponse.json(
        { error: "Project not found" },
        { status: 404 }
      );
    }
    
    // Return the document paths
    return NextResponse.json({
      documents: project.documents,
      count: project.documents.length
    });
    
  } catch (error) {
    console.error('Error fetching project documents:', error);
    return NextResponse.json(
      { error: "Failed to fetch project documents" },
      { status: 500 }
    );
  }
}

// POST /api/projects/[id]/documents - Add documents to a project
export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    // Get the user session
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "You must be logged in to add documents to projects" },
        { status: 401 }
      );
    }
    
    // Connect to the database
    await connectToDatabase();
    
    // Check if the ID is valid
    if (!mongoose.isValidObjectId(params.id)) {
      return NextResponse.json(
        { error: "Invalid project ID" },
        { status: 400 }
      );
    }
    
    // Parse the request body
    const body = await request.json();
    
    if (!body.documents || !Array.isArray(body.documents) || body.documents.length === 0) {
      return NextResponse.json(
        { error: "Documents array is required and must not be empty" },
        { status: 400 }
      );
    }
    
    // Find the project
    const project = await Project.findOne({
      _id: params.id,
      userId: session.user.id
    }) as unknown as ProjectDocument & { save: () => Promise<ProjectDocument> };
    
    if (!project) {
      return NextResponse.json(
        { error: "Project not found" },
        { status: 404 }
      );
    }
    
    // Validate that each document path exists
    const validDocuments = [];
    
    for (const docPath of body.documents) {
      try {
        // This would need to be adjusted based on your storage solution
        // For local file system:
        const fullPath = path.resolve(process.cwd(), docPath);
        
        if (fs.existsSync(fullPath)) {
          validDocuments.push(docPath);
        }
      } catch (err) {
        console.warn(`Document path validation failed for ${docPath}:`, err);
      }
    }
    
    if (validDocuments.length === 0) {
      return NextResponse.json(
        { error: "No valid document paths provided" },
        { status: 400 }
      );
    }
    
    // Add documents to the project (avoiding duplicates)
    const updatedDocuments = [...new Set([...project.documents, ...validDocuments])];
    
    // Update the project
    project.documents = updatedDocuments;
    project.lastUpdated = new Date();
    await project.save();
    
    return NextResponse.json({
      message: `${validDocuments.length} documents added to project`,
      documents: project.documents,
      count: project.documents.length
    });
    
  } catch (error) {
    console.error('Error adding documents to project:', error);
    return NextResponse.json(
      { error: "Failed to add documents to project" },
      { status: 500 }
    );
  }
}

// DELETE /api/projects/[id]/documents - Remove documents from a project
export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    // Get the user session
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "You must be logged in to remove documents from projects" },
        { status: 401 }
      );
    }
    
    // Connect to the database
    await connectToDatabase();
    
    // Check if the ID is valid
    if (!mongoose.isValidObjectId(params.id)) {
      return NextResponse.json(
        { error: "Invalid project ID" },
        { status: 400 }
      );
    }
    
    // Parse the request body
    const body = await request.json();
    
    if (!body.documents || !Array.isArray(body.documents) || body.documents.length === 0) {
      return NextResponse.json(
        { error: "Documents array is required and must not be empty" },
        { status: 400 }
      );
    }
    
    // Find the project
    const project = await Project.findOne({
      _id: params.id,
      userId: session.user.id
    }) as unknown as ProjectDocument & { save: () => Promise<ProjectDocument> };
    
    if (!project) {
      return NextResponse.json(
        { error: "Project not found" },
        { status: 404 }
      );
    }
    
    // Remove the specified documents
    const documentsToRemove = new Set(body.documents);
    const updatedDocuments = project.documents.filter(
      (doc: string) => !documentsToRemove.has(doc)
    );
    
    // Update the project
    project.documents = updatedDocuments;
    project.lastUpdated = new Date();
    await project.save();
    
    return NextResponse.json({
      message: `${project.documents.length - updatedDocuments.length} documents removed from project`,
      documents: project.documents,
      count: project.documents.length
    });
    
  } catch (error) {
    console.error('Error removing documents from project:', error);
    return NextResponse.json(
      { error: "Failed to remove documents from project" },
      { status: 500 }
    );
  }
}