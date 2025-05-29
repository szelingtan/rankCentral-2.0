/**
 * @fileoverview User model schema definition for MongoDB using Mongoose.
 * Defines the structure and validation rules for user documents.
 */

import mongoose from 'mongoose';

/**
 * Mongoose schema for User collection.
 * Defines user authentication and profile data structure.
 * @type {mongoose.Schema}
 */
const UserSchema = new mongoose.Schema({
    /** @type {string} User's email address - required and unique */
    email: { type: String, required: true, unique: true },
    /** @type {string} Hashed password - required */
    password: { type: String, required: true },
    /** @type {string} User role - either 'admin' or 'user' */
    role: { type: String, required: true, enum: ['admin', 'user'] },
    /** @type {Date} Account creation timestamp */
    created_at: { type: Date, default: Date.now },
    /** @type {Date} Last login timestamp */
    last_login: { type: Date, default: Date.now },
})

/**
 * User model for MongoDB operations.
 * Uses existing model if already compiled, otherwise creates new model.
 * @type {mongoose.Model}
 */
export const User = mongoose.models.User || mongoose.model('User', UserSchema);