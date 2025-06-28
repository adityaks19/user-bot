module.exports = {
  apps: [{
    name: "ctu-user-bot",
    script: "app.js",
    instances: 1,
    autorestart: true,
    watch: false,
    max_memory_restart: "1G",
    min_uptime: "10s",
    max_restarts: 5,
    restart_delay: 5000,
    kill_timeout: 5000,
    listen_timeout: 8000,
    env: {
      NODE_ENV: "production",
      NODE_OPTIONS: "--max-old-space-size=1024"
    },
    error_file: "./logs/error.log",
    out_file: "./logs/out.log",
    log_file: "./logs/combined.log",
    time: true,
    merge_logs: true,
    log_date_format: "YYYY-MM-DD HH:mm:ss Z"
  }]
};
