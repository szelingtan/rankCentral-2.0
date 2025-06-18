// src/lib/utils/file-utils.ts
import { writeFile, mkdir } from 'fs/promises';
import { join } from 'path';
import { nanoid } from 'nanoid';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';

/**
 * Converts a File object to an ArrayBuffer for direct processing
 * @param file The file to convert
 * @returns A promise that resolves to the ArrayBuffer
 */
export async function fileToArrayBuffer(file: File): Promise<ArrayBuffer> {
  return await file.arrayBuffer();
}

export async function getUploadDir() {
	// Create a temp directory for uploads
	const uploadDir = join(process.cwd(), 'tmp', 'uploads');

	// Ensure directory exists
	try {
		await mkdir(uploadDir, { recursive: true });
	} catch (error) {
		console.error('Error creating upload directory:', error);
	}

	return uploadDir;
}

export async function getUserUploadDir() {
	// Get the current user session
	const session = await getServerSession(authOptions);
	if (!session?.user?.id) {
		throw new Error('User not authenticated');
	}

	const userId = session.user.id;
	const userDir = join(await getUploadDir(), userId);

	// Ensure user directory exists
	try {
		await mkdir(userDir, { recursive: true });
	} catch (error) {
		console.error('Error creating user directory:', error);
	}

	return userDir;
}

export async function savePDF(file: File): Promise<string> {
	try {
		const userDir = await getUserUploadDir();

		// Generate a unique filename
		const fileId = nanoid();
		const originalName = file.name;
		const extension = originalName.split('.').pop() || 'pdf';
		const filename = `${fileId}.${extension}`;
		const filepath = join(userDir, filename);

		// Convert the file to a buffer
		const arrayBuffer = await file.arrayBuffer();
		const buffer = Buffer.from(arrayBuffer);

		// Write the file
		await writeFile(filepath, buffer);

		// Return the path relative to the user directory
		return filename;
		} catch (error: any) {
		console.error('Error saving PDF:', error);
		throw new Error(`Failed to save file: ${error.message}`);
	}
}

export async function clearUploadDir() {
	// This would be implemented to clean up old files
	// For example, using a cron job or scheduled task
}
