#!/bin/bash

# ===============================================
# WriteCareNotes Enterprise Setup Script
# Complete Healthcare Management System
# ===============================================

set -e

echo "🏥 WriteCareNotes Enterprise Setup Starting..."
echo "=============================================="

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Log function
log() {
    echo -e "${GREEN}[$(date +'%Y-%m-%d %H:%M:%S')]${NC} $1"
}

warn() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check prerequisites
log "Checking prerequisites..."

# Check Node.js
if ! command -v node &> /dev/null; then
    error "Node.js is not installed. Please install Node.js 18+ and npm."
    exit 1
fi

NODE_VERSION=$(node --version | cut -d 'v' -f 2 | cut -d '.' -f 1)
if [ "$NODE_VERSION" -lt 18 ]; then
    error "Node.js version 18+ is required. Current version: $(node --version)"
    exit 1
fi

# Check PostgreSQL
if ! command -v psql &> /dev/null; then
    warn "PostgreSQL is not installed or not in PATH."
    warn "Please ensure PostgreSQL is running and accessible."
fi

# Check Docker (optional)
if command -v docker &> /dev/null; then
    log "Docker found - container deployment available"
else
    warn "Docker not found - only local development available"
fi

# Install dependencies
log "Installing dependencies..."
npm install

# Create environment file if it doesn't exist
if [ ! -f .env ]; then
    log "Creating environment configuration..."
    cat > .env << EOL
# ===============================================
# WriteCareNotes Enterprise Environment Config
# ===============================================

# Environment
NODE_ENV=development

# Server Configuration
PORT=3001
HOST=localhost

# Database Configuration
DB_HOST=localhost
DB_PORT=5432
DB_NAME=writecarenotes_enterprise
DB_USER=postgres
DB_PASSWORD=password

# Redis Configuration (for caching and sessions)
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=

# JWT Configuration
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
JWT_REFRESH_SECRET=your-super-secret-refresh-key-change-this-in-production
JWT_ISSUER=writecarenotes.com
JWT_AUDIENCE=writecarenotes-app
ACCESS_TOKEN_EXPIRY=15m
REFRESH_TOKEN_EXPIRY=7d

# Encryption Configuration (for GDPR compliance)
ENCRYPTION_KEY=your-32-character-encryption-key-change-this
SALT_ROUNDS=12

# Email Configuration
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@domain.com
SMTP_PASS=your-app-password

# File Storage Configuration
STORAGE_TYPE=local
STORAGE_PATH=./uploads
MAX_FILE_SIZE=10MB

# NHS Integration (for UK deployment)
NHS_API_KEY=your-nhs-api-key
NHS_API_ENDPOINT=https://api.nhs.uk

# Monitoring and Logging
LOG_LEVEL=info
ENABLE_REQUEST_LOGGING=true
SENTRY_DSN=

# AI Services Configuration
OPENAI_API_KEY=your-openai-api-key
AI_MODEL=gpt-4
AI_TEMPERATURE=0.7

# Security Configuration
CORS_ORIGIN=http://localhost:3000
RATE_LIMIT_WINDOW=15
RATE_LIMIT_MAX=100

# Compliance Configuration
GDPR_MODE=true
AUDIT_LOG_RETENTION_DAYS=2555  # 7 years for healthcare
PII_ENCRYPTION_REQUIRED=true

EOL
    log "Environment file created. Please update the configuration values."
    warn "IMPORTANT: Change default passwords and secrets before production deployment!"
fi

# Create database if PostgreSQL is available
if command -v createdb &> /dev/null; then
    log "Setting up database..."
    
    # Try to create database (ignore error if it already exists)
    createdb writecarenotes_enterprise 2>/dev/null || warn "Database may already exist"
    
    # Run database schema
    if [ -f "database/enterprise-schema.sql" ]; then
        log "Applying database schema..."
        psql -d writecarenotes_enterprise -f database/enterprise-schema.sql || warn "Schema application failed - may need manual setup"
    fi
else
    warn "PostgreSQL tools not found. Manual database setup required."
fi

# Build the application
log "Building application..."
npm run build || warn "Build completed with warnings"

# Create necessary directories
log "Creating directory structure..."
mkdir -p uploads/{documents,images,exports}
mkdir -p logs
mkdir -p backups
mkdir -p temp

# Set up log rotation (if logrotate is available)
if command -v logrotate &> /dev/null; then
    log "Setting up log rotation..."
    cat > logrotate.conf << EOL
