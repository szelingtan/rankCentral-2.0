// src/lib/db/mongodb.ts

import { MongoClient, Db } from 'mongodb';

// MongoDB connection string from environment variables
const MONGODB_URI = process.env.MONGODB_URI || '';
const MONGODB_DB = process.env.MONGODB_DB || 'document-comparison';

// Global variable to store the MongoDB client between requests
let cachedClient: MongoClient | null = null;
let cachedDb: Db | null = null;

/**
 * Connect to MongoDB and get the database instance
 * 
 * This function caches the database connection to reuse it between requests
 * 
 * @returns The MongoDB database instance
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
 * Get the MongoDB database instance
 * 
 * For server-side rendering or API routes that need database access
 */
export async function getDb(): Promise<Db> {
  const { db } = await connectToDatabase();
  return db;
}

/**
 * Close the database connection
 * 
 * Should be called when the application is shutting down
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