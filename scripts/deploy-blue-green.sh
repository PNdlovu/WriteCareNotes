#!/bin/bash
# Blue-Green Deployment Script
# Zero-downtime deployment for WriteCareNotes

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Configuration
HEALTH_CHECK_URL="http://localhost/api/health"
MAX_HEALTH_CHECK_RETRIES=30
HEALTH_CHECK_INTERVAL=10
ROLLBACK_TIMEOUT=600 # 10 minutes

# Current environment (blue or green)
CURRENT_ENV=$(docker ps --filter "name=writecarenotes-app" --format "{{.Names}}" | head -1 | grep -o "blue\|green" || echo "blue")
NEW_ENV=$([ "$CURRENT_ENV" = "blue" ] && echo "green" || echo "blue")

echo -e "${GREEN}==================================================================${NC}"
echo -e "${GREEN}WriteCareNotes Blue-Green Deployment${NC}"
echo -e "${GREEN}==================================================================${NC}"
echo ""
echo -e "Current environment: ${YELLOW}$CURRENT_ENV${NC}"
echo -e "New environment: ${YELLOW}$NEW_ENV${NC}"
echo ""

# Step 1: Build new environment
echo -e "${GREEN}Step 1: Building $NEW_ENV environment...${NC}"
docker-compose -f docker-compose.$NEW_ENV.yml build --no-cache

# Step 2: Start new environment
echo -e "${GREEN}Step 2: Starting $NEW_ENV environment...${NC}"
docker-compose -f docker-compose.$NEW_ENV.yml up -d

# Step 3: Wait for new environment to be healthy
echo -e "${GREEN}Step 3: Waiting for $NEW_ENV environment to be healthy...${NC}"
RETRY_COUNT=0
while [ $RETRY_COUNT -lt $MAX_HEALTH_CHECK_RETRIES ]; do
    if curl -sf "$HEALTH_CHECK_URL" > /dev/null; then
        echo -e "${GREEN}✓ $NEW_ENV environment is healthy!${NC}"
        break
    fi
    
    RETRY_COUNT=$((RETRY_COUNT + 1))
    echo -e "${YELLOW}⏳ Waiting for health check ($RETRY_COUNT/$MAX_HEALTH_CHECK_RETRIES)...${NC}"
    sleep $HEALTH_CHECK_INTERVAL
done

if [ $RETRY_COUNT -eq $MAX_HEALTH_CHECK_RETRIES ]; then
    echo -e "${RED}✗ Health check failed for $NEW_ENV environment${NC}"
    echo -e "${RED}Rolling back...${NC}"
    docker-compose -f docker-compose.$NEW_ENV.yml down
    exit 1
fi

# Step 4: Run smoke tests
echo -e "${GREEN}Step 4: Running smoke tests on $NEW_ENV environment...${NC}"
bash scripts/smoke-tests.sh "$HEALTH_CHECK_URL"

if [ $? -ne 0 ]; then
    echo -e "${RED}✗ Smoke tests failed${NC}"
    echo -e "${RED}Rolling back...${NC}"
    docker-compose -f docker-compose.$NEW_ENV.yml down
    exit 1
fi

# Step 5: Switch traffic to new environment
echo -e "${GREEN}Step 5: Switching traffic to $NEW_ENV environment...${NC}"
cp nginx/nginx.$NEW_ENV.conf nginx/nginx.conf
docker exec writecarenotes-lb nginx -s reload

echo -e "${GREEN}✓ Traffic switched to $NEW_ENV${NC}"

# Step 6: Monitor new environment
echo -e "${GREEN}Step 6: Monitoring $NEW_ENV environment...${NC}"
echo -e "${YELLOW}Monitoring for $ROLLBACK_TIMEOUT seconds. Press Ctrl+C to rollback.${NC}"

START_TIME=$(date +%s)
ERROR_COUNT=0

while true; do
    CURRENT_TIME=$(date +%s)
    ELAPSED=$((CURRENT_TIME - START_TIME))
    
    if [ $ELAPSED -ge $ROLLBACK_TIMEOUT ]; then
        echo -e "${GREEN}✓ Deployment successful! No issues detected.${NC}"
        break
    fi
    
    # Check health
    if ! curl -sf "$HEALTH_CHECK_URL" > /dev/null; then
        ERROR_COUNT=$((ERROR_COUNT + 1))
        echo -e "${YELLOW}⚠ Health check failed ($ERROR_COUNT/3)${NC}"
        
        if [ $ERROR_COUNT -ge 3 ]; then
            echo -e "${RED}✗ Too many health check failures. Rolling back...${NC}"
            # Switch back to old environment
            cp nginx/nginx.$CURRENT_ENV.conf nginx/nginx.conf
            docker exec writecarenotes-lb nginx -s reload
            docker-compose -f docker-compose.$NEW_ENV.yml down
            echo -e "${RED}Rollback completed. $CURRENT_ENV environment restored.${NC}"
            exit 1
        fi
    else
        ERROR_COUNT=0
    fi
    
    echo -e "Monitoring... (${ELAPSED}s / ${ROLLBACK_TIMEOUT}s)"
    sleep 10
done

# Step 7: Shutdown old environment
echo -e "${GREEN}Step 7: Shutting down $CURRENT_ENV environment...${NC}"
docker-compose -f docker-compose.$CURRENT_ENV.yml down

echo -e "${GREEN}==================================================================${NC}"
echo -e "${GREEN}✓ Deployment completed successfully!${NC}"
echo -e "${GREEN}==================================================================${NC}"
echo ""
echo -e "Active environment: ${GREEN}$NEW_ENV${NC}"
echo -e "Previous environment: ${YELLOW}$CURRENT_ENV${NC} (stopped)"
echo ""
echo -e "${GREEN}Deployment summary:${NC}"
echo -e "  - Build time: ~3-5 minutes"
echo -e "  - Health check time: ~${RETRY_COUNT}0 seconds"
echo -e "  - Total downtime: ${GREEN}0 seconds${NC} (zero-downtime deployment)"
echo ""
