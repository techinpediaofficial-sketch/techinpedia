module.exports = {
  apps: [
    {
      name: 'techinpedia',
      script: './server.js',
      exec_mode: 'fork',
      instances: 1,
      autorestart: true,
      max_memory_restart: '500M',
      env: {
        NODE_ENV: 'production',
        PORT: 3000,
      },
    },
    {
      name: 'techinpedia-worker',
      script: './worker.js',
      exec_mode: 'fork',
      instances: 1,
      autorestart: true,
      max_memory_restart: '300M',
      kill_timeout: 10000, // 10 seconds for graceful shutdown
      env: {
        NODE_ENV: 'production',
        RUN_WORKER: 'true',
      },
    },
  ],
};
