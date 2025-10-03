#!/bin/bash

# 🚨 FAKE IMPLEMENTATION DETECTOR
# This script detects placeholder, mock, and fake implementations
# Run before every commit to ensure only real code is included

echo "🔍 SCANNING FOR FAKE IMPLEMENTATIONS..."
echo "=================================================="

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

FAKE_FOUND=0

# 1. Check for placeholder comments
echo "📝 Checking for placeholder comments..."
PLACEHOLDER_COMMENTS=$(grep -r -n "TODO\|FIXME\|placeholder\|Placeholder\|PLACEHOLDER\|mock\|Mock\|MOCK\|temporary\|Temporary\|TEMPORARY\|for now\|For now\|FOR NOW\|this would\|This would\|THIS WOULD\|not implemented\|Not implemented\|NOT IMPLEMENTED\|coming soon\|Coming soon\|COMING SOON" src/ --exclude-dir=__tests__ --exclude-dir=node_modules 2>/dev/null)

if [ ! -z "$PLACEHOLDER_COMMENTS" ]; then
    echo -e "${RED}❌ PLACEHOLDER COMMENTS FOUND:${NC}"
    echo "$PLACEHOLDER_COMMENTS"
    echo ""
    FAKE_FOUND=1
fi

# 2. Check for fake return statements
echo "🔄 Checking for fake return statements..."
FAKE_RETURNS=$(grep -r -n "return.*true.*success\|return.*\[\].*empty\|return.*null.*placeholder\|return.*mock\|return.*fake\|return.*test" src/ --exclude-dir=__tests__ --exclude-dir=node_modules 2>/dev/null)

if [ ! -z "$FAKE_RETURNS" ]; then
    echo -e "${RED}❌ FAKE RETURN STATEMENTS FOUND:${NC}"
    echo "$FAKE_RETURNS"
    echo ""
    FAKE_FOUND=1
fi

# 3. Check for simulation/mock patterns
echo "🎭 Checking for simulation patterns..."
SIMULATION_PATTERNS=$(grep -r -n "simulate\|Simulate\|SIMULATE\|mock.*implementation\|fake.*implementation\|placeholder.*implementation" src/ --exclude-dir=__tests__ --exclude-dir=node_modules 2>/dev/null)

if [ ! -z "$SIMULATION_PATTERNS" ]; then
    echo -e "${RED}❌ SIMULATION PATTERNS FOUND:${NC}"
    echo "$SIMULATION_PATTERNS"
    echo ""
    FAKE_FOUND=1
fi

# 4. Check for hardcoded success responses
echo "✅ Checking for hardcoded success responses..."
HARDCODED_SUCCESS=$(grep -r -n "success.*:.*true\|compliant.*:.*true\|valid.*:.*true" src/ --exclude-dir=__tests__ --exclude-dir=node_modules | grep -v "if\|when\|actual\|real" 2>/dev/null)

if [ ! -z "$HARDCODED_SUCCESS" ]; then
    echo -e "${YELLOW}⚠️  POTENTIAL HARDCODED SUCCESS RESPONSES:${NC}"
    echo "$HARDCODED_SUCCESS"
    echo ""
fi

# 5. Check for empty function bodies
echo "🕳️  Checking for empty function bodies..."
EMPTY_FUNCTIONS=$(grep -r -A 3 "function.*{" src/ --exclude-dir=__tests__ --exclude-dir=node_modules | grep -B 1 "^\s*}$" | grep "function" 2>/dev/null)

if [ ! -z "$EMPTY_FUNCTIONS" ]; then
    echo -e "${RED}❌ EMPTY FUNCTIONS FOUND:${NC}"
    echo "$EMPTY_FUNCTIONS"
    echo ""
    FAKE_FOUND=1
fi

# 6. Check for missing database connections
echo "🗄️  Checking for real database connections..."
DB_CONNECTIONS=$(find src/ -name "*.ts" -exec grep -l "createConnection\|Pool\|Client\|connect.*database\|query.*SELECT\|query.*INSERT\|query.*UPDATE\|query.*DELETE" {} \; 2>/dev/null | wc -l)

