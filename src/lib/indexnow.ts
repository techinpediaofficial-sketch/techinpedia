export async function notifyIndexNow(urls: string | string[]) {
  try {
    const INDEXNOW_KEY = process.env.INDEXNOW_KEY || 'a8f5b82142e043fcb5cf07c4b6fc52fa';
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://techinpedia.com';
    const canonicalHost = new URL(siteUrl).hostname;

    let urlList = Array.isArray(urls) ? urls : [urls];
    
    // Validate and Deduplicate
    const validUrls = new Set<string>();
    for (const u of urlList) {
      try {
        const parsed = new URL(u, siteUrl);
        // Only canonical host, no admin, no api, no localhost
        if (
          parsed.hostname === canonicalHost &&
          parsed.protocol.startsWith('http') &&
          !parsed.pathname.startsWith('/admin') &&
          !parsed.pathname.startsWith('/api') &&
          !['localhost', '127.0.0.1'].includes(parsed.hostname)
        ) {
          validUrls.add(parsed.toString());
        }
      } catch (e) {
        // Invalid URL format, ignore
      }
    }

    if (validUrls.size === 0) return;

    // Respect limits: 10,000 max
    const finalUrls = Array.from(validUrls).slice(0, 10000);

    const payload = {
      host: canonicalHost,
      key: INDEXNOW_KEY,
      keyLocation: `https://${canonicalHost}/${INDEXNOW_KEY}.txt`,
      urlList: finalUrls
    };

    const response = await fetch('https://api.indexnow.org/indexnow', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json; charset=utf-8'
      },
      body: JSON.stringify(payload)
    });

    if (response.status === 200 || response.status === 202) {
      console.log(`[IndexNow] Successfully notified ${finalUrls.length} URLs`);
    } else {
      console.error(`[IndexNow] Failed with status: ${response.status}`);
    }
  } catch (err) {
    console.error('[IndexNow] Notification error caught securely');
  }
}
