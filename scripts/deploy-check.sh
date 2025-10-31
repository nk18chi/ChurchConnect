#!/bin/sh
set -e

echo "🔍 ChurchConnect Pre-Deployment Checks"
echo "========================================"
echo ""

# Color codes for POSIX compatibility
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

ERRORS=0

# Function to print status
check_pass() {
  printf "${GREEN}✓${NC} %s\n" "$1"
}

check_fail() {
  printf "${RED}✗${NC} %s\n" "$1"
  ERRORS=$((ERRORS + 1))
}

check_warn() {
  printf "${YELLOW}⚠${NC} %s\n" "$1"
}

# 1. Check Node version
echo "1. Checking Node.js version..."
NODE_VERSION=$(node -v | cut -d 'v' -f 2 | cut -d '.' -f 1)
if [ "$NODE_VERSION" -ge 20 ]; then
  check_pass "Node.js version ${NODE_VERSION}.x (required: >=20)"
else
  check_fail "Node.js version ${NODE_VERSION}.x (required: >=20)"
fi
echo ""

# 2. Check pnpm
echo "2. Checking pnpm..."
if command -v pnpm >/dev/null 2>&1; then
  PNPM_VERSION=$(pnpm -v)
  check_pass "pnpm installed ($PNPM_VERSION)"
else
  check_fail "pnpm not installed"
fi
echo ""

# 3. Check environment variables
echo "3. Checking environment variables..."

required_vars="DATABASE_URL NEXTAUTH_SECRET NEXTAUTH_URL NEXT_PUBLIC_WEB_URL CLOUDINARY_CLOUD_NAME RESEND_API_KEY NEXT_PUBLIC_RECAPTCHA_SITE_KEY STRIPE_SECRET_KEY"

for var in $required_vars; do
  eval value=\$$var
  if [ -z "$value" ]; then
    check_fail "$var not set"
  else
    check_pass "$var is set"
  fi
done
echo ""

# 4. Check database connection
echo "4. Checking database connection..."
if [ -n "$DATABASE_URL" ]; then
  if psql "$DATABASE_URL" -c "SELECT 1" >/dev/null 2>&1; then
    check_pass "Database connection successful"
  else
    check_fail "Database connection failed"
  fi
else
  check_fail "DATABASE_URL not set"
fi
echo ""

# 5. Check migrations
echo "5. Checking database migrations..."
cd packages/database || exit 1
MIGRATION_STATUS=$(npx prisma migrate status 2>&1 || true)
if echo "$MIGRATION_STATUS" | grep -q "up to date"; then
  check_pass "All migrations applied"
elif echo "$MIGRATION_STATUS" | grep -q "pending"; then
  check_fail "Pending migrations found - run 'npx prisma migrate deploy'"
else
  check_warn "Could not determine migration status"
fi
cd ../.. || exit 1
echo ""

# 6. Run type check
echo "6. Running TypeScript type check..."
if pnpm type-check >/dev/null 2>&1; then
  check_pass "Type check passed"
else
  check_fail "Type check failed - run 'pnpm type-check' for details"
fi
echo ""

# 7. Run build test
echo "7. Testing production build..."
if pnpm build >/dev/null 2>&1; then
  check_pass "Build successful"
else
  check_fail "Build failed - run 'pnpm build' for details"
fi
echo ""

# Summary
echo "========================================"
if [ $ERRORS -eq 0 ]; then
  printf "${GREEN}✅ All checks passed! Ready for deployment.${NC}\n"
  exit 0
else
  printf "${RED}❌ %d check(s) failed. Please fix errors before deploying.${NC}\n" $ERRORS
  exit 1
fi
