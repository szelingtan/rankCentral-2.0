/**
 * @fileoverview Project model schema definition for MongoDB using Mongoose.
 * Defines the structure for project documents that contain document collections and reports.
 */

import mongoose from 'mongoose';

/**
 * Mongoose schema for Project collection.
 * Projects group documents together for comparison and analysis.
 * @type {mongoose.Schema}
 */
const ProjectSchema = new mongoose.Schema({
    /** @type {string} Project name - required */
    name: { type: String, required: true },
    /** @type {string} Project description - optional */
    description: { type: String, default: '' },
    /** @type {mongoose.Schema.Types.ObjectId} Reference to User who owns this project */
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    /** @type {Date} Project creation timestamp */
    createdAt: { type: Date, default: Date.now },
    /** @type {Date} Last modification timestamp */
    lastUpdated: { type: Date, default: Date.now },
    /** @type {string} Project status - active, completed, or archived */
    status: { 
        type: String, 
        required: true, 
        enum: ['active', 'completed', 'archived'],
        default: 'active'
    },
    /** @type {string[]} Array of document file paths associated with this project */
    documents: [{ type: String }], // References to document paths
    /** @type {mongoose.Schema.Types.ObjectId[]} Array of Report references */
    reports: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Report' }],
});

/**
 * Project model for MongoDB operations.
 * Uses existing model if already compiled, otherwise creates new model.
 * @type {mongoose.Model}
 */
export const Project = mongoose.models.Project || mongoose.model('Project', ProjectSchema);