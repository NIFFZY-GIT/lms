// src/lib/auth.ts

import { cookies } from 'next/headers';
import * as jwt from 'jsonwebtoken';
import { db } from './db';

// Define a type for our User model for better type safety
interface User {
  id: string;
  email: string;
  name: string;
  role: 'ADMIN' | 'STUDENT';
}

// This function must be async
export async function getServerUser(requiredRole?: 'ADMIN' | 'STUDENT'): Promise<User> {
  // The cookies() function returns a read-only store of the cookies.
  const tokenStore = await cookies();
  const tokenCookie = tokenStore.get('token');

  if (!tokenCookie) {
    throw new Error('Not Authenticated: No token found');
  }

  try {
    const decoded = jwt.verify(tokenCookie.value, process.env.JWT_SECRET!) as { id: string };

    const sqlQuery = `SELECT id, email, name, role FROM "User" WHERE id = $1`;
    const result = await db.query<User>(sqlQuery, [decoded.id]);
    const user = result.rows[0];

    if (!user) {
      throw new Error('User not found');
    }

    if (requiredRole && user.role !== requiredRole) {
      throw new Error('Forbidden: Insufficient permissions');
    }

    return user;
  } catch (error) {
    if (error instanceof jwt.JsonWebTokenError) {
      throw new Error(`Authentication Error: ${error.message}`);
    }
    throw new Error('An unknown authentication error occurred');
  }
}