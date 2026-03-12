import 'server-only';

import { db } from '@/lib/db';
import type { Announcement } from '@/types';

export async function getPublicAnnouncements(): Promise<Announcement[]> {
  try {
    const result = await db.query<Announcement>(
      'SELECT id, title, description, "imageUrl", "createdAt"::text AS "createdAt" FROM "Announcement" ORDER BY "createdAt" DESC'
    );
    return result.rows;
  } catch (error) {
    console.error('[getPublicAnnouncements] Failed to load announcements:', error);
    return [];
  }
}
