# Production Deployment Guide
## WriteCare Notes - Phase 2 Services

**Version**: 2.0.0  
**Date**: October 9, 2025  
**Status**: Production Ready ✅

---

## 🎯 Pre-Deployment Checklist

### ✅ Code Verification
- [x] All 6 Phase 2 services committed to Git
- [x] TypeScript compilation successful (0 errors)
- [x] British Isles compliance verified (zero tolerance achieved)
- [x] All commits pushed to GitHub (241bb8c)
- [x] Production documentation complete

### ⚠️ Required Before Deployment
- [ ] Database migration executed
- [ ] Environment variables configured
- [ ] SSL certificates installed
- [ ] Backup strategy configured
- [ ] Monitoring tools configured

---

## 📋 Step-by-Step Deployment

### STEP 1: Server Preparation (30 minutes)

#### 1.1 Server Requirements
```bash
# Minimum specifications:
- CPU: 4 cores
- RAM: 8GB minimum, 16GB recommended
- Storage: 100GB SSD minimum
- OS: Ubuntu 22.04 LTS or later

# Required software:
- Node.js: v18.x or v20.x
- PostgreSQL: v14.x or v15.x
- Nginx: Latest stable
- PM2: Latest (process manager)
```

#### 1.2 Install Dependencies
```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install Node.js (v20.x)
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs

# Install PostgreSQL
sudo apt install -y postgresql postgresql-contrib

# Install Nginx
sudo apt install -y nginx

# Install PM2 globally
sudo npm install -g pm2

# Install build tools
sudo apt install -y build-essential
```

#### 1.3 Create Application User
```bash
# Create dedicated user
sudo adduser --system --group writecare

# Create application directories
sudo mkdir -p /var/writecare/{documents,reports,uploads,backups,logs}
sudo chown -R writecare:writecare /var/writecare
sudo chmod 750 /var/writecare/*
```

---

### STEP 2: Database Setup (20 minutes)

#### 2.1 Create Database
```bash
# Switch to postgres user
sudo -u postgres psql

# Create database and user
CREATE DATABASE writecarenotes_production;
CREATE USER writecare_user WITH ENCRYPTED PASSWORD 'YOUR_SECURE_PASSWORD';
GRANT ALL PRIVILEGES ON DATABASE writecarenotes_production TO writecare_user;

# Enable UUID extension
\c writecarenotes_production
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

# Exit psql
\q
```

#### 2.2 Configure PostgreSQL
```bash
# Edit postgresql.conf
sudo nano /etc/postgresql/15/main/postgresql.conf

# Recommended settings:
# max_connections = 100
# shared_buffers = 2GB
# effective_cache_size = 6GB
# maintenance_work_mem = 512MB
# checkpoint_completion_target = 0.9
# wal_buffers = 16MB
# default_statistics_target = 100
# random_page_cost = 1.1
# effective_io_concurrency = 200

# Restart PostgreSQL
sudo systemctl restart postgresql
```

#### 2.3 Backup Configuration
```bash
# Create backup script
sudo nano /usr/local/bin/writecare-backup.sh

#!/bin/bash
BACKUP_DIR="/var/writecare/backups"
DATE=$(date +%Y%m%d_%H%M%S)
pg_dump writecarenotes_production | gzip > "$BACKUP_DIR/db_backup_$DATE.sql.gz"
find $BACKUP_DIR -name "db_backup_*.sql.gz" -mtime +30 -delete

# Make executable
sudo chmod +x /usr/local/bin/writecare-backup.sh

# Add to crontab (daily at 2 AM)
sudo crontab -e
0 2 * * * /usr/local/bin/writecare-backup.sh
```

---

### STEP 3: Application Deployment (30 minutes)

#### 3.1 Clone Repository
```bash
# Switch to application user
sudo su - writecare

# Clone repository
cd /var/writecare
git clone https://github.com/PNdlovu/WCNotes-new.git app
cd app

# Checkout production branch/tag
git checkout v2.0.0  # or master
```

#### 3.2 Install Dependencies
```bash
# Install production dependencies
npm ci --production

# Install development dependencies for build
npm install --only=dev

# Build application
npm run build

# Remove dev dependencies
npm prune --production
```

#### 3.3 Configure Environment
```bash
# Copy production environment template
cp .env.production.example .env.production

# Edit with production values
nano .env.production

# CRITICAL: Set these values:
# - DATABASE_URL
# - JWT_SECRET (generate: openssl rand -base64 32)
# - SESSION_SECRET (generate: openssl rand -base64 32)
# - SMTP credentials
# - CQC provider/location IDs
# - File storage paths

# Set proper permissions
chmod 600 .env.production
```

---

### STEP 4: Database Migration (15 minutes)

#### 4.1 Run Migrations
```bash
# Verify migration file exists
ls -la database/migrations/1728468000000-Phase2Services.ts

# Run migration
NODE_ENV=production npm run typeorm migration:run

# Verify migration
NODE_ENV=production npm run typeorm migration:show

# Expected output:
# ✅ [X] Phase2Services1728468000000
```

