/**
 * @fileoverview Mongoose connection utilities for the application.
 * Provides connection management specifically for Mongoose ODM.
 */

import mongoose from 'mongoose';

/** @type {string} MongoDB connection string from environment variables */
const MONGODB_URI = process.env.MONGODB_URI || '';

// Add a global property for mongoose to prevent multiple connections in development
interface MongooseCache {
  conn: mongoose.Connection | null;
  promise: Promise<mongoose.Connection> | null;
}

declare global {
  var mongoose: MongooseCache | undefined;
}

// Create cached connection
let cached: MongooseCache = global.mongoose || { conn: null, promise: null };

if (!global.mongoose) {
  global.mongoose = cached;
}

/**
 * Connect to MongoDB using Mongoose.
 * This function caches the connection to reuse it between requests.
 * 
 * @async
 * @function connectMongoose
 * @returns {Promise<mongoose.Connection>} The Mongoose connection instance
 * @throws {Error} If MONGODB_URI environment variable is not set or connection fails
 */
export async function connectMongoose(): Promise<mongoose.Connection> {
  // If the connection is already established, return the cached connection
  if (cached.conn) {
    return cached.conn;
  }

  // Check if the connection string exists
  if (!MONGODB_URI) {
    throw new Error(
      'Please define the MONGODB_URI environment variable inside .env.local'
    );
  }

  // If there's no ongoing connection promise, create one
  if (!cached.promise) {
    const opts = {
      bufferCommands: false,
      maxPoolSize: 10,
      serverSelectionTimeoutMS: 10000, // Increase timeout to 10 seconds
      socketTimeoutMS: 45000,
      family: 4, // Use IPv4, skip trying IPv6
    };

    cached.promise = mongoose.connect(MONGODB_URI, opts).then((mongoose) => {
      console.log('Successfully connected to MongoDB via Mongoose!');
      return mongoose.connection;
    });
  }

  try {
    cached.conn = await cached.promise;
    return cached.conn;
  } catch (error) {
    cached.promise = null;
    console.error('Failed to connect to MongoDB via Mongoose:', error);
    throw error;
  }
}

/**
 * Disconnect from MongoDB.
 * Should be called when the application is shutting down.
 * 
 * @async
 * @function disconnectMongoose
 * @returns {Promise<void>}
 */
export async function disconnectMongoose(): Promise<void> {
  if (cached.conn) {
    await mongoose.disconnect();
    cached.conn = null;
    cached.promise = null;
    console.log('Mongoose connection closed');
  }
}

/**
 * Check if Mongoose is connected to the database.
 * 
 * @function isMongooseConnected
 * @returns {boolean} True if connected, false otherwise
 */
export function isMongooseConnected(): boolean {
  return mongoose.connection.readyState === 1;
}

export default connectMongoose;
