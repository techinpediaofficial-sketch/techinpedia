#!/usr/bin/env python3
import ftplib
import io
import time
import urllib.request
import ssl

FTP_HOST = '103.102.234.161'
FTP_USER = 'xxfeszkb'
FTP_PASS = 'Newpass@12346'

server_js_content = """// ============================================================
// NPROC & THREAD PERMANENT FIX - KCN Sons server.js
// Prevents CloudLinux 200/200 NPROC limit from being hit
// ============================================================

process.env.UV_THREADPOOL_SIZE = '1';
process.env.NODE_OPTIONS = '--max-old-space-size=256 --v8-pool-size=1';
process.env.NODE_ENV = 'production';
process.env.NEXT_TELEMETRY_DISABLED = '1';

const { createServer } = require('http');
const { parse } = require('url');
const fs = require('fs');
const path = require('path');

// 1. Auto-extract deploy-update.zip if present
const zipFile = path.join(__dirname, 'deploy-update.zip');
if (fs.existsSync(zipFile)) {
  try {
    const { execSync } = require('child_process');
    console.log('📦 Found deploy-update.zip, extracting...');
    try {
      execSync(`python3 -c "import zipfile; zf = zipfile.ZipFile('${zipFile}'); zf.extractall('${__dirname}')"`);
      console.log('✅ Extracted via python3 successfully!');
    } catch {
      execSync(`unzip -o -q "${zipFile}" -d "${__dirname}"`);
      console.log('✅ Extracted via unzip successfully!');
    }
    const doneFile = zipFile + '.done';
    if (fs.existsSync(doneFile)) {
      try { fs.unlinkSync(doneFile); } catch {}
    }
    fs.renameSync(zipFile, doneFile);
    console.log('🎉 Extraction complete, marked as .done');
  } catch (err) {
    console.error('ZIP extract error:', err.message);
  }
}

// 2. Ensure Database URL
process.env.DATABASE_URL =
  process.env.DATABASE_URL ||
  'mysql://xxfeszkb_kcnsons_prod:Newpass%4012346@localhost:3306/xxfeszkb_kcnsons_prod';

// Limit database connection pool to 1
if (process.env.DATABASE_URL) {
  process.env.DATABASE_URL = process.env.DATABASE_URL.replace('@localhost:', '@127.0.0.1:');
  try {
    const parsedDbUrl = new URL(process.env.DATABASE_URL);
    parsedDbUrl.searchParams.set('connection_limit', '1');
    parsedDbUrl.searchParams.set('pool_timeout', '5');
    process.env.DATABASE_URL = parsedDbUrl.toString();
  } catch {}
}

// 3. Start Next.js App
const next = require('next');
const dev = false; // Always production
const hostname = process.env.HOSTNAME || '0.0.0.0';
const port = parseInt(process.env.PORT || '3000', 10);

const app = next({ dev, hostname, port });
const handle = app.getRequestHandler();

process.on('uncaughtException', (err) => {
  console.error('> UNCAUGHT EXCEPTION (suppressed):', err.message);
});

process.on('unhandledRejection', (reason) => {
  console.error('> UNHANDLED REJECTION (suppressed):', reason);
});

// Auto-restart after 6 hours to prevent any memory leak buildup
const SIX_HOURS = 6 * 60 * 60 * 1000;
const autoRestart = setTimeout(() => {
  console.log('> Auto-restart triggered (6h lifetime limit). Exiting cleanly.');
  process.exit(0);
}, SIX_HOURS);
autoRestart.unref();

app
  .prepare()
  .then(() => {
    const server = createServer(async (req, res) => {
      try {
        const parsedUrl = parse(req.url, true);
        if (parsedUrl.pathname === '/api/restart-kcnsons-node-process-secret-99') {
          res.statusCode = 200;
          res.setHeader('Content-Type', 'text/plain');
          res.end('Restarting Node process...');
          setTimeout(() => process.exit(0), 200);
          return;
        }
        await handle(req, res, parsedUrl);
      } catch (err) {
        console.error('Error occurred handling request:', err.message);
        if (!res.headersSent) {
          res.statusCode = 500;
          res.end('Internal Server Error');
        }
      }
    });

    server.keepAliveTimeout = 5000;
    server.headersTimeout = 6000;

    server.once('error', (err) => {
      console.error('Server initialization error:', err);
      process.exit(1);
    });

    server.listen(port, () => {
      console.log(`> KCN Sons Production Server running on http://${hostname}:${port} [PID: ${process.pid}]`);
    });
  })
  .catch((err) => {
    console.error('Failed to prepare Next.js app:', err);
    process.exit(1);
  });
"""

htaccess_content = """<IfModule mod_rewrite.c>
RewriteEngine On
RewriteRule ^(_next/static/|images/|logo\\.png|favicon\\.ico|icon\\.png|apple-icon\\.png|google[a-f0-9]+\\.html|sitemap\\.xml|robots\\.txt)$ - [L]
</IfModule>

# DO NOT REMOVE. CLOUDLINUX PASSENGER CONFIGURATION BEGIN
PassengerAppRoot "/home/xxfeszkb/kcnsons"
PassengerBaseURI "/"
PassengerNodejs "/home/xxfeszkb/nodevenv/kcnsons/20/bin/node"
PassengerAppType node
PassengerStartupFile server.js
# DO NOT REMOVE. CLOUDLINUX PASSENGER CONFIGURATION END

# ULTRA AGGRESSIVE PROCESS & THREAD LIMITS (NPROC RESTRICTOR)
PassengerAppEnv production
PassengerMaxInstancesPerApp 1
PassengerMaxPoolSize 1
PassengerPoolIdleTime 10
PassengerMinInstances 0
PassengerMaxPreloaderIdleTime 0

<IfModule Litespeed>
SetEnv NODE_ENV production
SetEnv NEXT_TELEMETRY_DISABLED 1
SetEnv UV_THREADPOOL_SIZE 1
SetEnv NODE_OPTIONS "--max-old-space-size=256 --v8-pool-size=1"
</IfModule>
<IfModule env_module>
SetEnv NODE_ENV production
SetEnv NEXT_TELEMETRY_DISABLED 1
SetEnv UV_THREADPOOL_SIZE 1
SetEnv NODE_OPTIONS "--max-old-space-size=256 --v8-pool-size=1"
</IfModule>
SetEnv NODE_OPTIONS "--max-old-space-size=256 --v8-pool-size=1"
SetEnv UV_THREADPOOL_SIZE 1
"""

def main():
    print("Connecting to FTP...")
    ftp = ftplib.FTP(FTP_HOST)
    ftp.login(FTP_USER, FTP_PASS)
    ftp.set_pasv(True)

    print("Uploading /kcnsons/server.js...")
    ftp.storbinary("STOR /kcnsons/server.js", io.BytesIO(server_js_content.encode("utf-8")))

    print("Uploading /kcnsons/.htaccess...")
    ftp.storbinary("STOR /kcnsons/.htaccess", io.BytesIO(htaccess_content.encode("utf-8")))

    print("Uploading /kcnsons.in/.htaccess...")
    ftp.storbinary("STOR /kcnsons.in/.htaccess", io.BytesIO(htaccess_content.encode("utf-8")))

    print("Touching /kcnsons/tmp/restart.txt to restart passenger...")
    try:
        ftp.mkd("/kcnsons/tmp")
    except Exception:
        pass
    ftp.storbinary("STOR /kcnsons/tmp/restart.txt", io.BytesIO(f"restart {time.time()}".encode("utf-8")))

    ftp.quit()
    print("✅ All kcnsons files uploaded successfully!")

if __name__ == "__main__":
    main()
