// ============================================================
// NPROC PERMANENT FIX - TechInPedia server.js
// Prevents CloudLinux 200/200 NPROC limit from being hit
// ============================================================

const fs = require('fs');
const path = require('path');

// 1. Explicitly load .env file into process.env FIRST
const envPath = path.join(__dirname, '.env');
if (fs.existsSync(envPath)) {
  const envConfig = fs.readFileSync(envPath, 'utf8');
  envConfig.split('\n').forEach((line) => {
    const trimmed = line.trim();
    if (trimmed && !trimmed.startsWith('#')) {
      const eqIdx = trimmed.indexOf('=');
      if (eqIdx > 0) {
        const key = trimmed.substring(0, eqIdx).trim();
        const val = trimmed.substring(eqIdx + 1).trim().replace(/^["']|["']$/g, '');
        process.env[key] = val;
      }
    }
  });
}

// 2. Limit threads BEFORE loading anything
process.env.UV_THREADPOOL_SIZE = '1';
process.env.NODE_ENV = process.env.NODE_ENV || 'production';
process.env.NEXT_TELEMETRY_DISABLED = '1';

// 3. Ensure DATABASE_URL is set cleanly with connection_limit=1 and 127.0.0.1
if (process.env.DATABASE_URL) {
  process.env.DATABASE_URL = process.env.DATABASE_URL.replace('@localhost:', '@127.0.0.1:');
  try {
    const parsedDbUrl = new URL(process.env.DATABASE_URL);
    parsedDbUrl.searchParams.set('connection_limit', '1');
    parsedDbUrl.searchParams.set('pool_timeout', '5');
    process.env.DATABASE_URL = parsedDbUrl.toString();
  } catch {
    // Fallback if URL parsing fails
  }
}

const { createServer } = require('http');
const { parse } = require('url');
const next = require('next');

const dev = false; // Always production
const hostname = '0.0.0.0';
const port = parseInt(process.env.PORT, 10) || 3000;

const app = next({ dev, hostname, port });
const handle = app.getRequestHandler();

let isShuttingDown = false;
let httpServer = null;

process.on('uncaughtException', (err) => {
  console.error('> UNCAUGHT EXCEPTION (suppressed):', err.message);
});

process.on('unhandledRejection', (reason) => {
  console.error('> UNHANDLED REJECTION (suppressed):', reason);
});

const SIX_HOURS = 6 * 60 * 60 * 1000;
const autoRestart = setTimeout(() => {
  console.log('> Auto-restart triggered (6h lifetime limit). Exiting cleanly.');
  process.exit(0);
}, SIX_HOURS);
autoRestart.unref();

app.prepare().then(() => {
  httpServer = createServer(async (req, res) => {
    if (isShuttingDown) {
      res.statusCode = 503;
      res.setHeader('Connection', 'close');
      res.end('Server restarting. Please retry.');
      return;
    }
    try {
      const parsedUrl = parse(req.url, true);
      if (parsedUrl.pathname === '/api/restart-techlynk-node-process-secret-99') {
        res.statusCode = 200;
        res.setHeader('Content-Type', 'text/plain');
        res.end('Restarting Node process...');
        setTimeout(() => process.exit(0), 200);
        return;
      }
      await handle(req, res, parsedUrl);
    } catch (err) {
      console.error('> Request error:', req.url, err.message);
      if (!res.headersSent) {
        res.statusCode = 500;
        res.end('Internal Server Error');
      }
    }
  });

  httpServer.keepAliveTimeout = 5000;
  httpServer.headersTimeout = 6000;

  httpServer.listen(port, (err) => {
    if (err) throw err;
    console.log(`> TechInPedia ready on http://${hostname}:${port} [PID: ${process.pid}]`);
  });

}).catch((err) => {
  console.error('> App preparation failed!', err);
  process.exit(1);
});
