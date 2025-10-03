# PM2 Setup Guide – WriteCareNotes

## Overview

PM2 (Process Manager 2) is a production-ready process manager for Node.js applications. This guide covers PM2 setup for WriteCareNotes.

## Installation

### Global Installation
```bash
npm install -g pm2
```

### Verify Installation
```bash
pm2 --version
```

## Basic PM2 Commands

### Start Application
```bash
pm2 start dist/index.js --name writecarenotes-api
```

### Stop Application
```bash
pm2 stop writecarenotes-api
```

### Restart Application
```bash
pm2 restart writecarenotes-api
```

### Delete Application
```bash
pm2 delete writecarenotes-api
```

### View Status
```bash
pm2 status
```

### View Logs
```bash
pm2 logs writecarenotes-api
```

## PM2 Configuration

### Ecosystem File
Create `ecosystem.config.js`:

```javascript
module.exports = {
  apps: [{
    name: 'writecarenotes-api',
    script: 'dist/index.js',
    instances: 'max',
    exec_mode: 'cluster',
    env: {
      NODE_ENV: 'production',
      PORT: 3000
    },
    env_production: {
      NODE_ENV: 'production',
      PORT: 3000
    },
    error_file: './logs/err.log',
    out_file: './logs/out.log',
    log_file: './logs/combined.log',
    time: true,
    log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
    merge_logs: true,
    max_memory_restart: '1G',
    node_args: '--max-old-space-size=1024',
    watch: false,
    ignore_watch: ['node_modules', 'logs'],
    max_restarts: 10,
    min_uptime: '10s',
    restart_delay: 4000,
    exp_backoff_restart_delay: 100,
    kill_timeout: 5000,
    listen_timeout: 3000,
    wait_ready: true,
    kill_retry_time: 100
  }]
};
```

### Start with Ecosystem
```bash
pm2 start ecosystem.config.js
```

## PM2 Monitoring

### Real-time Monitoring
```bash
pm2 monit
```

### Web Dashboard
```bash
pm2 web
```

### Status Monitoring
```bash
pm2 status
pm2 show writecarenotes-api
```

## PM2 Logs

### View All Logs
```bash
pm2 logs
```

### View Specific App Logs
```bash
pm2 logs writecarenotes-api
```

### Log Rotation
```bash
pm2 install pm2-logrotate
pm2 set pm2-logrotate:max_size 10M
pm2 set pm2-logrotate:retain 30
pm2 set pm2-logrotate:compress true
```

## PM2 Startup

### Save Current Processes
```bash
pm2 save
```

### Generate Startup Script
```bash
pm2 startup
```

### Enable Startup
```bash
pm2 save
```

## PM2 Advanced Features

### Cluster Mode
```bash
pm2 start dist/index.js -i max
```

### Load Balancing
```bash
pm2 start dist/index.js -i 4 --name "writecarenotes-api"
```

### Graceful Shutdown
```bash
pm2 gracefulReload writecarenotes-api
```

### Zero-downtime Reload
```bash
pm2 reload writecarenotes-api
```

## PM2 Environment Management

### Development Environment
```bash
pm2 start ecosystem.config.js --env development
```

### Production Environment
```bash
pm2 start ecosystem.config.js --env production
```

### Environment Variables
```bash
pm2 start dist/index.js --name writecarenotes-api --env production
```

## PM2 Health Checks

### Health Check Script
```bash
pm2 start health-check.js --name health-check
```

### Health Check Configuration
```javascript
{
  "name": "health-check",
  "script": "health-check.js",
  "cron_restart": "*/5 * * * *",
  "autorestart": false
}
```

## PM2 Backup and Restore

### Backup PM2 Configuration
```bash
pm2 save
cp ~/.pm2/dump.pm2 ~/backup/dump.pm2
```

### Restore PM2 Configuration
```bash
pm2 resurrect ~/backup/dump.pm2
```

## PM2 Troubleshooting

### Common Issues
1. **Process Not Starting**: Check logs and configuration
2. **Memory Issues**: Adjust max_memory_restart
3. **Port Conflicts**: Check port availability
4. **Permission Issues**: Check file permissions

### Debug Mode
```bash
pm2 start dist/index.js --name writecarenotes-api --node-args="--inspect"
```

### Verbose Logging
```bash
pm2 start dist/index.js --name writecarenotes-api --log-type json
```

## PM2 Best Practices

### 1. Use Ecosystem Files
Always use ecosystem.config.js for production deployments.

### 2. Enable Log Rotation
Configure log rotation to prevent disk space issues.

### 3. Set Memory Limits
Configure max_memory_restart to prevent memory leaks.

### 4. Use Cluster Mode
Use cluster mode for better performance and reliability.

### 5. Monitor Performance
Use pm2 monit to monitor application performance.

### 6. Backup Configuration
Regularly backup PM2 configuration and processes.

### 7. Health Checks
Implement health checks for better monitoring.

### 8. Graceful Shutdown
Use gracefulReload for zero-downtime deployments.

## PM2 Integration

### Nginx Integration
```nginx
upstream writecarenotes {
    server 127.0.0.1:3000;
    server 127.0.0.1:3001;
    server 127.0.0.1:3002;
    server 127.0.0.1:3003;
}
```

### Systemd Integration
```bash
pm2 startup systemd
```

### Docker Integration
```dockerfile
RUN npm install -g pm2
CMD ["pm2-runtime", "ecosystem.config.js"]
```

---

*This PM2 setup guide is part of the WriteCareNotes comprehensive documentation suite.*