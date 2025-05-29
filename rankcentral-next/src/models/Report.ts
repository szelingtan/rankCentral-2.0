/**
 * @fileoverview Report model schema definitions for MongoDB using Mongoose.
 * Defines the structure for evaluation reports and CSV file data.
 */

import mongoose from 'mongoose';

/**
 * Schema for CSV file data within reports.
 * Stores filename and content for exported data.
 * @type {mongoose.Schema}
 */
// Define schema for CSV files
const CsvFileSchema = new mongoose.Schema({
    /** @type {string} Name of the CSV file */
    filename: { type: String, required: true },
    /** @type {string} CSV file content as string */
    content: { type: String, required: true }
}, { _id: false });

/**
 * Mongoose schema for Report collection.
 * Reports contain evaluation results, rankings, and analysis data.
 * @type {mongoose.Schema}
 */
const ReportSchema = new mongoose.Schema({
    /** @type {Date} Report generation timestamp */
    timestamp: { type: Date, required: true, default: Date.now },
    /** @type {string[]} Array of document names included in the evaluation */
    documents: { type: [String], required: true },
    /** @type {string} Name of the highest-ranked document */
    top_ranked: { type: String, required: true },
    /** @type {Object[]} Array of CSV file objects containing exported data */
    csv_files: { type: [mongoose.Schema.Types.Mixed], required: true },
    /** @type {number} Number of criteria used in the evaluation */
    criteria_count: { type: Number, required: true },
    /** @type {string} Method used for evaluation - either 'prompt' or 'criteria' */
    evaluation_method: {
        type: String,
        required: true,
        enum: ['prompt', 'criteria']
    },
    /** @type {string} Custom prompt text used for evaluation (if applicable) */
    custom_prompt: { type: String, default: '' },
    /** @type {string} User-provided name for the report */
    report_name: { type: String, required: true },
    /** @type {string} Status of the API key used during evaluation */
    api_key_status: {
        type: String,
        required: true,
        enum: ['Valid API key', 'Invalid API key']
    }
});

/**
 * Report model for MongoDB operations.
 * Uses existing model if already compiled, otherwise creates new model.
 * @type {mongoose.Model}
 */
export const Report = mongoose.models.Report || mongoose.model('Report', ReportSchema);