#### 4.2 Verify Database Schema
```bash
# Connect to database
psql -U writecare_user -d writecarenotes_production

# Verify tables exist
\dt

# Expected tables:
# - documents
# - document_versions
# - family_members
# - family_messages
# - family_visits
# - incident_reports
# - vital_signs
# - weight_records
# - health_assessments
# - activities
# - activity_attendance

# Check table structures
\d documents
\d incident_reports
\d vital_signs
\d activities

# Exit
\q
```

---

### STEP 5: Application Start (10 minutes)

#### 5.1 Configure PM2
```bash
# Create PM2 ecosystem file
nano ecosystem.config.js
```

```javascript
module.exports = {
  apps: [{
    name: 'writecare-api',
    script: 'dist/server.js',
    instances: 2,
    exec_mode: 'cluster',
    env_production: {
      NODE_ENV: 'production',
      PORT: 3000
    },
    error_file: '/var/writecare/logs/error.log',
    out_file: '/var/writecare/logs/out.log',
    log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
    merge_logs: true,
    autorestart: true,
    watch: false,
    max_memory_restart: '1G',
    env_file: '.env.production'
  }]
};
```

#### 5.2 Start Application
```bash
# Start with PM2
pm2 start ecosystem.config.js --env production

# Save PM2 configuration
pm2 save

# Configure PM2 to start on boot
pm2 startup systemd -u writecare --hp /var/writecare

# Verify application is running
pm2 status
pm2 logs writecare-api --lines 50
```

---

### STEP 6: Nginx Configuration (20 minutes)

#### 6.1 Create Nginx Config
```bash
# Create site configuration
sudo nano /etc/nginx/sites-available/writecare
```

```nginx
upstream writecare_backend {
    least_conn;
    server 127.0.0.1:3000 max_fails=3 fail_timeout=30s;
    server 127.0.0.1:3001 max_fails=3 fail_timeout=30s;
    keepalive 32;
}

# Rate limiting
limit_req_zone $binary_remote_addr zone=api_limit:10m rate=100r/m;
limit_req_zone $binary_remote_addr zone=auth_limit:10m rate=10r/m;

server {
    listen 80;
    server_name api.writecarenotes.com;
    
    # Redirect HTTP to HTTPS
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name api.writecarenotes.com;

    # SSL Configuration
    ssl_certificate /etc/letsencrypt/live/api.writecarenotes.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/api.writecarenotes.com/privkey.pem;
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;
    ssl_prefer_server_ciphers on;
    ssl_session_cache shared:SSL:10m;
    ssl_session_timeout 10m;

    # Security Headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header Referrer-Policy "no-referrer-when-downgrade" always;
    add_header Content-Security-Policy "default-src 'self' http: https: data: blob: 'unsafe-inline'" always;
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;

    # Logging
    access_log /var/log/nginx/writecare_access.log combined;
    error_log /var/log/nginx/writecare_error.log warn;

    # File upload size
    client_max_body_size 50M;

    # Health check endpoint (no rate limiting)
    location /health {
        proxy_pass http://writecare_backend;
        access_log off;
    }

    # Authentication endpoints (stricter rate limiting)
    location ~* ^/api/v1/(auth|login|register) {
        limit_req zone=auth_limit burst=5 nodelay;
        proxy_pass http://writecare_backend;
        include proxy_params;
    }

    # API endpoints
    location /api/ {
        limit_req zone=api_limit burst=20 nodelay;
        proxy_pass http://writecare_backend;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        proxy_read_timeout 300;
        proxy_connect_timeout 300;
    }

    # Serve static files
    location /reports/ {
        alias /var/writecare/reports/;
        expires 1d;
        add_header Cache-Control "public, immutable";
    }

    # Block access to sensitive files
    location ~ /\.(?!well-known) {
        deny all;
    }
}
```

#### 6.2 Enable Site
```bash
# Create symlink
sudo ln -s /etc/nginx/sites-available/writecare /etc/nginx/sites-enabled/

# Test configuration
sudo nginx -t

# Restart Nginx
sudo systemctl restart nginx
sudo systemctl enable nginx
```

#### 6.3 SSL Certificate (Let's Encrypt)
```bash
# Install Certbot
sudo apt install -y certbot python3-certbot-nginx

# Obtain certificate
sudo certbot --nginx -d api.writecarenotes.com

# Auto-renewal is configured automatically
# Verify renewal works:
sudo certbot renew --dry-run
```

---

### STEP 7: Firewall Configuration (10 minutes)

```bash
# Enable UFW
sudo ufw enable

# Allow SSH
sudo ufw allow 22/tcp

# Allow HTTP/HTTPS
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp

# Allow PostgreSQL (only from localhost)
sudo ufw allow from 127.0.0.1 to any port 5432

# Check status
sudo ufw status verbose
```

---

### STEP 8: Monitoring Setup (15 minutes)

#### 8.1 PM2 Monitoring
```bash
# Install PM2 monitoring
pm2 install pm2-logrotate

# Configure log rotation
pm2 set pm2-logrotate:max_size 10M
pm2 set pm2-logrotate:retain 30
pm2 set pm2-logrotate:compress true
```