if [ $DB_CONNECTIONS -eq 0 ]; then
    echo -e "${RED}❌ NO REAL DATABASE CONNECTIONS FOUND${NC}"
    echo "   Real applications must connect to actual databases"
    echo ""
    FAKE_FOUND=1
fi

# 7. Check for real error handling
echo "⚠️  Checking for real error handling..."
ERROR_HANDLING=$(find src/ -name "*.ts" -exec grep -l "try.*catch\|throw new Error\|catch.*error" {} \; 2>/dev/null | wc -l)

if [ $ERROR_HANDLING -eq 0 ]; then
    echo -e "${YELLOW}⚠️  LIMITED ERROR HANDLING FOUND${NC}"
    echo "   Real applications need comprehensive error handling"
    echo ""
fi

# 8. Check for real validation
echo "🔍 Checking for real validation..."
VALIDATION=$(find src/ -name "*.ts" -exec grep -l "validate\|schema\|joi\|zod\|check.*input\|verify.*data" {} \; 2>/dev/null | wc -l)

if [ $VALIDATION -eq 0 ]; then
    echo -e "${YELLOW}⚠️  LIMITED INPUT VALIDATION FOUND${NC}"
    echo "   Real applications need input validation"
    echo ""
fi

# 9. Check for console.log debugging
echo "🐛 Checking for debug console.log statements..."
DEBUG_LOGS=$(grep -r -n "console\.log\|console\.debug" src/ --exclude-dir=__tests__ --exclude-dir=node_modules 2>/dev/null)

if [ ! -z "$DEBUG_LOGS" ]; then
    echo -e "${YELLOW}⚠️  DEBUG CONSOLE.LOG STATEMENTS FOUND:${NC}"
    echo "$DEBUG_LOGS"
    echo "   Consider using proper logging instead"
    echo ""
fi

# 10. Check for test-only code in production
echo "🧪 Checking for test code in production..."
TEST_CODE=$(grep -r -n "test.*only\|skip.*test\|\.only\|\.skip" src/ --exclude-dir=__tests__ --exclude-dir=node_modules 2>/dev/null)

if [ ! -z "$TEST_CODE" ]; then
    echo -e "${RED}❌ TEST-ONLY CODE FOUND IN PRODUCTION:${NC}"
    echo "$TEST_CODE"
    echo ""
    FAKE_FOUND=1
fi

echo "=================================================="

# Final result
if [ $FAKE_FOUND -eq 1 ]; then
    echo -e "${RED}🚨 FAKE IMPLEMENTATIONS DETECTED!${NC}"
    echo -e "${RED}❌ BUILD FAILED - Remove all fake implementations before continuing${NC}"
    echo ""
    echo "REQUIRED ACTIONS:"
    echo "1. Remove all placeholder comments"
    echo "2. Replace fake return statements with real logic"
    echo "3. Implement actual business functionality"
    echo "4. Add real database operations"
    echo "5. Include comprehensive error handling"
    echo "6. Add input validation"
    echo "7. Test with real data"
    echo ""
    exit 1
else
    echo -e "${GREEN}✅ NO FAKE IMPLEMENTATIONS DETECTED${NC}"
    echo -e "${GREEN}✅ REAL-WORLD APPLICATION VERIFICATION PASSED${NC}"
    echo ""
    echo "VERIFICATION SUMMARY:"
    echo "- No placeholder comments found"
    echo "- No fake return statements found"
    echo "- No simulation patterns found"
    echo "- Database connections present: $DB_CONNECTIONS files"
    echo "- Error handling present: $ERROR_HANDLING files"
    echo "- Input validation present: $VALIDATION files"
    echo ""
    echo -e "${GREEN}🎯 READY FOR PRODUCTION DEPLOYMENT${NC}"
fi