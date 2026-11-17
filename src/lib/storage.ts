import fs from 'fs/promises';
import path from 'path';
import crypto from 'crypto';
import { db } from './db';

const ALLOWED_MIME_TYPES = [
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/gif',
  'image/svg+xml',
  'application/pdf',
];

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB

export interface UploadResult {
  id: string;
  filename: string;
  url: string;
  mimeType: string;
  size: number;
}

export async function uploadMediaFile(file: File): Promise<UploadResult> {
  if (!ALLOWED_MIME_TYPES.includes(file.type)) {
    throw new Error('Invalid file type. Only image files (JPEG, PNG, WebP, GIF, SVG) are allowed.');
  }

  if (file.size > MAX_FILE_SIZE) {
    throw new Error('File size exceeds maximum allowed limit of 5MB.');
  }

  const bytes = await file.arrayBuffer();
  const buffer = Buffer.from(bytes);

  // Generate safe unique filename
  const fileExt = path.extname(file.name) || '.png';
  const cleanBase = path.basename(file.name, fileExt).replace(/[^a-zA-Z0-9_-]/g, '_');
  const uniqueHash = crypto.randomBytes(6).toString('hex');
  const safeFilename = `${cleanBase}_${uniqueHash}${fileExt}`;

  // Local uploads directory
  const uploadsDir = path.join(process.cwd(), 'public', 'uploads');
  await fs.mkdir(uploadsDir, { recursive: true });

  const filePath = path.join(uploadsDir, safeFilename);
  await fs.writeFile(filePath, buffer);

  const publicUrl = `/uploads/${safeFilename}`;

  // Save metadata to DB
  const mediaRecord = await db.media.create({
    data: {
      filename: safeFilename,
      url: publicUrl,
      mimeType: file.type,
      size: file.size,
      altText: cleanBase,
    },
  });

  return {
    id: mediaRecord.id,
    filename: mediaRecord.filename,
    url: mediaRecord.url,
    mimeType: mediaRecord.mimeType,
    size: mediaRecord.size,
  };
}

export async function deleteMediaFile(id: string): Promise<boolean> {
  const media = await db.media.findUnique({ where: { id } });
  if (!media) return false;

  try {
    const filename = path.basename(media.url);
    const filePath = path.join(process.cwd(), 'public', 'uploads', filename);
    await fs.unlink(filePath).catch(() => null);
    await db.media.delete({ where: { id } });
    return true;
  } catch {
    return false;
  }
}