#### 8.2 System Monitoring
```bash
# Install monitoring tools
sudo apt install -y htop iotop nethogs

# Optional: Install node-exporter for Prometheus
# (If using Prometheus/Grafana monitoring stack)
```

---

### STEP 9: Verification & Testing (30 minutes)

#### 9.1 Health Check
```bash
# Test health endpoint
curl https://api.writecarenotes.com/health

# Expected response:
# {"status":"ok","timestamp":"...","version":"2.0.0"}
```

#### 9.2 API Endpoint Tests
```bash
# Test Phase 2 endpoints
curl -X GET https://api.writecarenotes.com/api/v1/documents \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"

curl -X GET https://api.writecarenotes.com/api/v1/incidents \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"

curl -X GET https://api.writecarenotes.com/api/v1/activities \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"

curl -X GET https://api.writecarenotes.com/api/v1/reporting/dashboard-kpis \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

#### 9.3 Database Connection Test
```bash
# Check database connections
psql -U writecare_user -d writecarenotes_production -c "
SELECT COUNT(*) FROM documents;
SELECT COUNT(*) FROM incident_reports;
SELECT COUNT(*) FROM activities;
"
```

#### 9.4 Performance Test
```bash
# Install Apache Bench
sudo apt install -y apache2-utils

# Run load test (100 requests, 10 concurrent)
ab -n 100 -c 10 https://api.writecarenotes.com/health

# Monitor during load test
pm2 monit
```

---

### STEP 10: Post-Deployment (15 minutes)

#### 10.1 Documentation
- [ ] Update API documentation URL
- [ ] Notify team of deployment
- [ ] Update status page (if applicable)
- [ ] Create deployment tag in Git

#### 10.2 Create Git Tag
```bash
# Tag release
git tag -a v2.0.0 -m "Phase 2 Production Release - 6 Services, 84 Endpoints"
git push origin v2.0.0
```

#### 10.3 Monitor First 24 Hours
```bash
# Watch logs
pm2 logs writecare-api --lines 100

# Monitor errors
tail -f /var/writecare/logs/error.log

# Monitor Nginx
tail -f /var/log/nginx/writecare_error.log

# Monitor database
sudo -u postgres psql writecarenotes_production -c "
SELECT pid, usename, application_name, client_addr, state, query
FROM pg_stat_activity
WHERE datname = 'writecarenotes_production';
"
```

---

## 🚨 Troubleshooting

### Application Won't Start
```bash
# Check logs
pm2 logs writecare-api --err

# Check environment
pm2 env 0

# Check permissions
ls -la /var/writecare/app

# Restart
pm2 restart writecare-api
```

### Database Connection Errors
```bash
# Test connection
psql -U writecare_user -h localhost -d writecarenotes_production

# Check PostgreSQL status
sudo systemctl status postgresql

# Check PostgreSQL logs
sudo tail -f /var/log/postgresql/postgresql-15-main.log
```

### High Memory Usage
```bash
# Check PM2 processes
pm2 monit

# Restart if needed
pm2 restart writecare-api

# Adjust PM2 max memory restart
pm2 delete writecare-api
pm2 start ecosystem.config.js --env production --max-memory-restart 512M
```

### SSL Certificate Issues
```bash
# Renew certificate
sudo certbot renew

# Test SSL
curl -I https://api.writecarenotes.com
```

---

## 📊 Production Checklist Summary

### ✅ Completed Tasks
- [x] Phase 2 code complete (6 services, 84 endpoints)
- [x] TypeScript compilation successful
- [x] Git commits pushed
- [x] Documentation complete
- [x] Migration file created
- [x] Environment template created

### ⚠️ Required Before Go-Live
- [ ] Server provisioned
- [ ] Database created and migrated
- [ ] Environment variables configured
- [ ] SSL certificate installed
- [ ] Application started with PM2
- [ ] Nginx configured
- [ ] Firewall configured
- [ ] Monitoring configured
- [ ] Backup strategy tested
- [ ] Load testing completed
- [ ] Security audit passed
- [ ] Team trained on new features

---

## 📞 Support & Escalation

### Production Issues
1. Check application logs: `pm2 logs`
2. Check database logs: `/var/log/postgresql/`
3. Check Nginx logs: `/var/log/nginx/`
4. Check system logs: `journalctl -xe`

### Emergency Rollback
```bash
# Stop application
pm2 stop writecare-api

# Rollback database migration
NODE_ENV=production npm run typeorm migration:revert

# Switch to previous version
git checkout v1.0.0

# Rebuild
npm run build

# Restart
pm2 restart writecare-api
```

---

## 🎯 Success Criteria

✅ **Deployment Successful When:**
- All 84 Phase 2 endpoints responding
- Zero application errors in logs
- Database migration completed successfully
- SSL certificate valid
- Health check endpoint returning 200
- Load test passes (< 200ms average response time)
- All 6 services operational
- Monitoring active and alerting
- Backup strategy operational

---

**Deployment Guide Version**: 1.0  
**Last Updated**: October 9, 2025  
**Next Review**: After first production deployment
