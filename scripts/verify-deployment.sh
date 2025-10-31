#!/bin/sh

echo "🔍 Post-Deployment Verification"
echo "================================"
echo ""

# Color codes
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

CHECKS_PASSED=0
CHECKS_FAILED=0

check_endpoint() {
  name=$1
  url=$2
  expected=$3

  printf "Checking %s... " "$name"

  status=$(curl -s -o /dev/null -w "%{http_code}" "$url" 2>/dev/null || echo "000")

  if [ "$status" = "$expected" ]; then
    printf "${GREEN}✓ OK${NC} (HTTP %s)\n" "$status"
    CHECKS_PASSED=$((CHECKS_PASSED + 1))
    return 0
  else
    printf "${RED}✗ FAIL${NC} (got HTTP %s, expected %s)\n" "$status" "$expected"
    CHECKS_FAILED=$((CHECKS_FAILED + 1))
    return 1
  fi
}

check_database() {
  printf "Checking database connection... "

  if [ -z "$DATABASE_URL" ]; then
    printf "${RED}✗ FAIL${NC} (DATABASE_URL not set)\n"
    CHECKS_FAILED=$((CHECKS_FAILED + 1))
    return 1
  fi

  if psql "$DATABASE_URL" -c "SELECT 1" >/dev/null 2>&1; then
    printf "${GREEN}✓ OK${NC}\n"
    CHECKS_PASSED=$((CHECKS_PASSED + 1))
    return 0
  else
    printf "${RED}✗ FAIL${NC} (connection failed)\n"
    CHECKS_FAILED=$((CHECKS_FAILED + 1))
    return 1
  fi
}

check_api_endpoint() {
  printf "Checking GraphQL API endpoint... "

  if [ -z "$NEXT_PUBLIC_GRAPHQL_URL" ]; then
    printf "${YELLOW}⚠ SKIP${NC} (NEXT_PUBLIC_GRAPHQL_URL not set)\n"
    return 0
  fi

  # GraphQL introspection query
  response=$(curl -s -X POST "$NEXT_PUBLIC_GRAPHQL_URL" \
    -H "Content-Type: application/json" \
    -d '{"query":"{ __typename }"}' 2>/dev/null || echo "")

  if echo "$response" | grep -q "__typename"; then
    printf "${GREEN}✓ OK${NC}\n"
    CHECKS_PASSED=$((CHECKS_PASSED + 1))
    return 0
  else
    printf "${RED}✗ FAIL${NC} (invalid response)\n"
    CHECKS_FAILED=$((CHECKS_FAILED + 1))
    return 1
  fi
}

# Set default URLs if not set (for local testing)
if [ -z "$NEXT_PUBLIC_WEB_URL" ]; then
  echo "${YELLOW}⚠ Warning: Using default localhost URLs${NC}"
  echo ""
  NEXT_PUBLIC_WEB_URL="http://localhost:3000"
  NEXT_PUBLIC_PORTAL_URL="http://localhost:3002"
  NEXT_PUBLIC_ADMIN_URL="http://localhost:3003"
  NEXT_PUBLIC_GRAPHQL_URL="http://localhost:3001/graphql"
fi

echo "1. Checking application accessibility..."
echo ""

# Check all apps
check_endpoint "Web App" "$NEXT_PUBLIC_WEB_URL" "200"
check_endpoint "Church Portal (Login)" "$NEXT_PUBLIC_PORTAL_URL/login" "200"
check_endpoint "Admin Dashboard (Login)" "$NEXT_PUBLIC_ADMIN_URL/login" "200"

echo ""
echo "2. Checking database..."
echo ""

check_database

echo ""
echo "3. Checking API endpoints..."
echo ""

check_api_endpoint

# Check critical API routes
if [ -n "$NEXT_PUBLIC_WEB_URL" ]; then
  printf "Checking API health endpoint... "
  status=$(curl -s -o /dev/null -w "%{http_code}" "$NEXT_PUBLIC_WEB_URL/api/health" 2>/dev/null || echo "000")
  if [ "$status" = "200" ] || [ "$status" = "404" ]; then
    printf "${GREEN}✓ OK${NC}\n"
    CHECKS_PASSED=$((CHECKS_PASSED + 1))
  else
    printf "${YELLOW}⚠ WARN${NC} (got HTTP %s)\n" "$status"
  fi
fi

echo ""
echo "================================"
echo ""

# Summary
TOTAL_CHECKS=$((CHECKS_PASSED + CHECKS_FAILED))

if [ $CHECKS_FAILED -eq 0 ]; then
  printf "${GREEN}✅ All checks passed (%d/%d)${NC}\n" $CHECKS_PASSED $TOTAL_CHECKS
  echo ""
  echo "Deployment verified successfully!"
  echo ""
  echo "Next steps:"
  echo "  1. Test critical user flows (see docs/CRITICAL_PATHS.md)"
  echo "  2. Monitor application logs for errors"
  echo "  3. Check third-party service dashboards (Stripe, Resend, Cloudinary)"
  echo "  4. Set up monitoring alerts (see docs/MONITORING.md)"
  exit 0
else
  printf "${RED}❌ %d check(s) failed (%d/%d passed)${NC}\n" $CHECKS_FAILED $CHECKS_PASSED $TOTAL_CHECKS
  echo ""
  echo "Please investigate failed checks before proceeding."
  exit 1
fi
