import type { NextApiRequest, NextApiResponse } from 'next';
import { connectToDatabase } from '@/lib/db/mongodb';
import bcrypt from 'bcrypt';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method Not Allowed' });
  }

  const { email, password, name } = req.body;
  console.log(req.body);

  if (!email || !password) {
    return res.status(400).json({ message: 'Email and password are required' });
  }

  try {
    const { db } = await connectToDatabase();

    // Check if user already exists
    const existingUser = await db.collection('users').findOne({ email });
    if (existingUser) {
      return res.status(409).json({ message: 'User already exists' });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create user
    const result = await db.collection('users').insertOne({
      email,
      password: hashedPassword,
      name: name ?? email.split('@')[0],
      role: 'user',
      created_at: new Date().toISOString(),
      last_login: null,
      preferences: {
        max_reports: 5,
        default_evaluation_method: 'criteria',
      },
      usage: {
        total_comparisons: 0,
        total_documents: 0,
        last_activity: new Date().toISOString(),
      },
    });

    return res.status(201).json({ message: 'User registered successfully', userId: result.insertedId.toString() });
  } catch (error) {
    console.error('Registration error:', error);
    return res.status(500).json({ message: 'Something went wrong' });
  }
}
