// lib/mongodb.ts
import mongoose from 'mongoose';

const MONGODB_URI = process.env.MONGODB_URI!;

if (!MONGODB_URI) {
  throw new Error('Please define the MONGODB_URI environment variable');
}

let cached = globalThis.mongoose;

if (!cached) {
  cached = globalThis.mongoose = { con: null, promise: null };
}

// If the MongoDB connection is cached, return it
export async function connectToDatabase() {
  if (cached.con) return cached.con;

  if (!cached.promise) {
    cached.promise = mongoose.connect(MONGODB_URI, {
      bufferCommands: false,
    }).then(m => m);
  }

  cached.con = await cached.promise;
  return cached.con;
}
