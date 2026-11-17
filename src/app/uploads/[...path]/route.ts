import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs/promises';
import path from 'path';

export const dynamic = 'force-dynamic';

const MIME_TYPES: Record<string, string> = {
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.webp': 'image/webp',
  '.gif': 'image/gif',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.pdf': 'application/pdf',
  '.avif': 'image/avif',
};

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  try {
    const { path: pathSegments } = await params;
    if (!pathSegments || pathSegments.length === 0) {
      return new NextResponse('File not found', { status: 404 });
    }

    // Sanitize path to prevent directory traversal
    const safePath = pathSegments.join('/');
    if (safePath.includes('..') || path.isAbsolute(safePath)) {
      return new NextResponse('Forbidden', { status: 403 });
    }

    // Potential directory candidates to locate the uploaded file
    const candidateDirs = [
      path.join(process.cwd(), 'public', 'uploads'),
      '/home/hellomam/public_html/admin.techinpedia.com/public/uploads',
      '/home/hellomam/public_html/techinpedia.com/public/uploads',
      path.join(process.cwd(), 'uploads'),
    ];

    let matchedFile: string | null = null;

    for (const dir of candidateDirs) {
      const fullPath = path.join(dir, safePath);
      try {
        const stat = await fs.stat(fullPath);
        if (stat.isFile()) {
          matchedFile = fullPath;
          break;
        }
      } catch {
        // Continue checking next candidate
      }
    }

    if (!matchedFile) {
      return new NextResponse('File not found', { status: 404 });
    }

    const ext = path.extname(matchedFile).toLowerCase();
    const contentType = MIME_TYPES[ext] || 'application/octet-stream';
    const fileBuffer = await fs.readFile(matchedFile);

    return new NextResponse(fileBuffer, {
      status: 200,
      headers: {
        'Content-Type': contentType,
        'Content-Length': fileBuffer.length.toString(),
        'Cache-Control': 'public, max-age=31536000, immutable',
      },
    });
  } catch (error) {
    console.error('Error serving upload file:', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}
