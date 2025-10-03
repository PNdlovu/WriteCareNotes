# Deployment Guide – WriteCareNotes

## Quick Start Deployment

This guide provides step-by-step instructions for deploying WriteCareNotes in various environments.

## Prerequisites

- Node.js 18+
- PostgreSQL 14+
- Redis 6+
- Docker (optional)
- PM2 (optional)

## Environment Setup

### 1. Clone Repository
```bash
git clone <repository-url>
cd writecarenotes
```

### 2. Install Dependencies
```bash
npm install
```

### 3. Environment Configuration
```bash
cp .env.example .env
# Edit .env with your configuration
```

### 4. Database Setup
```bash
npm run migrate:up
npm run seed
```

### 5. Start Application
```bash
# Development
npm run dev

# Production
npm run build
npm start
```

## Docker Deployment

### 1. Build Image
```bash
docker build -t writecarenotes .
```

### 2. Run Container
```bash
docker run -d --name writecarenotes-api \
  -p 3000:3000 \
  --env-file .env \
  writecarenotes
```

### 3. Docker Compose
```bash
docker-compose up -d
```

## PM2 Deployment

### 1. Build Application
```bash
npm run build
```

### 2. Start with PM2
```bash
pm2 start dist/index.js --name writecarenotes-api
pm2 save
pm2 startup
```

## Production Checklist

- [ ] Environment variables configured
- [ ] Database migrations completed
- [ ] SSL certificate installed
- [ ] Firewall configured
- [ ] Backup system setup
- [ ] Monitoring configured
- [ ] Health checks passing

## Troubleshooting

### Common Issues
1. **Database Connection**: Check PostgreSQL service
2. **Redis Connection**: Check Redis service
3. **Port Conflicts**: Check port availability
4. **Permission Issues**: Check file permissions

### Support
- Documentation: `/docs/`
- Health Checks: `/health`
- API Docs: `/api/docs`

---

*For detailed deployment instructions, see the Enterprise Turnkey Implementation Plan.*