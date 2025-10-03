#!/bin/bash

# WriteCareNotes AI Features Deployment Script
# This script deploys the complete AI-powered care home management system

set -e

echo "🚀 Starting WriteCareNotes AI Features Deployment..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if Node.js is installed
check_node() {
    print_status "Checking Node.js installation..."
    if ! command -v node &> /dev/null; then
        print_error "Node.js is not installed. Please install Node.js 18+ first."
        exit 1
    fi
    
    NODE_VERSION=$(node --version)
    print_success "Node.js version: $NODE_VERSION"
}

# Check if npm is installed
check_npm() {
    print_status "Checking npm installation..."
    if ! command -v npm &> /dev/null; then
        print_error "npm is not installed. Please install npm first."
        exit 1
    fi
    
    NPM_VERSION=$(npm --version)
    print_success "npm version: $NPM_VERSION"
}

# Install dependencies
install_dependencies() {
    print_status "Installing dependencies..."
    npm install
    print_success "Dependencies installed successfully"
}

# Run type checking
type_check() {
    print_status "Running TypeScript type checking..."
    npm run type-check
    print_success "Type checking passed"
}

# Run linting
run_lint() {
    print_status "Running ESLint..."
    npm run lint
    print_success "Linting passed"
}

# Run tests
run_tests() {
    print_status "Running tests..."
    npm test
    print_success "All tests passed"
}

# Build the application
build_app() {
    print_status "Building the application..."
    npm run build
    print_success "Application built successfully"
}

# Create environment file if it doesn't exist
create_env_file() {
    if [ ! -f .env ]; then
        print_status "Creating .env file..."
        cat > .env << EOF
# Database Configuration
DB_HOST=localhost
DB_PORT=5432
DB_USERNAME=writecarenotes
DB_PASSWORD=your_secure_password
DB_DATABASE=writecarenotes

# JWT Configuration
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
JWT_EXPIRES_IN=24h

# Redis Configuration
REDIS_URL=redis://localhost:6379

# Application Configuration
NODE_ENV=production
PORT=3000
CORS_ORIGIN=https://yourdomain.com

# AI Features Configuration
OPENAI_API_KEY=your-openai-api-key
AI_MODEL_VERSION=1.0.0
VOICE_RECOGNITION_ENABLED=true
PREDICTIVE_ANALYTICS_ENABLED=true
EMOTION_TRACKING_ENABLED=true
EOF
        print_warning "Please update the .env file with your actual configuration values"
    else
        print_status ".env file already exists"
    fi
}

# Create Docker Compose file
create_docker_compose() {
    print_status "Creating Docker Compose configuration..."
    cat > docker-compose.yml << EOF
version: '3.8'

services:
  app:
    build: .
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=production
      - DB_HOST=postgres
      - REDIS_URL=redis://redis:6379
    depends_on:
      - postgres
      - redis
    volumes:
      - ./uploads:/app/uploads
    restart: unless-stopped

  postgres:
    image: postgres:15
    environment:
      - POSTGRES_DB=writecarenotes
      - POSTGRES_USER=writecarenotes
      - POSTGRES_PASSWORD=your_secure_password
    volumes:
      - postgres_data:/var/lib/postgresql/data
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

volumes:
  postgres_data:
  redis_data:
EOF
    print_success "Docker Compose configuration created"
}

# Create Dockerfile
create_dockerfile() {
    print_status "Creating Dockerfile..."
    cat > Dockerfile << EOF
FROM node:18-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci --only=production

# Copy source code
COPY . .

# Build the application
RUN npm run build

# Create non-root user
RUN addgroup -g 1001 -S nodejs
RUN adduser -S writecarenotes -u 1001

# Change ownership
RUN chown -R writecarenotes:nodejs /app
USER writecarenotes

# Expose port
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:3000/health || exit 1

# Start the application
CMD ["npm", "start"]
EOF
    print_success "Dockerfile created"
}

