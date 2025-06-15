/**
 * @fileoverview Authentication configuration and utilities for Next.js application
 * using NextAuth.js with credentials provider and JWT strategy.
 */

// src/lib/auth.ts
import { NextAuthOptions } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import { compare } from 'bcrypt';
import { connectToDatabase } from '@/lib/db/mongodb';
import { ObjectId } from 'mongodb';
import { getServerSession } from 'next-auth/next';

/**
 * NextAuth configuration object defining authentication providers, pages, sessions, and callbacks.
 * Uses credentials provider with email/password authentication and JWT strategy.
 * @type {NextAuthOptions}
 */
export const authOptions: NextAuthOptions = {
	providers: [
		CredentialsProvider({
			name: "Credentials",
			credentials: {
				email: { label: "Email", type: "text" },
				password: { label: "Password", type: "password" },
			},
			async authorize(credentials) {
				const { db } = await connectToDatabase();
				const user = await db.collection("users").findOne({ email: credentials?.email });

				if (!user) {
					return null;
				} else {
					const passwordMatch = await compare(credentials!.password, user.password);
					if (!passwordMatch) {
						return null;
					}
					return {
						id: user._id.toString(),
						email: user.email,
						name: user.name,
						role: user.role, // Ensure role is included
					};
				};
			},
		}),
	],
	pages: {
		signIn: '/login',
		signOut: '/logout',
		error: '/login',
		verifyRequest: '/verify-request',
	},
	session: {
		strategy: 'jwt',
		maxAge: 60 * 60,
	},
	callbacks: {
		async jwt({ token, user }) {
			if (user) {
				token.id = user.id;
				token.email = user.email;
				token.role = user.role;
			}
			return token;
		},
		async session({ session, token }) {
			if (session.user) {
				session.user.id = token.id as string;
				session.user.email = token.email as string;
				session.user.role = token.role as string;
			}
			return session;
		},
	},
	secret: process.env.NEXTAUTH_SECRET,
	debug: process.env.NODE_ENV === 'development',
};

/**
 * Retrieves the currently authenticated user from the database.
 * Uses NextAuth session to get user ID and fetches full user data from MongoDB.
 * 
 * @async
 * @function getCurrentUser
 * @returns {Promise<Object|null>} User object without password field, or null if not authenticated
 * @throws {Error} Logs error if database query fails
 */
export async function getCurrentUser() {
	const { db } = await connectToDatabase();

	try {
		const session = await getServerSession(authOptions);
		if (!session?.user?.id) {
			return null;
		}

		const user = await db.collection('users').findOne({
			_id: new ObjectId(session.user.id)
		});

		if (!user) {
			return null;
		}

		delete user.password;

		return {
			...user,
			_id: user._id.toString()
		};
	} catch (error) {
		console.error('Error getting current user:', error);
		return null;
	}
}

/**
 * Check if a user has permission to access a resource
 * @async
 * @function checkPermission
 * @param {string} userId - The ID of the user requesting access
 * @param {string} resourceOwnerId - The ID of the resource owner
 * @param {boolean} [allowAdmin=true] - Whether admin users should have access regardless of ownership
 * @returns {Promise<boolean>} True if user has permission, false otherwise
 * @throws {Error} Logs error if database query fails during admin check
 */
export async function checkPermission(
	userId: string,
	resourceOwnerId: string,
	allowAdmin = true
): Promise<boolean> {
	if (!userId || !resourceOwnerId) {
		return false;
	}

	if (userId === resourceOwnerId) {
		return true;
	}

	if (allowAdmin) {
		try {
			const { db } = await connectToDatabase();
			const user = await db.collection('users').findOne({
				_id: new ObjectId(userId)
			});

			if (user?.role === 'admin') {
				return true;
			}
		} catch (error) {
			console.error('Error checking admin permission:', error);
		}
	}

	return false;
}
