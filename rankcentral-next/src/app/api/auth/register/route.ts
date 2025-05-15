import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db/mongodb';
import bcrypt from 'bcrypt';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { email, password, name } = body;

    if (!email || !password) {
      return NextResponse.json({ message: 'Email and password are required' }, { status: 400 });
    }

    const { db } = await connectToDatabase();

    // Check if user already exists
    const existingUser = await db.collection('users').findOne({ email });
    if (existingUser) {
      return NextResponse.json({ message: 'User already exists' }, { status: 409 });
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

    return NextResponse.json({ message: 'User registered successfully', userId: result.insertedId.toString() }, { status: 201 });
  } catch (error) {
    console.error('Registration error:', error);
    return NextResponse.json({ message: 'Something went wrong' }, { status: 500 });
  }
}
