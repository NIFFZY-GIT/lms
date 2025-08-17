import path from 'path';
import { writeFile, mkdir, unlink as fsUnlink } from 'fs/promises';

function safeName(name: string) {
  return name
    .replace(/\s+/g, '_')
    .replace(/,+/g, '')
    .replace(/[^\w\-.@()]/g, '')
    .slice(0, 240);
}

const uploadsRoot = path.join(process.cwd(), 'uploads');

type UploadResult = { fileName: string; publicPath: string; fullPath: string };

/**
 * Accepts several upload shapes (File/Blob with arrayBuffer(), Buffer, ArrayBuffer, Uint8Array)
 * and writes the bytes to disk under <project-root>/uploads/<folder>.
 */
export async function saveUploadFile(uploadedFile: unknown, folder: string): Promise<UploadResult> {
  type UploadLike = { name?: string; arrayBuffer?: () => Promise<ArrayBuffer> };
  const maybeUpload = uploadedFile as UploadLike | undefined;
  const original = maybeUpload && typeof maybeUpload.name === 'string' ? maybeUpload.name : 'file';
  const fileName = `${Date.now()}-${safeName(original)}`;
  const uploadDir = path.join(uploadsRoot, folder);
  await mkdir(uploadDir, { recursive: true });
  const fullPath = path.join(uploadDir, fileName);

  let buffer: Buffer;

  // Blob/File-like (has arrayBuffer)
  if (maybeUpload && typeof maybeUpload.arrayBuffer === 'function') {
    const ab = await maybeUpload.arrayBuffer();
    buffer = Buffer.from(ab);
  } else if (Buffer.isBuffer(uploadedFile as unknown)) {
    buffer = uploadedFile as Buffer;
  } else if (uploadedFile instanceof ArrayBuffer) {
    buffer = Buffer.from(uploadedFile as ArrayBuffer);
  } else if (uploadedFile instanceof Uint8Array) {
    buffer = Buffer.from(uploadedFile as Uint8Array);
  } else {
    throw new Error('Unsupported uploadedFile type');
  }

  await writeFile(fullPath, buffer);
  return { fileName, publicPath: `/api/uploads/${folder}/${encodeURIComponent(fileName)}`, fullPath };
}

export function resolveUploadDiskPath(storedUrl: string | null | undefined) {
  if (!storedUrl) return null;
  // strip known prefixes
  const cleaned = storedUrl.replace(/^\/api\/uploads\//, '').replace(/^\/uploads\//, '');
  // normalize to prevent path traversal (e.g. ../)
  const normalized = path.normalize(cleaned);
  if (normalized.includes('..')) return null;
  return path.join(uploadsRoot, normalized);
}

export async function removeUploadByUrl(storedUrl: string | null | undefined) {
  const disk = resolveUploadDiskPath(storedUrl);
  if (!disk) return;
  try {
    await fsUnlink(disk);
  } catch (e) {
    console.error('removeUploadByUrl:', e);
  }
}
