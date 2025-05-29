/**
 * @fileoverview Database schema definitions and TypeScript interfaces for MongoDB collections.
 * Defines the structure and types for User, Project, Report, and DocumentUpload entities.
 */

// src/lib/db/schema.ts
import { ObjectId } from 'mongodb';

/**
 * User document structure in the database.
 * @interface User
 */
export interface User {
	/** @type {ObjectId} [_id] MongoDB document ID */
	_id?: ObjectId;
	/** @type {string} User's email address (unique) */
	email: string;
	/** @type {string} Hashed password */
	password: string;
	/** @type {string} User role (admin/user) */
	role: string;
	/** @type {string} ISO timestamp of account creation */
	createdAt: string;
	/** @type {string} [lastLogin] ISO timestamp of last login */
	lastLogin?: string;
	/** @type {Object} User preferences and settings */
	preferences: {
		/** @type {number} Maximum number of reports allowed */
		maxReports: number;
		/** @type {string} Default evaluation method preference */
		defaultEvaluationMethod: string;
	};
	/** @type {Object} Usage statistics and metrics */
	usage: {
		/** @type {number} Total number of document comparisons performed */
		totalComparisons: number;
		/** @type {number} Total number of documents processed */
		totalDocuments: number;
		/** @type {string} ISO timestamp of last activity */
		lastActivity: string;
		/** @type {number} [totalReports] Total number of reports generated */
		totalReports?: number;
	};
}

/**
 * Project document structure in the database.
 * Projects group related documents and reports together.
 * @interface Project
 */
export interface Project {
	/** @type {ObjectId} [_id] MongoDB document ID */
	_id?: ObjectId;
	/** @type {string} Project name */
	name: string;
	/** @type {string} [description] Optional project description */
	description?: string;
	/** @type {string|ObjectId} Reference to the owning user */
	userId: string | ObjectId;
	/** @type {string} ISO timestamp of project creation */
	createdAt: string;
	/** @type {string} ISO timestamp of last update */
	lastUpdated: string;
	/** @type {'active'|'completed'|'archived'} Current project status */
	status: 'active' | 'completed' | 'archived';
	/** @type {string[]} Array of document file paths */
	documents: string[];
	/** @type {string[]|ObjectId[]} Array of report IDs associated with this project */
	reports: string[] | ObjectId[];
}

/**
 * Report document structure in the database.
 * Contains evaluation results and metadata.
 * @interface Report
 */
export interface Report {
	/** @type {ObjectId} [_id] MongoDB document ID */
	_id?: ObjectId;
	/** @type {string} ID of the user who created the report */
	userId: string;
	/** @type {string} ISO timestamp of report generation */
	timestamp: string;
	/** @type {string[]} Array of document names included in the evaluation */
	documents: string[];
	/** @type {string} [topRanked] Name of the highest-ranked document */
	topRanked?: string;
	/** @type {string} Report data stored as JSON string */
	reportData: string; // Stored as JSON string
	/** @type {number} Number of criteria used in the evaluation */
	criteriaCount: number;
	/** @type {string} Evaluation method used (criteria/prompt) */
	evaluationMethod: string;
	/** @type {string} [customPrompt] Custom prompt text if used */
	customPrompt?: string;
	/** @type {string} User-provided name for the report */
	reportName: string;
	/** @type {string|ObjectId} [projectId] Reference to parent project */
	projectId?: string | ObjectId; // Reference to a project
}

/**
 * Document upload record structure in the database.
 * Tracks uploaded files and their metadata.
 * @interface DocumentUpload
 */
export interface DocumentUpload {
	/** @type {ObjectId} [_id] MongoDB document ID */
	_id?: ObjectId;
	/** @type {string} ID of the user who uploaded the document */
	userId: string;
	/** @type {string} Original file name as uploaded by the user */
	originalName: string;
	/** @type {string} File path where the document is stored */
	path: string;
	/** @type {number} Size of the file in bytes */
	size: number;
	/** @type {string} ISO timestamp of when the document was uploaded */
	uploadDate: string;
	/** @type {string} MIME type of the uploaded file */
	mimeType: string;
	/** @type {string|ObjectId} [projectId] Reference to the project associated with the document */
	projectId?: string | ObjectId; // Reference to a project
}

/**
 * NextAuth types extension for custom user properties.
 * Extends the default NextAuth types to include role information.
 */
declare module "next-auth" {
	/**
	 * Extended User interface with role information.
	 * @interface User
	 */
	interface User {
		/** @type {string} User ID */
		id: string;
		/** @type {string} User email address */
		email: string;
		/** @type {string} User role (admin/user) */
		role: string;
		/** @type {string} [name] Optional user display name */
		name?: string;
	}

	/**
	 * Extended Session interface with user role information.
	 * @interface Session
	 */
	interface Session {
		/** @type {Object} User session data */
		user: {
			/** @type {string} User ID */
			id: string;
			/** @type {string} User email address */
			email: string;
			/** @type {string} User role (admin/user) */
			role: string;
			/** @type {string} [name] Optional user display name */
			name?: string;
		};
	}
}

/**
 * NextAuth JWT token extension.
 */
declare module "next-auth/jwt" {
	/**
	 * Extended JWT interface with user role information.
	 * @interface JWT
	 */
	interface JWT {
		/** @type {string} User ID */
		id: string;
		/** @type {string} User email address */
		email: string;
		/** @type {string} User role (admin/user) */
		role: string;
	}
}
