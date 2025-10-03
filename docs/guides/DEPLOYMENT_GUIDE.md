# Care Home Management System - Deployment Guide

## 🚀 Production Deployment Checklist

### Prerequisites
- Node.js 18+ and npm 8+
- PostgreSQL 14+
- Redis 6+
- Docker (optional)
- SSL certificates
- Domain name configured

### 1. Environment Setup

#### Production Environment Variables
```bash
# Application
NODE_ENV=production
PORT=3000
APP_VERSION=1.0.0

# Database
DB_HOST=your-db-host
DB_PORT=5432
DB_USERNAME=carehome_user
DB_PASSWORD=secure-password
DB_NAME=carehome_management
DB_SSL_ENABLED=true
DB_SSL_REJECT_UNAUTHORIZED=true

# Redis
REDIS_HOST=your-redis-host
REDIS_PORT=6379
REDIS_PASSWORD=secure-redis-password
REDIS_DB=0

# Security
JWT_SECRET=your-super-secure-jwt-secret
JWT_REFRESH_SECRET=your-super-secure-refresh-secret
ENCRYPTION_KEY=your-32-char-encryption-key
FIELD_ENCRYPTION_KEY=your-32-char-field-key

# CORS
CORS_ORIGIN=https://yourdomain.com,https://app.yourdomain.com

# Rate Limiting
RATE_LIMIT_GENERAL_MAX=100
RATE_LIMIT_AUTH_MAX=5
RATE_LIMIT_HEALTHCARE_MAX=30
RATE_LIMIT_MEDICATION_MAX=20

# External Services
NHS_DIGITAL_API_BASE_URL=https://api.service.nhs.uk
GP_CONNECT_API_BASE_URL=https://api.gpconnect.nhs.uk
SENDGRID_API_KEY=your-sendgrid-key
TWILIO_ACCOUNT_SID=your-twilio-sid
TWILIO_AUTH_TOKEN=your-twilio-token
```

### 2. Database Setup

#### PostgreSQL Configuration
```sql
-- Create database
CREATE DATABASE carehome_management;

-- Create user
CREATE USER carehome_user WITH PASSWORD 'secure-password';
GRANT ALL PRIVILEGES ON DATABASE carehome_management TO carehome_user;

-- Enable required extensions
\c carehome_management;
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
```

#### Run Migrations
```bash
npm run build
npm run migrate:up
npm run seed:production
```

### 3. Redis Setup

#### Redis Configuration
```bash
# Install Redis
sudo apt-get install redis-server

# Configure Redis
sudo nano /etc/redis/redis.conf

# Set password
requirepass your-secure-redis-password

# Restart Redis
sudo systemctl restart redis-server
```

### 4. Application Deployment

#### Using PM2 (Recommended)
```bash
# Install PM2
npm install -g pm2

# Build application
npm run build

# Start with PM2
pm2 start dist/index.js --name carehome-api

# Save PM2 configuration
pm2 save
pm2 startup
```

#### Using Docker
```dockerfile
FROM node:18-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci --only=production

COPY dist/ ./dist/

EXPOSE 3000

CMD ["node", "dist/index.js"]
```

```bash
# Build and run
docker build -t carehome-api .
docker run -d --name carehome-api -p 3000:3000 --env-file .env carehome-api
```

### 5. Reverse Proxy Setup (Nginx)

#### Nginx Configuration
```nginx
server {
    listen 443 ssl http2;
    server_name yourdomain.com;

    ssl_certificate /path/to/certificate.crt;
    ssl_certificate_key /path/to/private.key;

    # Security headers
    add_header X-Frame-Options DENY;
    add_header X-Content-Type-Options nosniff;
    add_header X-XSS-Protection "1; mode=block";
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains; preload";

    # Rate limiting
    limit_req_zone $binary_remote_addr zone=api:10m rate=10r/s;
    limit_req zone=api burst=20 nodelay;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }

    # Health check endpoint
    location /health {
        proxy_pass http://localhost:3000/health;
        access_log off;
    }
}
```

### 6. SSL Certificate Setup

#### Using Let's Encrypt
```bash
# Install Certbot
sudo apt-get install certbot python3-certbot-nginx

# Obtain certificate
sudo certbot --nginx -d yourdomain.com

# Auto-renewal
sudo crontab -e
# Add: 0 12 * * * /usr/bin/certbot renew --quiet
```

### 7. Monitoring and Logging

#### Application Monitoring
```bash
# Install monitoring tools
npm install -g clinic

# Run performance analysis
clinic doctor -- node dist/index.js

# Monitor with PM2
pm2 monit
```

#### Log Management
```bash
# Configure log rotation
sudo nano /etc/logrotate.d/carehome-api

# Add:
/var/log/carehome-api/*.log {
    daily
    missingok
    rotate 30
    compress
    delaycompress
    notifempty
    create 644 carehome carehome
}
```

### 8. Backup Strategy

