import { mkdir, writeFile } from 'fs/promises';
import path from 'path';
import { randomUUID } from 'crypto';
import sharp from 'sharp';
import { fileTypeFromBuffer } from 'file-type';

export const UPLOAD_DIR = process.env.UPLOAD_DIR || path.join(process.cwd(), 'uploads');
export const PRIVATE_MEDIA_DIR =
  process.env.PRIVATE_MEDIA_DIR || path.join(process.cwd(), 'media', 'private');
export const MAX_UPLOAD_SIZE_BYTES = Number(process.env.MAX_UPLOAD_SIZE_MB || 100) * 1024 * 1024;

const ALLOWED_IMAGE_MIME = new Set(['image/jpeg', 'image/png', 'image/webp', 'image/heic']);
const ALLOWED_VIDEO_MIME = new Set(['video/mp4', 'video/quicktime', 'video/webm']);

export interface StoredMedia {
  url: string; // public URL path, e.g. /uploads/moments/2026-12-23/xxxx.jpg
  mediaType: 'image' | 'video';
}

/**
 * Validates the uploaded file by its real magic-byte signature (not the
 * client-supplied extension/content-type), strips EXIF/GPS metadata from
 * images by re-encoding through sharp (sharp drops metadata by default
 * unless `.withMetadata()` is called), and writes it under a
 * type/date-partitioned path so the upload volume stays browsable.
 */
export async function storeGuestUpload(buffer: Buffer, originalName: string): Promise<StoredMedia> {
  if (buffer.byteLength > MAX_UPLOAD_SIZE_BYTES) {
    throw new Error(`File exceeds the ${MAX_UPLOAD_SIZE_BYTES / 1024 / 1024}MB limit`);
  }

  const detected = await fileTypeFromBuffer(buffer);
  if (!detected) throw new Error('Could not verify file type');

  const isImage = ALLOWED_IMAGE_MIME.has(detected.mime);
  const isVideo = ALLOWED_VIDEO_MIME.has(detected.mime);
  if (!isImage && !isVideo) {
    throw new Error(`Unsupported file type: ${detected.mime}`);
  }

  const datePart = new Date().toISOString().slice(0, 10);
  const dir = path.join(UPLOAD_DIR, 'moments', datePart);
  await mkdir(dir, { recursive: true });

  const filename = `${randomUUID()}.${detected.ext}`;
  const destPath = path.join(dir, filename);

  if (isImage) {
    // Re-encoding through sharp strips EXIF (including GPS) by default.
    const processed = await sharp(buffer).rotate().resize({ width: 2400, withoutEnlargement: true }).toBuffer();
    await writeFile(destPath, processed);
  } else {
    // Video thumbnailing/transcoding via ffmpeg is out of scope for this
    // pass (no ffmpeg binary assumed on the base image) — stored as-is.
    await writeFile(destPath, buffer);
  }

  return {
    url: `/uploads/moments/${datePart}/${filename}`,
    mediaType: isImage ? 'image' : 'video',
  };
}
