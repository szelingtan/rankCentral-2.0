// src/lib/db/schema.ts
import { ObjectId } from 'mongodb';

export interface User {
	_id?: ObjectId;
	email: string;
	password: string;
	role: string;
	createdAt: string;
	lastLogin?: string;
	preferences: {
		maxReports: number;
		defaultEvaluationMethod: string;
	};
	usage: {
		totalComparisons: number;
		totalDocuments: number;
		lastActivity: string;
		totalReports?: number;
	};
}

export interface Project {
	_id?: ObjectId;
	name: string;
	description?: string;
	userId: string | ObjectId;
	createdAt: string;
	lastUpdated: string;
	status: 'active' | 'completed' | 'archived';
	documents: string[];
	reports: string[] | ObjectId[];
}

export interface Report {
	_id?: ObjectId;
	userId: string;
	timestamp: string;
	documents: string[];
	topRanked?: string;
	reportData: string; // Stored as JSON string
	criteriaCount: number;
	evaluationMethod: string;
	customPrompt?: string;
	reportName: string;
	projectId?: string | ObjectId; // Reference to a project
}

export interface DocumentUpload {
	_id?: ObjectId;
	userId: string;
	filename: string;
	originalName: string;
	path: string;
	size: number;
	uploadDate: string;
	mimeType: string;
	projectId?: string | ObjectId; // Reference to a project
}

// NextAuth types extension
declare module "next-auth" {
	interface User {
		id: string;
		email: string;
		role: string;
		name?: string;
	}

	interface Session {
		user: {
			id: string;
			email: string;
			role: string;
			name?: string;
		};
	}
}

declare module "next-auth/jwt" {
	interface JWT {
		id: string;
		email: string;
		role: string;
	}
}
