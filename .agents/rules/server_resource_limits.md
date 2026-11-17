# CloudLinux LVE & NPROC Server Performance Rules

## Mandatory Rules for Node.js / Next.js & PHP Applications

Whenever creating, configuring, or updating `.htaccess`, server startup files (`server.js`), or environment files on cPanel / CloudLinux LVE hosting:

1. **Phusion Passenger Instance Caps**:
   - Always set `PassengerMaxInstancesPerApp 1`
   - Always set `PassengerMinInstances 0`
   - Always set `PassengerPoolIdleTime 5`
   - Always set `PassengerMaxPreloaderIdleTime 0`

2. **V8 Engine Memory Cap**:
   - Always include `SetEnv NODE_OPTIONS "--max-old-space-size=256"` in `.htaccess` and set `process.env.NODE_OPTIONS = "--max-old-space-size=256"` in `server.js`.

3. **Database Connection Pooling**:
   - Ensure Prisma / MySQL connections use `127.0.0.1:3306` instead of `localhost:3306` to avoid IPv6 fallback retries.
   - Limit Prisma connection pool to `connection_limit=3&pool_timeout=10`.

4. **Bulk File & Script Execution Safety**:
   - Never run un-throttled recursive file scans or parallel FTP connections that spawn > 5 concurrent worker threads.
