# Database Backup & Restore

## Automated Backups

### Creating a Backup

```bash
cd packages/database
./scripts/backup.sh
```

This creates a compressed backup in `backups/` directory with timestamp.

### Restoring from Backup

```bash
cd packages/database
./scripts/restore.sh backups/backup-20251031-120000.sql.gz
```

⚠️ **Warning:** This will overwrite your current database!

## Manual Backups

### Backup

```bash
pg_dump "$DATABASE_URL" > backup.sql
gzip backup.sql
```

### Restore

```bash
psql "$DATABASE_URL" < backup.sql
```

## Production Backup Strategy

1. **Automated Daily Backups** - Set up cron job or Render scheduled task
2. **Before Migrations** - Always backup before applying migrations
3. **Before Major Changes** - Backup before any risky operations
4. **Retention Policy** - Keep last 10 daily backups, 4 weekly backups

### Render Managed Database Backups

Render provides automatic daily backups for managed PostgreSQL:
- Available in dashboard under "Backups" tab
- Point-in-time recovery available
- Manual snapshots can be triggered

## Automated Backup Setup

### Using Cron (Linux/macOS)

Add to crontab for daily backups at 2 AM:

```bash
# Edit crontab
crontab -e

# Add this line (adjust path to your installation)
0 2 * * * cd /path/to/churchconnect/packages/database && ./scripts/backup.sh daily-backup >> /var/log/churchconnect-backup.log 2>&1
```

### Using Render Scheduled Job

1. Create a new Cron Job in Render dashboard
2. Set schedule: `0 2 * * *` (daily at 2 AM)
3. Command: `cd packages/database && ./scripts/backup.sh`
4. Set environment variable: `DATABASE_URL`

### Weekly Backup Retention

To keep weekly backups longer, create a separate cron job:

```bash
# Every Sunday at 3 AM, copy latest daily backup to weekly folder
0 3 * * 0 cp packages/database/backups/backup-$(date +\%Y\%m\%d-*)*.sql.gz packages/database/backups/weekly/weekly-$(date +\%Y\%m\%d).sql.gz
```

Clean up old weekly backups:

```bash
# Keep only last 4 weekly backups
find packages/database/backups/weekly/*.sql.gz -type f -mtime +28 -delete
```

## Testing Backups

Regularly test backup restoration:

```bash
# 1. Create test database
createdb churchconnect_test

# 2. Restore backup to test database
DATABASE_URL="postgresql://localhost/churchconnect_test" ./scripts/restore.sh backups/latest.sql.gz

# 3. Verify data
psql churchconnect_test -c "SELECT COUNT(*) FROM \"Church\";"

# 4. Clean up
dropdb churchconnect_test
```

## Backup Before Migrations

Always create a backup before applying migrations:

```bash
# 1. Create pre-migration backup
cd packages/database
./scripts/backup.sh pre-migration-$(date +%Y%m%d)

# 2. Apply migrations
npx prisma migrate deploy

# 3. Verify migration success
npx prisma migrate status

# If migration fails, restore from backup
# ./scripts/restore.sh backups/pre-migration-20251031.sql.gz
```

## Disaster Recovery

### Complete Database Loss

If the production database is completely lost:

1. **Restore from most recent backup:**
   ```bash
   DATABASE_URL="your-new-database-url" ./scripts/restore.sh backups/backup-20251031-120000.sql.gz
   ```

2. **Apply any migrations that occurred after the backup:**
   ```bash
   cd packages/database
   npx prisma migrate deploy
   ```

3. **Verify data integrity:**
   ```bash
   psql "$DATABASE_URL" -c "SELECT COUNT(*) FROM \"Church\";"
   psql "$DATABASE_URL" -c "SELECT COUNT(*) FROM \"User\";"
   ```

4. **Regenerate search vectors if needed:**
   ```bash
   psql "$DATABASE_URL" -c "UPDATE \"Church\" SET \"updatedAt\" = NOW();"
   ```

