import path from 'path';

// Allowed MIME types and size limits
export const IMAGE_MIME_TYPES = ['image/png', 'image/jpeg', 'image/webp'];
export const VIDEO_MIME_TYPES = ['video/mp4', 'video/webm'];

export type FileConstraints = {
  maxBytes: number; // e.g., 5 * 1024 * 1024
  allowedTypes: string[];
};

export function sanitizeFileName(original: string): string {
  const base = path.basename(original); // strip any path segments
  const ext = path.extname(base).toLowerCase();
  const name = base.replace(ext, '');
  // keep alphanumerics, dashes and underscores only
  const safeName = name.replace(/[^a-zA-Z0-9_-]/g, '_');
  return `${safeName}${ext}`;
}

export function uniqueFileName(original: string): string {
  const safe = sanitizeFileName(original);
  return `${Date.now()}-${safe}`;
}

export function assertFile(file: File | null | undefined, constraints: FileConstraints, label = 'file'): asserts file is File {
  if (!file) throw new Error(`${label} is required.`);
  const size = file.size ?? 0;
  const maybeType: unknown = (file as unknown as { type?: string }).type;
  const type = typeof maybeType === 'string' ? maybeType : undefined; // Next.js File exposes type
  if (!type || !constraints.allowedTypes.includes(type)) {
    throw new Error(`${label} type not allowed.`);
  }
  if (size <= 0 || size > constraints.maxBytes) {
    throw new Error(`${label} is too large.`);
  }
}

export const IMAGE_5MB: FileConstraints = { maxBytes: 5 * 1024 * 1024, allowedTypes: IMAGE_MIME_TYPES };
export const IMAGE_10MB: FileConstraints = { maxBytes: 10 * 1024 * 1024, allowedTypes: IMAGE_MIME_TYPES };
export const VIDEO_500MB: FileConstraints = { maxBytes: 500 * 1024 * 1024, allowedTypes: VIDEO_MIME_TYPES };
