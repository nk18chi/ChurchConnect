#!/bin/bash
set -e

# Database restore script for ChurchConnect
# Usage: ./restore.sh <backup-file>

if [ -z "$1" ]; then
  echo "Error: Please provide backup file path"
  echo "Usage: ./restore.sh <backup-file.sql.gz>"
  exit 1
fi

BACKUP_FILE=$1

if [ ! -f "$BACKUP_FILE" ]; then
  echo "Error: Backup file not found: $BACKUP_FILE"
  exit 1
fi

if [ -z "$DATABASE_URL" ]; then
  echo "Error: DATABASE_URL environment variable not set"
  exit 1
fi

echo "⚠️  WARNING: This will overwrite the current database!"
echo "Database: $DATABASE_URL"
echo "Backup file: $BACKUP_FILE"
read -p "Continue? (y/N) " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
  echo "Restore cancelled"
  exit 1
fi

echo "Restoring database..."

# Decompress if gzipped
if [[ $BACKUP_FILE == *.gz ]]; then
  gunzip -c "$BACKUP_FILE" | psql "$DATABASE_URL"
else
  psql "$DATABASE_URL" < "$BACKUP_FILE"
fi

echo "✅ Database restored successfully"