### Partial Data Loss

If specific data is corrupted but database is functional:

1. **Create current state backup:**
   ```bash
   ./scripts/backup.sh current-state-before-restore
   ```

2. **Restore to temporary database:**
   ```bash
   createdb churchconnect_recovery
   DATABASE_URL="postgresql://localhost/churchconnect_recovery" ./scripts/restore.sh backups/backup-20251031-120000.sql.gz
   ```

3. **Extract needed data:**
   ```bash
   # Export specific table data
   psql churchconnect_recovery -c "COPY \"Church\" TO '/tmp/churches.csv' CSV HEADER;"
   ```

4. **Import to production:**
   ```bash
   psql "$DATABASE_URL" -c "COPY \"Church\" FROM '/tmp/churches.csv' CSV HEADER;"
   ```

5. **Clean up:**
   ```bash
   dropdb churchconnect_recovery
   rm /tmp/churches.csv
   ```

## Backup Troubleshooting

### Issue: "pg_dump: command not found"

**Solution:** Install PostgreSQL client tools:

```bash
# macOS
brew install postgresql@14

# Ubuntu/Debian
sudo apt-get install postgresql-client-14

# Verify installation
pg_dump --version
```

### Issue: "connection refused"

**Solution:** Check DATABASE_URL is correct and database is accessible:

```bash
# Test connection
psql "$DATABASE_URL" -c "SELECT 1;"

# Check if DATABASE_URL is set
echo $DATABASE_URL
```

### Issue: "disk full" during backup

**Solution:**

1. Check available disk space:
   ```bash
   df -h
   ```

2. Clean up old backups manually:
   ```bash
   rm packages/database/backups/backup-2024*.sql.gz
   ```

3. Backup to external location:
   ```bash
   BACKUP_DIR="/external/drive/backups" ./scripts/backup.sh
   ```

### Issue: Backup file is empty or very small

**Solution:**

1. Check database has data:
   ```bash
   psql "$DATABASE_URL" -c "SELECT COUNT(*) FROM \"Church\";"
   ```

2. Run pg_dump with verbose flag:
   ```bash
   pg_dump "$DATABASE_URL" --verbose > test-backup.sql
   ```

3. Check for permissions issues:
   ```bash
   ls -la packages/database/backups/
   ```

## Best Practices

1. **Test backups regularly** - Schedule monthly restore tests
2. **Store backups off-site** - Use cloud storage (S3, Google Cloud Storage)
3. **Monitor backup jobs** - Set up alerts for failed backups
4. **Document restore procedures** - Keep this guide updated
5. **Encrypt sensitive backups** - Use gpg for production backups:
   ```bash
   pg_dump "$DATABASE_URL" | gzip | gpg -c > backup.sql.gz.gpg
   ```
6. **Version control migrations** - Always commit migration files to git
7. **Backup before deployments** - Include in deployment checklist

## Backup Monitoring

### Check Recent Backups

```bash
# List recent backups
ls -lht packages/database/backups/ | head -10

# Check backup sizes
du -h packages/database/backups/*.sql.gz
```

### Verify Backup Integrity

```bash
# Test that backup file is valid gzip
gunzip -t backups/backup-20251031-120000.sql.gz

# Check SQL is valid (first 10 lines)
gunzip -c backups/backup-20251031-120000.sql.gz | head -10
```

### Backup Size Trends

Monitor backup size over time to detect issues:

```bash
# Show backup sizes over time
ls -lh backups/*.sql.gz | awk '{print $5, $9}' | sort
```

Sudden size changes may indicate:
- Data corruption
- Missing tables
- Backup script issues
- Database growth/shrinkage

## Emergency Contacts

If you need help with backup/restore:

- **Database Issues:** Check `docs/TROUBLESHOOTING.md`
- **Platform Support:** admin@churchconnect.jp
- **Render Support:** https://render.com/support
