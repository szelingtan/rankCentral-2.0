// middleware for auth
import { NextApiRequest, NextApiResponse } from 'next';

export function authenticate(req: NextApiRequest, res: NextApiResponse, next: Function) {
  const apiKey = req.headers['x-api-key'] as string;

  if (!apiKey || apiKey !== process.env.VALID_API_KEY) {
    return res.status(401).json({ message: 'Unauthorized: Invalid or missing API key' });
  }

  next(); // Proceed to the next middleware or route handler
}

// middleware for logging
export function logger(req: NextApiRequest, res: NextApiResponse, next: Function) {
  console.log(`Request made to: ${req.method} ${req.url}`);
  console.log('Request body:', req.body);

  next(); // Continue to the next middleware or route handler
}
