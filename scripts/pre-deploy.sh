#!/bin/sh
set -e

echo "🔍 Pre-Deployment Checks"
echo "========================"
echo ""

# Color codes for POSIX compatibility
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

ERRORS=0
WARNINGS=0

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
  WARNINGS=$((WARNINGS + 1))
}

# 1. Type checking across all apps
echo "1. Running TypeScript type check across all apps..."
if pnpm type-check >/dev/null 2>&1; then
  check_pass "Type check passed for all apps"
else
  check_fail "Type check failed - run 'pnpm type-check' for details"
fi
echo ""

# 2. Environment validation
echo "2. Validating environment variables..."

required_vars="DATABASE_URL NEXTAUTH_SECRET NEXTAUTH_URL NEXT_PUBLIC_WEB_URL CLOUDINARY_CLOUD_NAME CLOUDINARY_API_KEY CLOUDINARY_API_SECRET RESEND_API_KEY EMAIL_FROM NEXT_PUBLIC_RECAPTCHA_SITE_KEY RECAPTCHA_SECRET_KEY STRIPE_SECRET_KEY NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY STRIPE_WEBHOOK_SECRET"

for var in $required_vars; do
  eval value=\$$var
  if [ -z "$value" ]; then
    check_fail "$var not set"
  else
    check_pass "$var is set"
  fi
done
echo ""

# 3. Database backup reminder
echo "3. Database backup..."
if [ -n "$DATABASE_URL" ]; then
  check_warn "Remember to create a database backup before deployment"
  echo "   Run: cd packages/database && ./scripts/backup.sh pre-deploy-\$(date +%Y%m%d-%H%M%S)"
else
  check_fail "DATABASE_URL not set - cannot connect to database"
fi
echo ""

# 4. Database connection test
echo "4. Testing database connection..."
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

# 5. Migration preview
echo "5. Checking migration status..."
cd packages/database || exit 1
MIGRATION_STATUS=$(npx prisma migrate status 2>&1 || true)
if echo "$MIGRATION_STATUS" | grep -q "up to date"; then
  check_pass "All migrations applied"
elif echo "$MIGRATION_STATUS" | grep -q "pending"; then
  check_warn "Pending migrations found - these will be applied during deployment"
  echo "$MIGRATION_STATUS" | grep "migration"
else
  check_warn "Could not determine migration status"
fi
cd ../.. || exit 1
echo ""

# 6. Build test
echo "6. Testing production build for all apps..."
if pnpm build >/dev/null 2>&1; then
  check_pass "All apps built successfully"
else
  check_fail "Build failed - run 'pnpm build' for details"
fi
echo ""

# Summary
echo "========================"
echo ""
if [ $ERRORS -eq 0 ] && [ $WARNINGS -eq 0 ]; then
  printf "${GREEN}✅ All pre-deployment checks passed! Safe to deploy.${NC}\n"
  exit 0
elif [ $ERRORS -eq 0 ]; then
  printf "${YELLOW}⚠ Pre-deployment checks passed with %d warning(s).${NC}\n" $WARNINGS
  printf "${YELLOW}Review warnings above before deploying.${NC}\n"
  exit 0
else
  printf "${RED}❌ %d check(s) failed, %d warning(s).${NC}\n" $ERRORS $WARNINGS
  printf "${RED}Please fix errors before deploying.${NC}\n"
  exit 1
fi
