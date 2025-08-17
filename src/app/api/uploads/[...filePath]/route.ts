import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

// Simple MIME lookup fallback
const mimeMap: Record<string, string> = {
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.png': 'image/png',
  '.webp': 'image/webp',
  '.gif': 'image/gif',
  '.mp4': 'video/mp4',
  '.pdf': 'application/pdf',
};

function getMime(fullPath: string) {
  const ext = path.extname(fullPath).toLowerCase();
  return mimeMap[ext] || 'application/octet-stream';
}

type ParamsShape = { filePath?: string[] } | Record<string, unknown>;

export async function GET(request: Request, { params }: { params: ParamsShape }) {
  try {
  // `params` may be an async object in Next.js runtime; await it before using its properties
  const resolvedParams = (await params) as { filePath?: string[] } | undefined | null;
  const segments: string[] = Array.isArray(resolvedParams?.filePath) ? resolvedParams!.filePath! : [];
  if (segments.length === 0) return NextResponse.json({ error: 'No file specified' }, { status: 400 });

    // Decode segments (they may be encoded in the URL) and prevent path traversal.
    // We allow punctuation in filenames so existing files with commas/spaces still resolve.
    const safeSegments = segments.map((s: string) => {
      const decoded = decodeURIComponent(s);
      if (decoded.includes('..') || decoded.includes('/') || decoded.includes('\\')) {
        throw new Error('Invalid path segment');
      }
      return decoded;
    });
    const rel = path.join(...safeSegments);
    const uploadsRoot = path.join(process.cwd(), 'uploads');
    const fullPath = path.join(uploadsRoot, rel);

    // Resolve and ensure the path is inside uploads root to prevent traversal
    const resolvedRoot = path.resolve(uploadsRoot);
    const resolvedFull = path.resolve(fullPath);
    if (!resolvedFull.startsWith(resolvedRoot + path.sep) && resolvedFull !== resolvedRoot) {
      return NextResponse.json({ error: 'Invalid path' }, { status: 400 });
    }

    if (!fs.existsSync(fullPath)) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }

    const stat = fs.statSync(fullPath);
    if (!stat.isFile()) return NextResponse.json({ error: 'Not a file' }, { status: 400 });

    const buffer = fs.readFileSync(fullPath);
    const contentType = getMime(fullPath);

    return new Response(buffer, {
      status: 200,
      headers: {
        'Content-Type': contentType,
        'Cache-Control': 'public, max-age=31536000, immutable',
      },
    });
  } catch (err) {
    console.error('Error serving upload:', err);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
