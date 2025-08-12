// src/lib/auth.ts

import { cookies } from 'next/headers';
import * as jwt from 'jsonwebtoken';
import { db } from './db';
import { AppUser, Role } from '@/types';

// This function must be async
export async function getServerUser(requiredRoles?: Role | Role[]): Promise<AppUser> {
  // The cookies() function returns a read-only store of the cookies.
  const tokenStore = await cookies();
  const tokenCookie = tokenStore.get('token');

  if (!tokenCookie) {
    throw new Error('Not Authenticated: No token found');
  }

  try {
    const decoded = jwt.verify(tokenCookie.value, process.env.JWT_SECRET!) as { id: string };

  const sqlQuery = `SELECT id, email, name, role FROM "User" WHERE id = $1`;
  const result = await db.query<AppUser>(sqlQuery, [decoded.id]);
    const user = result.rows[0];

    if (!user) {
      throw new Error('User not found');
    }

    if (requiredRoles) {
      const rolesArray = Array.isArray(requiredRoles) ? requiredRoles : [requiredRoles];
      if (!rolesArray.includes(user.role as Role)) {
        throw new Error('Forbidden: Insufficient permissions');
      }
    }

    return user;
  } catch (error) {
  if (error instanceof jwt.JsonWebTokenError) {
      throw new Error(`Authentication Error: ${error.message}`);
    }
    throw new Error('An unknown authentication error occurred');
  }
}