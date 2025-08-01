// src/lib/db.ts

import { Pool } from 'pg';

// Extend the global type to avoid TypeScript errors on the next line
declare global {
  var pgPool: Pool | undefined;
}

// Use 'global' to reuse the connection pool across hot reloads in development.
// This prevents creating a new pool on every file change.
const db = global.pgPool || new Pool({
    connectionString: process.env.DATABASE_URL,
  });

if (process.env.NODE_ENV !== 'production') {
  global.pgPool = db;
}

export { db };