#!/bin/sh
set -e

echo "🚀 ChurchConnect Deployment Script"
echo "===================================="
echo ""

# Color codes
RED='\033[0;31m'
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to print step
print_step() {
  printf "${BLUE}▶${NC} %s\n" "$1"
}

print_success() {
  printf "${GREEN}✓${NC} %s\n" "$1"
}

print_error() {
  printf "${RED}✗${NC} %s\n" "$1"
}

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
  print_error "Must be run from repository root"
  exit 1
fi

# Step 1: Install dependencies
print_step "Step 1: Installing dependencies..."
pnpm install --frozen-lockfile
print_success "Dependencies installed"
echo ""

# Step 2: Generate Prisma client
print_step "Step 2: Generating Prisma client..."
cd packages/database || exit 1
npx prisma generate
print_success "Prisma client generated"
cd ../.. || exit 1
echo ""

# Step 3: Run database migrations
print_step "Step 3: Running database migrations..."
if [ -z "$DATABASE_URL" ]; then
  print_error "DATABASE_URL not set"
  exit 1
fi

cd packages/database || exit 1
npx prisma migrate deploy
print_success "Migrations applied"
cd ../.. || exit 1
echo ""

# Step 4: Build all apps
print_step "Step 4: Building all apps..."
pnpm build

if [ $? -eq 0 ]; then
  print_success "All apps built successfully"
else
  print_error "Build failed"
  exit 1
fi
echo ""

# Step 5: Run post-deployment checks
print_step "Step 5: Running post-deployment checks..."

# Check if apps directory exists
if [ -d "apps/web/.next" ] && [ -d "apps/church-portal/.next" ] && [ -d "apps/admin/.next" ]; then
  print_success "All Next.js apps built successfully"
else
  print_error "Some apps failed to build"
  exit 1
fi

# Verify database connection
if psql "$DATABASE_URL" -c "SELECT COUNT(*) FROM \"Church\"" >/dev/null 2>&1; then
  print_success "Database connection verified"
else
  print_error "Database connection failed"
  exit 1
fi

echo ""
print_step "Deployment preparation complete!"
echo ""
printf "${GREEN}✅ Ready to start application servers${NC}\n"
echo ""
echo "Next steps:"
echo "  • For development: pnpm dev"
echo "  • For production: pnpm start (in each app directory)"
echo "  • Verify deployment: ./scripts/verify-deployment.sh"
echo ""
