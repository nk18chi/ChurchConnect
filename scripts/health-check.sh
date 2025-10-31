#!/bin/sh

# Health check script for monitoring deployed apps
# Usage: ./health-check.sh

echo "🏥 ChurchConnect Health Check"
echo "=============================="
echo ""

check_endpoint() {
  name=$1
  url=$2
  expected=$3

  printf "Checking %s... " "$name"

  status=$(curl -s -o /dev/null -w "%{http_code}" "$url" 2>/dev/null || echo "000")

  if [ "$status" = "$expected" ]; then
    echo "✓ OK ($status)"
    return 0
  else
    echo "✗ FAIL (got $status, expected $expected)"
    return 1
  fi
}

# Check environment variables are set
if [ -z "$NEXT_PUBLIC_WEB_URL" ] || [ -z "$NEXT_PUBLIC_PORTAL_URL" ] || [ -z "$NEXT_PUBLIC_ADMIN_URL" ] || [ -z "$NEXT_PUBLIC_GRAPHQL_URL" ]; then
  echo "⚠ Warning: App URL environment variables not set"
  echo "Please set NEXT_PUBLIC_WEB_URL, NEXT_PUBLIC_PORTAL_URL, NEXT_PUBLIC_ADMIN_URL, and NEXT_PUBLIC_GRAPHQL_URL"
  echo ""
  echo "Using default values for local development:"
  NEXT_PUBLIC_WEB_URL="${NEXT_PUBLIC_WEB_URL:-http://localhost:3000}"
  NEXT_PUBLIC_PORTAL_URL="${NEXT_PUBLIC_PORTAL_URL:-http://localhost:3002}"
  NEXT_PUBLIC_ADMIN_URL="${NEXT_PUBLIC_ADMIN_URL:-http://localhost:3003}"
  NEXT_PUBLIC_GRAPHQL_URL="${NEXT_PUBLIC_GRAPHQL_URL:-http://localhost:3001/graphql}"
fi

# Check all apps
check_endpoint "Web App" "$NEXT_PUBLIC_WEB_URL" "200"
check_endpoint "Church Portal Login" "$NEXT_PUBLIC_PORTAL_URL/login" "200"
check_endpoint "Admin Dashboard Login" "$NEXT_PUBLIC_ADMIN_URL/login" "200"
check_endpoint "GraphQL API" "$NEXT_PUBLIC_GRAPHQL_URL" "400"  # GraphQL returns 400 for GET without query

echo ""
echo "Health check complete!"
