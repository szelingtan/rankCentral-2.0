/**
 * @fileoverview MongoDB connection utilities for the application.
 * Provides connection management, database access, and connection pooling.
 */

// src/lib/db/mongodb.ts

import { MongoClient, Db } from 'mongodb';

/** @type {string} MongoDB connection string from environment variables */
const MONGODB_URI = process.env.MONGODB_URI || '';
/** @type {string} MongoDB database name from environment variables */
const MONGODB_DB = process.env.MONGODB_DB || 'document-comparison';

/** @type {MongoClient|null} Global variable to store the MongoDB client between requests */
let cachedClient: MongoClient | null = null;
/** @type {Db|null} Global variable to store the MongoDB database instance between requests */
let cachedDb: Db | null = null;

/**
 * Connect to MongoDB and get the database instance.
 * This function caches the database connection to reuse it between requests.
 * 
 * @async
 * @function connectToDatabase
 * @returns {Promise<{client: MongoClient, db: Db}>} The MongoDB client and database instance
 * @throws {Error} If MONGODB_URI environment variable is not set or connection fails
 */
export async function connectToDatabase(): Promise<{ client: MongoClient; db: Db }> {
  // If the connection is already established, return the cached client and database
  if (cachedClient && cachedDb) {
    return { client: cachedClient, db: cachedDb };
  }

  // Check if the connection string exists
  if (!MONGODB_URI) {
    throw new Error(
      'Please define the MONGODB_URI environment variable inside .env.local'
    );
  }

  // Connect to the MongoDB database
  let client: MongoClient;
  let db: Db;

  try {
    // Connect with a max retry time of 5 seconds
    client = new MongoClient(MONGODB_URI, {
      serverSelectionTimeoutMS: 5000
    });

    await client.connect();
    console.log('Successfully connected to MongoDB!');
    
    // Get the database
    db = client.db(MONGODB_DB);
    
    // Cache the database connection for reuse
    cachedClient = client;
    cachedDb = db;
    
    return { client, db };
  } catch (error) {
    console.error('Failed to connect to MongoDB:', error);
    throw error;
  }
}

/**
 * Get the MongoDB database instance.
 * For server-side rendering or API routes that need database access.
 * 
 * @async
 * @function getDb
 * @returns {Promise<Db>} The MongoDB database instance
 * @throws {Error} If connection to database fails
 */
export async function getDb(): Promise<Db> {
  const { db } = await connectToDatabase();
  return db;
}

/**
 * Close the database connection.
 * Should be called when the application is shutting down.
 * 
 * @async
 * @function closeDatabase
 * @returns {Promise<void>}
 */
export async function closeDatabase(): Promise<void> {
  if (cachedClient) {
    await cachedClient.close();
    cachedClient = null;
    cachedDb = null;
    console.log('MongoDB connection closed');
  }
}

// For direct database access when not using async/await
// Not recommended for most use cases - prefer getDb()
let globalDb: Db | null = null;

// Initialize the database connection
(async () => {
  try {
    const { db } = await connectToDatabase();
    globalDb = db;
  } catch (error) {
    console.error('Failed to initialize global database connection:', error);
  }
})();

// Export the global db object for convenience
export const db = globalDb;