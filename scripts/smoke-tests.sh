#!/bin/bash
# Smoke Tests for Blue-Green Deployment
# Validates basic functionality after deployment

set -e

BASE_URL=${1:-"http://localhost"}

echo "Running smoke tests against $BASE_URL..."

# Test 1: Health endpoint
echo "Test 1: Health check..."
RESPONSE=$(curl -sf "$BASE_URL/api/health" || echo "FAILED")
if [[ "$RESPONSE" == "FAILED" ]]; then
    echo "✗ Health check failed"
    exit 1
fi
echo "✓ Health check passed"

# Test 2: Detailed health
echo "Test 2: Detailed health check..."
RESPONSE=$(curl -sf "$BASE_URL/api/health/detailed" || echo "FAILED")
if [[ "$RESPONSE" == "FAILED" ]]; then
    echo "✗ Detailed health check failed"
    exit 1
fi
echo "✓ Detailed health check passed"

# Test 3: Database connectivity
echo "Test 3: Database connectivity..."
STATUS=$(echo "$RESPONSE" | jq -r '.checks.database.status')
if [[ "$STATUS" != "healthy" ]]; then
    echo "✗ Database check failed"
    exit 1
fi
echo "✓ Database check passed"

# Test 4: Redis connectivity
echo "Test 4: Redis connectivity..."
STATUS=$(echo "$RESPONSE" | jq -r '.checks.redis.status')
if [[ "$STATUS" != "healthy" ]]; then
    echo "✗ Redis check failed"
    exit 1
fi
echo "✓ Redis check passed"

# Test 5: API response time
echo "Test 5: API response time..."
START=$(date +%s%N)
curl -sf "$BASE_URL/api/health" > /dev/null
END=$(date +%s%N)
DURATION=$(( (END - START) / 1000000 )) # Convert to milliseconds

if [ $DURATION -gt 1000 ]; then
    echo "⚠ API response time is slow: ${DURATION}ms"
else
    echo "✓ API response time OK: ${DURATION}ms"
fi

# Test 6: Metrics endpoint
echo "Test 6: Metrics endpoint..."
RESPONSE=$(curl -sf "$BASE_URL/api/metrics" || echo "FAILED")
if [[ "$RESPONSE" == "FAILED" ]]; then
    echo "✗ Metrics endpoint failed"
    exit 1
fi
echo "✓ Metrics endpoint passed"

echo ""
echo "✓ All smoke tests passed!"
exit 0