logs/*.log {
    daily
    rotate 30
    compress
    delaycompress
    missingok
    notifempty
    create 644 root root
}
EOL
fi

# Create systemd service file (for Linux production deployment)
if [ -d "/etc/systemd/system" ] && [ "$EUID" -eq 0 ]; then
    log "Creating systemd service..."
    cat > /etc/systemd/system/writecarenotes.service << EOL
[Unit]
Description=WriteCareNotes Enterprise Healthcare Management
Documentation=https://github.com/your-org/writecarenotes
After=network.target postgresql.service

[Service]
Type=simple
User=www-data
WorkingDirectory=$(pwd)
Environment=NODE_ENV=production
ExecStart=/usr/bin/node dist/server.js
Restart=on-failure
RestartSec=10
StandardOutput=syslog
StandardError=syslog
SyslogIdentifier=writecarenotes

[Install]
WantedBy=multi-user.target
EOL
    systemctl daemon-reload
    log "Systemd service created. Use 'systemctl start writecarenotes' to start the service."
fi

# Create Docker files for containerized deployment
log "Creating Docker configuration..."
cat > Dockerfile.enterprise << EOL
# ===============================================
# WriteCareNotes Enterprise Production Dockerfile
# ===============================================

FROM node:18-alpine AS base

# Install system dependencies
RUN apk add --no-cache postgresql-client redis curl

# Create application directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci --only=production

# Copy application code
COPY dist/ ./dist/
COPY database/ ./database/
COPY .env.production ./.env

# Create non-root user
RUN addgroup -g 1001 -S writecarenotes && \\
    adduser -S writecarenotes -u 1001

# Set ownership
RUN chown -R writecarenotes:writecarenotes /app
USER writecarenotes

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \\
    CMD curl -f http://localhost:3001/api/health || exit 1

# Expose port
EXPOSE 3001

# Start application
CMD ["node", "dist/server.js"]
EOL

cat > docker-compose.enterprise.yml << EOL
version: '3.8'

services:
  writecarenotes:
    build: 
      context: .
      dockerfile: Dockerfile.enterprise
    ports:
      - "3001:3001"
    environment:
      - NODE_ENV=production
    depends_on:
      - postgres
      - redis
    volumes:
      - ./uploads:/app/uploads
      - ./logs:/app/logs
    restart: unless-stopped
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:3001/api/health"]
      interval: 30s
      timeout: 10s
      retries: 3

  postgres:
    image: postgres:15-alpine
    environment:
      POSTGRES_DB: writecarenotes_enterprise
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: your-secure-password
    volumes:
      - postgres_data:/var/lib/postgresql/data
      - ./database/enterprise-schema.sql:/docker-entrypoint-initdb.d/init.sql
    ports:
      - "5432:5432"
    restart: unless-stopped

  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"
    volumes:
      - redis_data:/data
    restart: unless-stopped

  nginx:
    image: nginx:alpine
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx.conf:/etc/nginx/nginx.conf
      - ./ssl:/etc/nginx/ssl
    depends_on:
      - writecarenotes
    restart: unless-stopped

volumes:
  postgres_data:
  redis_data:
EOL

# Create nginx configuration
cat > nginx.conf << EOL
events {
    worker_connections 1024;
}

http {
    upstream writecarenotes {
        server writecarenotes:3001;
    }

    server {
        listen 80;
        server_name _;

        location / {
            proxy_pass http://writecarenotes;
            proxy_set_header Host \$host;
            proxy_set_header X-Real-IP \$remote_addr;
            proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto \$scheme;
        }

        location /health {
            proxy_pass http://writecarenotes/api/health;
        }
    }
}
EOL

# Create development start script
cat > start-dev.sh << EOL
#!/bin/bash
echo "🏥 Starting WriteCareNotes Enterprise Development Server..."
echo "=============================================="

# Start PostgreSQL (if using Docker)
if command -v docker-compose &> /dev/null; then
    echo "Starting database services..."
    docker-compose -f docker-compose.dev.yml up -d postgres redis
fi

# Wait for database
echo "Waiting for database..."
sleep 5

# Start the application
echo "Starting application server..."
npm run dev
EOL

chmod +x start-dev.sh

# Create production start script
cat > start-prod.sh << EOL
#!/bin/bash
echo "🏥 Starting WriteCareNotes Enterprise Production Server..."
echo "=============================================="

# Build application
npm run build

# Start with Docker Compose
docker-compose -f docker-compose.enterprise.yml up -d

echo "✅ WriteCareNotes Enterprise is now running!"
echo "📊 Health Check: http://localhost:3001/api/health"
echo "📚 API Discovery: http://localhost:3001/api/v1/api-discovery"
echo "🔍 Logs: docker-compose -f docker-compose.enterprise.yml logs -f"
EOL

chmod +x start-prod.sh

# Final setup completion
echo ""
echo "=============================================="
log "✅ WriteCareNotes Enterprise Setup Complete!"
echo "=============================================="
echo ""
echo "📋 Next Steps:"
echo "   1. Update .env file with your configuration"
echo "   2. Set up PostgreSQL database"
echo "   3. Configure Redis (optional)"
echo "   4. Run './start-dev.sh' for development"
echo "   5. Run './start-prod.sh' for production"
echo ""
echo "📊 Available Commands:"
echo "   • npm run dev          - Start development server"
echo "   • npm run build        - Build for production"
echo "   • npm run start        - Start production server"
echo "   • npm test             - Run tests"
echo "   • npm run lint         - Check code quality"
echo ""
echo "🔗 Important URLs:"
echo "   • API Discovery: http://localhost:3001/api/v1/api-discovery"
echo "   • Health Check:  http://localhost:3001/api/health"
echo "   • System Info:   http://localhost:3001/api/v1/system/info"
echo ""
echo "📚 Documentation:"
echo "   • API Docs: docs/api/"
echo "   • Architecture: docs/architecture/"
echo "   • Deployment: docs/deployment/"
echo ""
warn "IMPORTANT: Change default passwords and secrets before production!"
warn "SECURITY: Review .env file and update all security settings"
echo ""
echo "🎉 Welcome to WriteCareNotes Enterprise Healthcare Management System!"
echo "=============================================="