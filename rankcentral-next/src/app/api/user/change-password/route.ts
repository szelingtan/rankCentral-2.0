import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db/mongodb';
import bcrypt from 'bcrypt';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { ObjectId } from 'mongodb';

export async function POST(req: NextRequest) {
  try {
    // Verify user is authenticated
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    // Get request body
    const body = await req.json();
    const { currentPassword, newPassword } = body;
    
    // Validate inputs
    if (!currentPassword || !newPassword) {
      return NextResponse.json(
        { message: 'Current password and new password are required' }, 
        { status: 400 }
      );
    }

    // Connect to database
    const { db } = await connectToDatabase();

    // Retrieve user document with password
    const user = await db.collection('users').findOne({ 
      _id: new ObjectId(session.user.id) 
    });

    if (!user) {
      return NextResponse.json({ message: 'User not found' }, { status: 404 });
    }

    // Verify current password
    const isCurrentPasswordCorrect = await bcrypt.compare(
      currentPassword, 
      user.password
    );

    if (!isCurrentPasswordCorrect) {
      return NextResponse.json({ message: 'Current password is incorrect' }, { status: 400 });
    }

    // Hash new password
    const hashedNewPassword = await bcrypt.hash(newPassword, 10);

    // Update user's password in the database
    await db.collection('users').updateOne(
      { _id: new ObjectId(session.user.id) },
      { $set: { 
          password: hashedNewPassword,
          updated_at: new Date().toISOString()
        } 
      }
    );

    return NextResponse.json({ 
      message: 'Password updated successfully' 
    });
    
  } catch (error) {
    console.error('Error changing password:', error);
    return NextResponse.json(
      { message: 'An error occurred while changing your password' }, 
      { status: 500 }
    );
  }
}