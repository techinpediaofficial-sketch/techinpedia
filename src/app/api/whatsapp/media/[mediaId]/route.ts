import { NextResponse } from 'next/server';
import { getActiveWhatsAppConfig } from '@/lib/whatsapp_service';
import fs from 'fs';
import path from 'path';

/**
 * Meta WhatsApp Cloud API Media Proxy
 * Securely streams media attachments (stickers, voice notes, images, videos, documents)
 * from Meta Cloud API lookaside servers using authenticated system tokens.
 */
export async function GET(
  request: Request,
  { params }: { params: Promise<{ mediaId: string }> }
) {
  try {
    const { mediaId } = await params;
    if (!mediaId) {
      return new NextResponse('Media ID required', { status: 400 });
    }

    // 1. Check local file system disk cache
    const cacheDir = path.join(process.cwd(), '.media_cache');
    const metaCacheFile = path.join(cacheDir, `${mediaId}.meta.json`);
    const dataCacheFile = path.join(cacheDir, `${mediaId}.bin`);

    if (fs.existsSync(metaCacheFile) && fs.existsSync(dataCacheFile)) {
      try {
        const meta = JSON.parse(fs.readFileSync(metaCacheFile, 'utf8'));
        const buffer = fs.readFileSync(dataCacheFile);
        return new NextResponse(buffer, {
          status: 200,
          headers: {
            'Content-Type': meta.mime_type || 'image/webp',
            'Cache-Control': 'public, max-age=604800, immutable',
          },
        });
      } catch (cacheErr) {
        // Fallback to live Meta API fetch
      }
    }

    // 2. Resolve active WhatsApp credentials
    const { config } = await getActiveWhatsAppConfig();
    if (!config?.accessToken) {
      return new NextResponse('WhatsApp credentials not configured', { status: 500 });
    }

    // 3. Query Meta Graph API for media download URL
    const metaRes = await fetch(`https://graph.facebook.com/v21.0/${mediaId}`, {
      headers: {
        Authorization: `Bearer ${config.accessToken}`,
      },
    });

    if (!metaRes.ok) {
      const errText = await metaRes.text().catch(() => '');
      console.error(`Meta media lookup failed for ${mediaId}:`, metaRes.status, errText);
      return new NextResponse('Media not found on Meta', { status: metaRes.status });
    }

    const metaData = await metaRes.json();
    if (!metaData.url) {
      return new NextResponse('Media URL not provided by Meta', { status: 404 });
    }

    // 4. Download media binary from Meta lookaside attachment server
    const mediaRes = await fetch(metaData.url, {
      headers: {
        Authorization: `Bearer ${config.accessToken}`,
        'User-Agent': 'curl/7.81.0',
      },
    });

    if (!mediaRes.ok) {
      return new NextResponse('Failed to download media binary from Meta', { status: mediaRes.status });
    }

    const arrayBuffer = await mediaRes.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const mimeType = metaData.mime_type || mediaRes.headers.get('content-type') || 'application/octet-stream';

    // 5. Save to disk cache for future instant responses
    try {
      if (!fs.existsSync(cacheDir)) {
        fs.mkdirSync(cacheDir, { recursive: true });
      }
      fs.writeFileSync(metaCacheFile, JSON.stringify({ mime_type: mimeType }));
      fs.writeFileSync(dataCacheFile, buffer);
    } catch (saveErr) {
      console.warn('Failed to cache WhatsApp media to disk:', saveErr);
    }

    return new NextResponse(buffer, {
      status: 200,
      headers: {
        'Content-Type': mimeType,
        'Cache-Control': 'public, max-age=604800, immutable',
      },
    });
  } catch (error: any) {
    console.error('Error proxying WhatsApp media:', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}
