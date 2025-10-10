# Children's Care System - Deployment Guide

**Version:** 1.0.0  
**Date:** October 10, 2025  
**Status:** Production Ready ✅

---

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [Environment Setup](#environment-setup)
3. [Database Configuration](#database-configuration)
4. [Running Migrations](#running-migrations)
5. [Starting the Application](#starting-the-application)
6. [Verification Steps](#verification-steps)
7. [High Availability Setup](#high-availability-setup)
8. [Monitoring](#monitoring)
9. [Troubleshooting](#troubleshooting)

---

## Prerequisites

### Required Software

- **Node.js:** v20.x or higher
- **npm:** v10.x or higher
- **PostgreSQL:** v17 or higher
- **Redis:** v7 or higher
- **Docker:** v24.x or higher (for containerized deployment)
- **Docker Compose:** v2.x or higher

### Required Accounts/Services

- PostgreSQL database instance
- Redis instance
- Email service (SMTP) for notifications
- SMS service (optional - Twilio/AWS SNS)

---

## Environment Setup

### 1. Clone and Install

```bash
# Navigate to project directory
cd C:\Users\phila\Desktop\WCNotes-new-master

# Install dependencies
npm install

# Install TypeORM CLI globally (optional)
npm install -g typeorm
```

### 2. Environment Variables

Create a `.env` file in the project root:

```env
# === Application ===
NODE_ENV=production
PORT=3000
APP_NAME=WriteCareNotes Children's Care System

# === Database ===
DB_HOST=localhost
DB_PORT=5432
DB_USER=postgres
DB_PASSWORD=your_secure_password_here
DB_NAME=children_care_system
DB_SSL=true

# === Redis ===
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=your_redis_password_here

# === JWT/Authentication ===
JWT_SECRET=your_jwt_secret_key_here_min_32_chars
JWT_EXPIRY=1h
REFRESH_TOKEN_EXPIRY=7d

# === Email (SMTP) ===
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your-email@domain.com
SMTP_PASSWORD=your-app-password
EMAIL_FROM=noreply@caresystem.com

# === SMS (Optional) ===
TWILIO_ACCOUNT_SID=your_twilio_sid
TWILIO_AUTH_TOKEN=your_twilio_token
TWILIO_PHONE_NUMBER=+44123456789

# === File Storage ===
STORAGE_TYPE=local
STORAGE_PATH=./uploads
MAX_FILE_SIZE=10485760

# === Monitoring ===
PROMETHEUS_PORT=9090
GRAFANA_PORT=3001

# === External Services (Optional) ===
GOOGLE_MAPS_API_KEY=your_google_maps_api_key
POSTCODES_IO_URL=https://api.postcodes.io

# === Compliance ===
OFSTED_NOTIFICATION_EMAIL=ofsted@localauthority.gov.uk
LOCAL_AUTHORITY_EMAIL=childrensservices@localauthority.gov.uk
```

---

## Database Configuration

### 1. Create Database

```sql
-- Connect to PostgreSQL as superuser
psql -U postgres

-- Create database
CREATE DATABASE children_care_system;

-- Create user with secure password
CREATE USER care_system_user WITH ENCRYPTED PASSWORD 'your_secure_password';

-- Grant privileges
GRANT ALL PRIVILEGES ON DATABASE children_care_system TO care_system_user;

-- Exit
\q
```

### 2. Configure Connection

The database configuration is already set up in `src/config/typeorm.config.ts` with support for:

- ✅ PostgreSQL 17
- ✅ SSL/TLS connections (production)
- ✅ Connection pooling
- ✅ Logging (development only)
- ✅ Migration support

---

## Running Migrations

### Migration Scripts Available

```bash
# Show pending migrations
npm run migration:show

# Run all pending migrations
npm run migration:run

# Revert last migration
npm run migration:revert

# Generate new migration from entity changes
npm run migration:generate -- src/migrations/NewMigrationName

# Create empty migration
npm run migration:create -- src/migrations/NewMigrationName

# Synchronize schema (DANGEROUS - dev only)
npm run schema:sync

# Drop entire schema (DANGEROUS)
npm run schema:drop
```

### Execute Migrations

```bash
# Step 1: Show what will be migrated
npm run migration:show

# Step 2: Run migrations
npm run migration:run

# Expected output:
# ✅ Migration 001-CreateChildProfile executed successfully
# ✅ Migration 002-CreateChildrenCareSystem executed successfully
# 
# Database schema created:
# - children (50+ columns, 7 indexes)
# - placements (22 columns, 5 indexes)
# - safeguarding_incidents (30+ columns, 6 indexes)
# - personal_education_plans (25+ columns, 5 indexes)
# - health_assessments (30+ columns, 5 indexes)
# - family_members (20+ columns, 4 indexes)
# - contact_schedules (18 columns, 4 indexes)
# - care_plans (25+ columns, 5 indexes)
# - care_plan_reviews (20+ columns, 6 indexes)
# - pathway_plans (30+ columns, 5 indexes)
# - uasc_profiles (40+ columns, 5 indexes)
# - age_assessments (30+ columns, 3 indexes)
# - immigration_statuses (35+ columns, 4 indexes)
# - home_office_correspondence (30+ columns, 4 indexes)
# - audit_log (6 columns, 3 indexes)
```

### Verify Migration Success

```sql
-- Connect to database
psql -U care_system_user -d children_care_system

-- Check tables created
\dt

-- Check children table structure
\d children

-- Check indexes
\di

-- Check foreign keys
SELECT
    tc.table_name, 
    kcu.column_name,
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name
FROM information_schema.table_constraints AS tc 
JOIN information_schema.key_column_usage AS kcu
    ON tc.constraint_name = kcu.constraint_name
JOIN information_schema.constraint_column_usage AS ccu
    ON ccu.constraint_name = tc.constraint_name
WHERE tc.constraint_type = 'FOREIGN KEY';

-- Exit
\q
```

---

## Starting the Application

### Development Mode

```bash
# Start in development mode with hot reload
npm run dev

# Expected output:
# ✅ Database connection established
# ✅ Redis connection established
# 🚀 Server running on port 3000
# 📊 Prometheus metrics on port 9090
```

### Production Mode

```bash
# Build application
npm run build

# Start production server
npm start

# Or use PM2 for process management
npm install -g pm2
pm2 start dist/server.js --name children-care-system
pm2 save
pm2 startup
```

### Docker Compose (Recommended for Production)

```bash
# Start all services (app, database, redis, monitoring)
docker-compose up -d

# Check status
docker-compose ps

# View logs
docker-compose logs -f app

# Stop all services
docker-compose down

# Stop and remove volumes (DANGEROUS - deletes data)
docker-compose down -v
```

---

## Verification Steps

### 1. Health Check

```bash
# Check application health
curl http://localhost:3000/health

# Expected response:
# {
#   "status": "ok",
#   "database": "connected",
#   "redis": "connected",
#   "uptime": 123.45
# }
```

### 2. API Endpoints

```bash
# Test child profile creation
curl -X POST http://localhost:3000/api/v1/children \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "firstName": "Test",
    "lastName": "Child",
    "dateOfBirth": "2015-05-15",
    "gender": "MALE",
    "organizationId": "org-uuid-here"
  }'

# Test child retrieval
curl http://localhost:3000/api/v1/children \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"

# Test placement endpoints
curl http://localhost:3000/api/v1/placements \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"

# Test UASC endpoints
curl http://localhost:3000/api/v1/uasc/profiles \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

### 3. Database Verification

```sql
-- Check record counts
SELECT 
  'children' as table_name, COUNT(*) as count FROM children
UNION ALL
SELECT 'placements', COUNT(*) FROM placements
UNION ALL
SELECT 'safeguarding_incidents', COUNT(*) FROM safeguarding_incidents
UNION ALL
SELECT 'personal_education_plans', COUNT(*) FROM personal_education_plans
UNION ALL
SELECT 'health_assessments', COUNT(*) FROM health_assessments
UNION ALL
SELECT 'family_members', COUNT(*) FROM family_members
UNION ALL
SELECT 'contact_schedules', COUNT(*) FROM contact_schedules
UNION ALL
SELECT 'care_plans', COUNT(*) FROM care_plans
UNION ALL
SELECT 'care_plan_reviews', COUNT(*) FROM care_plan_reviews
UNION ALL
SELECT 'pathway_plans', COUNT(*) FROM pathway_plans
UNION ALL
SELECT 'uasc_profiles', COUNT(*) FROM uasc_profiles
UNION ALL
SELECT 'age_assessments', COUNT(*) FROM age_assessments
UNION ALL
SELECT 'immigration_statuses', COUNT(*) FROM immigration_statuses
UNION ALL
SELECT 'home_office_correspondence', COUNT(*) FROM home_office_correspondence
UNION ALL
SELECT 'audit_log', COUNT(*) FROM audit_log;
```

### 4. TypeScript Compilation

```bash
# Check for compilation errors
npm run type-check

# Expected output:
# No errors found
```

### 5. Linting

```bash
# Run ESLint
npm run lint

# Expected output:
# No linting errors
```

---

## High Availability Setup

### Architecture Overview

The system is designed for high availability with:

- **3 Application Instances** (load balanced)
- **1 Primary PostgreSQL** + **2 Read Replicas**
- **Redis** for session management and caching
- **Nginx** load balancer
- **Prometheus + Grafana** monitoring
- **AlertManager** for notifications

### Docker Compose HA Configuration

```bash
# Start HA infrastructure
docker-compose -f docker-compose.production.yml up -d

# Services started:
# - app-1, app-2, app-3 (application instances)
# - postgres-primary
# - postgres-replica-1
# - postgres-replica-2
# - redis
# - nginx (load balancer)
# - prometheus
# - grafana
# - alertmanager
```

### Load Balancer Configuration

Nginx is configured with:
- **Least connections** algorithm
- **Health checks** every 10 seconds
- **Session persistence** via cookies
- **SSL/TLS termination**
- **Request timeout:** 30 seconds

### Database Replication

PostgreSQL streaming replication:
- **Primary:** Write operations
- **Replica 1 & 2:** Read operations (queries)
- **Automatic failover** via pg_auto_failover (optional)

---

## Monitoring

### Prometheus Metrics

Access Prometheus at `http://localhost:9090`

**Key Metrics:**
- `http_requests_total` - Total HTTP requests
- `http_request_duration_seconds` - Request latency
- `db_query_duration_seconds` - Database query time
- `children_total` - Total children in system
- `placements_active` - Active placements
- `safeguarding_incidents_total` - Total incidents
- `uasc_profiles_active` - Active UASC profiles

### Grafana Dashboards

Access Grafana at `http://localhost:3001`

**Default Credentials:**
- Username: `admin`
- Password: `admin` (change on first login)

**Pre-configured Dashboards:**
1. **System Overview** - Application health and performance
2. **Database Performance** - Query times, connections, locks
3. **Children's Care Metrics** - Child counts, placements, compliance
4. **Safeguarding Dashboard** - Incidents, LADO referrals, OFSTED notifications
5. **UASC Dashboard** - UASC profiles, immigration status, age assessments

### AlertManager

Configured alerts for:
- Application down (any instance)
- Database connection failures
- High response times (>2 seconds)
- Overdue health assessments
- Overdue LAC reviews
- Overdue OFSTED notifications
- Missing children alerts

---

## Troubleshooting

### Issue: Migration Fails

**Error:** `relation "children" already exists`

**Solution:**
```bash
# Check current migrations
npm run migration:show

# If migrations already run, skip
# If partial migration, revert and re-run
npm run migration:revert
npm run migration:run
```

### Issue: Database Connection Failed

**Error:** `ECONNREFUSED` or `Authentication failed`

**Solution:**
```bash
# Check PostgreSQL is running
# Windows:
Get-Service -Name postgresql*

# Check credentials in .env
# Verify DB_HOST, DB_PORT, DB_USER, DB_PASSWORD

# Test connection manually
psql -h localhost -U postgres -d children_care_system
```

### Issue: TypeORM Entity Not Found

**Error:** `Cannot find entity "Child"`

**Solution:**
- Verify entity is imported in `src/config/typeorm.config.ts`
- Check entity path is correct
- Ensure entity is exported from index.ts
- Restart application after adding entity

### Issue: Port Already in Use

**Error:** `EADDRINUSE: address already in use :::3000`

**Solution:**
```powershell
# Find process using port 3000
netstat -ano | findstr :3000

# Kill the process (replace PID with actual process ID)
taskkill /PID <PID> /F

# Or change PORT in .env file
```

### Issue: Redis Connection Failed

**Error:** `Redis connection refused`

**Solution:**
```bash
# Start Redis (Windows - if installed via Chocolatey)
redis-server

# Or start via Docker
docker run -d -p 6379:6379 redis:7-alpine

# Verify connection
redis-cli ping
# Expected: PONG
```

### Issue: Missing Dependencies

**Error:** `Cannot find module 'typeorm'`

**Solution:**
```bash
# Clean install
rm -rf node_modules package-lock.json
npm install

# Or install specific package
npm install typeorm
```

---

## Production Checklist

### Pre-Deployment ✅

- [ ] Environment variables configured
- [ ] Database created and configured
- [ ] Redis configured
- [ ] SSL/TLS certificates installed
- [ ] Firewall rules configured
- [ ] Backup strategy implemented
- [ ] Monitoring configured
- [ ] Email/SMS services configured
- [ ] OFSTED notification emails configured

### Deployment ✅

- [ ] Code compiled successfully (`npm run build`)
- [ ] Migrations executed (`npm run migration:run`)
- [ ] Health check passing
- [ ] All API endpoints tested
- [ ] Load balancer configured
- [ ] SSL/TLS enabled
- [ ] Monitoring dashboards active

### Post-Deployment ✅

- [ ] System health verified
- [ ] Performance metrics baseline established
- [ ] Alert rules tested
- [ ] Backup restoration tested
- [ ] Disaster recovery plan documented
- [ ] User training completed
- [ ] Documentation updated

---

## Support and Maintenance

### Backup Strategy

**Database Backups:**
```bash
# Daily automated backup
pg_dump -U postgres children_care_system > backup_$(date +%Y%m%d).sql

# Restore from backup
psql -U postgres children_care_system < backup_20251010.sql
```

**Application Logs:**
```bash
# View logs
docker-compose logs -f app

# Export logs
docker-compose logs app > app_logs_$(date +%Y%m%d).log
```

### Update Procedure

```bash
# 1. Backup database
pg_dump -U postgres children_care_system > backup_pre_update.sql

# 2. Pull latest code
git pull origin master

# 3. Install dependencies
npm install

# 4. Run migrations
npm run migration:run

# 5. Build application
npm run build

# 6. Restart services
docker-compose restart app

# 7. Verify health
curl http://localhost:3000/health
```

### Security Updates

- Weekly dependency updates: `npm audit fix`
- Monthly security patches
- Quarterly penetration testing
- Annual security audit

---

## Contact and Support

**Technical Support:**
- Email: support@caresystem.com
- Phone: +44 (0) 123 456 7890
- Documentation: https://docs.caresystem.com

**Emergency Support (24/7):**
- Phone: +44 (0) 123 456 7891
- Email: emergency@caresystem.com

---

**Deployment Guide Version:** 1.0.0  
**Last Updated:** October 10, 2025  
**Next Review:** January 10, 2026
