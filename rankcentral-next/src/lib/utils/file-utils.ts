// src/lib/utils/file-utils.ts
import { writeFile, mkdir } from 'fs/promises';
import { join } from 'path';
import { nanoid } from 'nanoid';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth'; // Need to set up api/auth/

/**
 * Converts a File object to a Base64 string
 * @param file The file to convert
 * @returns A promise that resolves to the Base64 string
 */
export async function convertPdfToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        resolve(reader.result);
      } else {
        reject(new Error('Failed to convert file to base64'));
      }
    };
    reader.onerror = error => reject(error);
  });
}

/**
 * Reads a text file and returns its contents as a string
 * @param file The file to read
 * @returns A promise that resolves to the file contents
 */
export async function readFileAsText(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsText(file);
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        resolve(reader.result);
      } else {
        reject(new Error('Failed to read file as text'));
      }
    };
    reader.onerror = error => reject(error);
  });
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

export async function readBase64PDF(base64Content: string): Promise<Buffer> {
	// Remove data URL prefix if present
	if (base64Content.includes(',')) {
		base64Content = base64Content.split(',')[1];
	}

	// Decode base64 content
	return Buffer.from(base64Content, 'base64');
}

export async function saveBase64PDF(base64Content: string, filename: string): Promise<string> {
	try {
		const userDir = await getUserUploadDir();

		// Generate a unique filename
		const fileId = nanoid();
		const extension = filename.split('.').pop() || 'pdf';
		const newFilename = `${fileId}.${extension}`;
		const filepath = join(userDir, newFilename);

		// Decode and save the file
		const buffer = await readBase64PDF(base64Content);
		await writeFile(filepath, buffer);

		// Return the path relative to the user directory
		return newFilename;
	} catch (error: any) {
		console.error('Error saving base64 PDF:', error);
		throw new Error(`Failed to save base64 file: ${error.message}`);
	}
}

export async function clearUploadDir() {
	// This would be implemented to clean up old files
	// For example, using a cron job or scheduled task
}
