import { NextRequest } from 'next/server';
import { createReadStream, statSync, existsSync } from 'fs';
import path from 'path';
import { PRIVATE_MEDIA_DIR } from '@/lib/media';

// Streams the hero/placeholder/highlight videos from a directory outside
// `public/`, with HTTP range support (needed for video scrubbing) and an
// explicit Content-Disposition only for the one video the brief calls out
// as intentionally downloadable (the "hb_video" highlight reel). The two
// background videos are served the same way but the UI never renders a
// download affordance for them and the video tag disables the context
// menu — a deterrent for casual users, not real DRM (see README).
const FILES: Record<string, string> = {
  'hero-main': 'hero-main.mp4',
  'hero-placeholder': 'hero-placeholder.mp4',
  highlight: 'highlight.mp4',
};

export async function GET(req: NextRequest, { params }: { params: { key: string } }) {
  const filename = FILES[params.key];
  if (!filename) return new Response('Not found', { status: 404 });

  const filePath = path.join(PRIVATE_MEDIA_DIR, filename);
  if (!existsSync(filePath)) return new Response('Not found', { status: 404 });

  const stat = statSync(filePath);
  const range = req.headers.get('range');
  const headers = new Headers({
    'Content-Type': 'video/mp4',
    'Accept-Ranges': 'bytes',
    'Cache-Control': 'private, max-age=3600',
  });

  const wantsDownload = req.nextUrl.searchParams.get('download') === '1';
  if (params.key === 'highlight' && wantsDownload) {
    headers.set('Content-Disposition', 'attachment; filename="beni-and-dorah-highlights.mp4"');
  }

  if (!range) {
    headers.set('Content-Length', String(stat.size));
    const stream = createReadStream(filePath);
    return new Response(stream as any, { headers });
  }

  const [startStr, endStr] = range.replace(/bytes=/, '').split('-');
  const start = parseInt(startStr, 10);
  const end = endStr ? parseInt(endStr, 10) : stat.size - 1;
  const chunkSize = end - start + 1;

  headers.set('Content-Range', `bytes ${start}-${end}/${stat.size}`);
  headers.set('Content-Length', String(chunkSize));

  const stream = createReadStream(filePath, { start, end });
  return new Response(stream as any, { status: 206, headers });
}