#### Database Backup
```bash
#!/bin/bash
# backup-db.sh

DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR="/backups/database"
DB_NAME="carehome_management"

mkdir -p $BACKUP_DIR

pg_dump -h $DB_HOST -U $DB_USERNAME $DB_NAME | gzip > $BACKUP_DIR/backup_$DATE.sql.gz

# Keep only last 30 days
find $BACKUP_DIR -name "backup_*.sql.gz" -mtime +30 -delete
```

#### Application Backup
```bash
#!/bin/bash
# backup-app.sh

DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR="/backups/application"
APP_DIR="/opt/carehome-api"

mkdir -p $BACKUP_DIR

tar -czf $BACKUP_DIR/app_backup_$DATE.tar.gz -C $APP_DIR .

# Keep only last 7 days
find $BACKUP_DIR -name "app_backup_*.tar.gz" -mtime +7 -delete
```

### 9. Security Hardening

#### Firewall Configuration
```bash
# Configure UFW
sudo ufw enable
sudo ufw allow 22/tcp
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw deny 3000/tcp
```

#### System Hardening
```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install security tools
sudo apt install fail2ban ufw

# Configure fail2ban
sudo nano /etc/fail2ban/jail.local
```

### 10. Health Checks and Monitoring

#### Health Check Endpoints
- `/health` - Comprehensive system health
- `/health/ready` - Readiness for traffic
- `/health/live` - Liveness check
- `/health/metrics` - System metrics

#### Monitoring Setup
```bash
# Install monitoring tools
npm install -g pm2-logrotate

# Configure log rotation
pm2 install pm2-logrotate
pm2 set pm2-logrotate:max_size 10M
pm2 set pm2-logrotate:retain 30
```

### 11. Performance Optimization

#### Database Optimization
```sql
-- Create indexes for performance
CREATE INDEX idx_medications_patient_id ON medications(patient_id);
CREATE INDEX idx_consent_resident_id ON consent_management(resident_id);
CREATE INDEX idx_audit_logs_timestamp ON audit_logs(timestamp);
```

#### Application Optimization
```bash
# Enable compression
# Already configured in app.ts

# Configure Redis for caching
# Already configured in redis.config.ts

# Monitor performance
pm2 monit
```

### 12. Disaster Recovery

#### Backup Verification
```bash
#!/bin/bash
# verify-backup.sh

# Test database backup
gunzip -t /backups/database/backup_$(date +%Y%m%d)_*.sql.gz

# Test application backup
tar -tzf /backups/application/app_backup_$(date +%Y%m%d)_*.tar.gz > /dev/null

echo "Backup verification completed"
```

#### Recovery Procedures
```bash
# Database recovery
gunzip -c /backups/database/backup_YYYYMMDD_HHMMSS.sql.gz | psql -h $DB_HOST -U $DB_USERNAME $DB_NAME

# Application recovery
tar -xzf /backups/application/app_backup_YYYYMMDD_HHMMSS.tar.gz -C /opt/carehome-api/
```

### 13. Testing in Production

#### Smoke Tests
```bash
# Test health endpoints
curl -f https://yourdomain.com/health || exit 1
curl -f https://yourdomain.com/health/ready || exit 1
curl -f https://yourdomain.com/health/live || exit 1

# Test API endpoints
curl -f https://yourdomain.com/api/docs || exit 1
```

#### Load Testing
```bash
# Install artillery
npm install -g artillery

# Run load test
artillery run load-test.yml
```

### 14. Maintenance Procedures

#### Regular Maintenance
```bash
# Weekly tasks
- Check disk space
- Review logs for errors
- Update security patches
- Verify backups

# Monthly tasks
- Performance analysis
- Security audit
- Dependency updates
- Capacity planning
```

#### Update Procedures
```bash
# Application update
git pull origin main
npm ci
npm run build
pm2 restart carehome-api

# Database migration
npm run migrate:up

# Verify deployment
npm run test:smoke
```

## 🎯 Post-Deployment Checklist

- [ ] All health checks passing
- [ ] SSL certificate valid
- [ ] Database connections working
- [ ] Redis connections working
- [ ] Rate limiting functional
- [ ] CSRF protection active
- [ ] Security headers present
- [ ] Audit logging working
- [ ] Backup procedures tested
- [ ] Monitoring configured
- [ ] Documentation updated
- [ ] Team trained on new features

## 📞 Support and Troubleshooting

### Common Issues
1. **Database Connection Errors**: Check credentials and network connectivity
2. **Redis Connection Errors**: Verify Redis is running and accessible
3. **Rate Limiting Issues**: Adjust limits based on usage patterns
4. **SSL Certificate Issues**: Verify certificate validity and configuration

### Log Locations
- Application logs: `/var/log/carehome-api/`
- Nginx logs: `/var/log/nginx/`
- System logs: `/var/log/syslog`

### Emergency Contacts
- System Administrator: [contact info]
- Database Administrator: [contact info]
- Security Team: [contact info]

---

**Deployment Status**: ✅ Ready for Production
**Security Level**: 🛡️ Enterprise Grade
**Compliance**: 🏥 Healthcare Compliant