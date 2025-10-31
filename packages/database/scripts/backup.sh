#!/bin/bash
set -e

# Database backup script for ChurchConnect
# Usage: ./backup.sh [backup-name]

BACKUP_NAME=${1:-"backup-$(date +%Y%m%d-%H%M%S)"}
BACKUP_DIR="./backups"
BACKUP_FILE="$BACKUP_DIR/$BACKUP_NAME.sql"

# Create backup directory if it doesn't exist
mkdir -p "$BACKUP_DIR"

# Get database URL from environment
if [ -z "$DATABASE_URL" ]; then
  echo "Error: DATABASE_URL environment variable not set"
  exit 1
fi

echo "Creating backup: $BACKUP_FILE"
pg_dump "$DATABASE_URL" > "$BACKUP_FILE"

# Compress backup
gzip "$BACKUP_FILE"
echo "✅ Backup created: $BACKUP_FILE.gz"

# Keep only last 10 backups
ls -t "$BACKUP_DIR"/*.sql.gz | tail -n +11 | xargs rm -f 2>/dev/null || true
echo "✅ Old backups cleaned up"