# Create Kubernetes manifests
create_kubernetes_manifests() {
    print_status "Creating Kubernetes manifests..."
    
    mkdir -p kubernetes
    
    # Namespace
    cat > kubernetes/namespace.yaml << EOF
apiVersion: v1
kind: Namespace
metadata:
  name: writecarenotes
EOF

    # ConfigMap
    cat > kubernetes/configmap.yaml << EOF
apiVersion: v1
kind: ConfigMap
metadata:
  name: writecarenotes-config
  namespace: writecarenotes
data:
  NODE_ENV: "production"
  PORT: "3000"
  DB_HOST: "postgres-service"
  REDIS_URL: "redis://redis-service:6379"
EOF

    # Secret
    cat > kubernetes/secret.yaml << EOF
apiVersion: v1
kind: Secret
metadata:
  name: writecarenotes-secret
  namespace: writecarenotes
type: Opaque
data:
  DB_PASSWORD: eW91cl9zZWN1cmVfcGFzc3dvcmQ=  # base64 encoded
  JWT_SECRET: eW91ci1zdXBlci1zZWNyZXQtand0LWtleS1jaGFuZ2UtdGhpcy1pbi1wcm9kdWN0aW9u  # base64 encoded
EOF

    # Deployment
    cat > kubernetes/deployment.yaml << EOF
apiVersion: apps/v1
kind: Deployment
metadata:
  name: writecarenotes-app
  namespace: writecarenotes
spec:
  replicas: 3
  selector:
    matchLabels:
      app: writecarenotes
  template:
    metadata:
      labels:
        app: writecarenotes
    spec:
      containers:
      - name: writecarenotes
        image: writecarenotes:latest
        ports:
        - containerPort: 3000
        env:
        - name: NODE_ENV
          valueFrom:
            configMapKeyRef:
              name: writecarenotes-config
              key: NODE_ENV
        - name: PORT
          valueFrom:
            configMapKeyRef:
              name: writecarenotes-config
              key: PORT
        - name: DB_HOST
          valueFrom:
            configMapKeyRef:
              name: writecarenotes-config
              key: DB_HOST
        - name: DB_PASSWORD
          valueFrom:
            secretKeyRef:
              name: writecarenotes-secret
              key: DB_PASSWORD
        - name: JWT_SECRET
          valueFrom:
            secretKeyRef:
              name: writecarenotes-secret
              key: JWT_SECRET
        resources:
          requests:
            memory: "256Mi"
            cpu: "250m"
          limits:
            memory: "512Mi"
            cpu: "500m"
        livenessProbe:
          httpGet:
            path: /health
            port: 3000
          initialDelaySeconds: 30
          periodSeconds: 10
        readinessProbe:
          httpGet:
            path: /health
            port: 3000
          initialDelaySeconds: 5
          periodSeconds: 5
EOF

    # Service
    cat > kubernetes/service.yaml << EOF
apiVersion: v1
kind: Service
metadata:
  name: writecarenotes-service
  namespace: writecarenotes
spec:
  selector:
    app: writecarenotes
  ports:
  - port: 80
    targetPort: 3000
  type: LoadBalancer
EOF

    print_success "Kubernetes manifests created"
}

# Create systemd service file
create_systemd_service() {
    print_status "Creating systemd service file..."
    cat > writecarenotes.service << EOF
[Unit]
Description=WriteCareNotes AI Features
After=network.target

[Service]
Type=simple
User=writecarenotes
WorkingDirectory=/opt/writecarenotes
ExecStart=/usr/bin/node dist/server.js
Restart=always
RestartSec=10
Environment=NODE_ENV=production
Environment=PORT=3000

[Install]
WantedBy=multi-user.target
EOF
    print_success "Systemd service file created"
}

# Create startup script
create_startup_script() {
    print_status "Creating startup script..."
    cat > start.sh << 'EOF'
#!/bin/bash

# WriteCareNotes AI Features Startup Script

echo "🚀 Starting WriteCareNotes AI Features..."

# Check if the application is already running
if pgrep -f "node dist/server.js" > /dev/null; then
    echo "⚠️  Application is already running"
    exit 1
fi

# Start the application
echo "📱 Starting the application..."
node dist/server.js &

# Get the process ID
APP_PID=$!

# Save the PID
echo $APP_PID > writecarenotes.pid

echo "✅ Application started with PID: $APP_PID"
echo "🌐 Application is available at: http://localhost:3000"
echo "📊 Health check: http://localhost:3000/health"

# Wait for the application to start
sleep 5

# Check if the application is running
if kill -0 $APP_PID 2>/dev/null; then
    echo "✅ Application is running successfully"
else
    echo "❌ Application failed to start"
    exit 1
fi
EOF

    chmod +x start.sh
    print_success "Startup script created"
}

# Create stop script
create_stop_script() {
    print_status "Creating stop script..."
    cat > stop.sh << 'EOF'
#!/bin/bash

# WriteCareNotes AI Features Stop Script

echo "🛑 Stopping WriteCareNotes AI Features..."

# Check if PID file exists
if [ -f writecarenotes.pid ]; then
    PID=$(cat writecarenotes.pid)
    
    # Check if the process is running
    if kill -0 $PID 2>/dev/null; then
        echo "🔄 Stopping application (PID: $PID)..."
        kill $PID
        
        # Wait for the process to stop
        sleep 5
        
        # Force kill if still running
        if kill -0 $PID 2>/dev/null; then
            echo "⚠️  Force stopping application..."
            kill -9 $PID
        fi
        
        echo "✅ Application stopped"
    else
        echo "⚠️  Application is not running"
    fi
    
    # Remove PID file
    rm -f writecarenotes.pid
else
    echo "⚠️  PID file not found. Application may not be running."
fi
EOF

    chmod +x stop.sh
    print_success "Stop script created"
}

# Create monitoring script
create_monitoring_script() {
    print_status "Creating monitoring script..."
    cat > monitor.sh << 'EOF'
#!/bin/bash

# WriteCareNotes AI Features Monitoring Script

echo "📊 WriteCareNotes AI Features Status"
echo "=================================="

# Check if the application is running
if pgrep -f "node dist/server.js" > /dev/null; then
    echo "✅ Application Status: RUNNING"
    
    # Get process information
    PID=$(pgrep -f "node dist/server.js")
    echo "🆔 Process ID: $PID"
    
    # Get memory usage
    MEMORY=$(ps -p $PID -o rss= | awk '{print $1/1024 " MB"}')
    echo "💾 Memory Usage: $MEMORY"
    
    # Get CPU usage
    CPU=$(ps -p $PID -o %cpu= | awk '{print $1 "%"}')
    echo "⚡ CPU Usage: $CPU"
    
    # Check health endpoint
    if curl -s http://localhost:3000/health > /dev/null; then
        echo "🏥 Health Check: PASSED"
    else
        echo "❌ Health Check: FAILED"
    fi
    
    # Get uptime
    UPTIME=$(ps -p $PID -o etime= | awk '{print $1}')
    echo "⏱️  Uptime: $UPTIME"
    
else
    echo "❌ Application Status: NOT RUNNING"
fi

echo ""
echo "🔧 System Resources:"
echo "==================="

# System memory
TOTAL_MEM=$(free -h | awk 'NR==2{print $2}')
USED_MEM=$(free -h | awk 'NR==2{print $3}')
echo "💾 Total Memory: $TOTAL_MEM"
echo "💾 Used Memory: $USED_MEM"

# System CPU
CPU_USAGE=$(top -bn1 | grep "Cpu(s)" | awk '{print $2}' | awk -F'%' '{print $1}')
echo "⚡ System CPU Usage: $CPU_USAGE%"

# Disk usage
DISK_USAGE=$(df -h / | awk 'NR==2{print $5}')
echo "💿 Disk Usage: $DISK_USAGE"

echo ""
echo "🌐 Network Status:"
echo "=================="

# Check if port 3000 is listening
if netstat -tlnp | grep :3000 > /dev/null; then
    echo "✅ Port 3000: LISTENING"
else
    echo "❌ Port 3000: NOT LISTENING"
fi

# Check external connectivity
if ping -c 1 google.com > /dev/null 2>&1; then
    echo "✅ Internet Connectivity: OK"
else
    echo "❌ Internet Connectivity: FAILED"
fi
EOF

    chmod +x monitor.sh
    print_success "Monitoring script created"
}

# Main deployment function
main() {
    echo "🏥 WriteCareNotes AI Features Deployment"
    echo "========================================"
    echo ""
    
    # Pre-deployment checks
    check_node
    check_npm
    
    # Install dependencies
    install_dependencies
    
    # Code quality checks
    type_check
    run_lint
    run_tests
    
    # Build application
    build_app
    
    # Create configuration files
    create_env_file
    create_docker_compose
    create_dockerfile
    create_kubernetes_manifests
    create_systemd_service
    create_startup_script
    create_stop_script
    create_monitoring_script
    
    echo ""
    print_success "🎉 Deployment completed successfully!"
    echo ""
    echo "📋 Next Steps:"
    echo "=============="
    echo "1. Update the .env file with your actual configuration values"
    echo "2. Set up your database (PostgreSQL) and Redis"
    echo "3. Run the application:"
    echo "   - For development: npm run dev"
    echo "   - For production: ./start.sh"
    echo "4. Monitor the application: ./monitor.sh"
    echo "5. Stop the application: ./stop.sh"
    echo ""
    echo "🐳 Docker Deployment:"
    echo "===================="
    echo "1. Build the image: docker build -t writecarenotes ."
    echo "2. Run with Docker Compose: docker-compose up -d"
    echo ""
    echo "☸️  Kubernetes Deployment:"
    echo "========================="
    echo "1. Apply manifests: kubectl apply -f kubernetes/"
    echo "2. Check status: kubectl get pods -n writecarenotes"
    echo ""
    echo "🌐 Access the application:"
    echo "========================="
    echo "   - Main Application: http://localhost:3000"
    echo "   - Health Check: http://localhost:3000/health"
    echo "   - API Documentation: http://localhost:3000/api/docs"
    echo ""
    print_success "🚀 WriteCareNotes AI Features is ready to revolutionize care home management!"
}

# Run main function
main "$@"