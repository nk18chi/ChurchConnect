# Maintenance Guide

This guide provides comprehensive maintenance procedures for ChurchConnect, including routine tasks, database maintenance, log rotation, certificate management, dependency updates, and performance monitoring.

## Table of Contents

- [Routine Maintenance Tasks](#routine-maintenance-tasks)
- [Database Maintenance](#database-maintenance)
- [Log Management](#log-management)
- [Certificate Renewal](#certificate-renewal)
- [Dependency Updates](#dependency-updates)
- [Performance Monitoring](#performance-monitoring)
- [Maintenance Schedules](#maintenance-schedules)

---

## Routine Maintenance Tasks

### Daily Maintenance (5-10 minutes)

**1. Health Check**
```bash
./scripts/health-check.sh
```

**2. Backup Verification**
```bash
# Check latest backup exists
ls -lh packages/database/backups/ | head -n 5

# Verify backup size (should be consistent)
du -h packages/database/backups/backup-$(date +%Y%m%d)*.sql.gz
```

**3. Error Review**
- Login to Sentry
- Review new errors (last 24 hours)
- Prioritize by frequency and affected users
- Create tickets for recurring errors

**4. Service Health**
- Check Render dashboard (all services green)
- Review CPU/Memory usage
- Check response times
- Verify no alerts triggered

**5. Quick Metrics Check**
```sql
-- Run these queries in database
-- Daily active users (yesterday)
SELECT COUNT(DISTINCT "userId")
FROM "ChurchAnalytics"
WHERE "viewedAt" >= CURRENT_DATE - INTERVAL '1 day'
  AND "viewedAt" < CURRENT_DATE;

-- Churches added (yesterday)
SELECT COUNT(*)
FROM "Church"
WHERE "createdAt" >= CURRENT_DATE - INTERVAL '1 day'
  AND "createdAt" < CURRENT_DATE;

-- Platform donations (yesterday)
SELECT COUNT(*), SUM(amount)
FROM "PlatformDonation"
WHERE "createdAt" >= CURRENT_DATE - INTERVAL '1 day'
  AND "createdAt" < CURRENT_DATE
  AND status = 'succeeded';
```

### Weekly Maintenance (30-60 minutes)

**1. Database Health Check**
```sql
-- Connection count
SELECT count(*) as connections,
       (SELECT setting::int FROM pg_settings WHERE name='max_connections') as max_conn
FROM pg_stat_activity;

-- Database size
SELECT pg_size_pretty(pg_database_size(current_database()));

-- Table sizes
SELECT
  schemaname,
  tablename,
  pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) AS size
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC
LIMIT 10;

-- Cache hit ratio (should be >95%)
SELECT
  sum(blks_hit) / NULLIF(sum(blks_hit) + sum(blks_read), 0) * 100 AS cache_hit_ratio
FROM pg_stat_database;
```

**2. Slow Query Review**
```sql
-- Requires pg_stat_statements extension
SELECT
  query,
  calls,
  total_exec_time / 1000 / 60 AS total_minutes,
  mean_exec_time / 1000 AS mean_seconds,
  max_exec_time / 1000 AS max_seconds
FROM pg_stat_statements
ORDER BY mean_exec_time DESC
LIMIT 20;
```

**3. Dependency Security Check**
```bash
cd /path/to/churchconnect

# Check for vulnerabilities
pnpm audit

# List outdated packages
pnpm outdated

# Update patch versions (safe)
pnpm update --latest --filter "@repo/*"
```

**4. Backup Cleanup**
```bash
# Keep last 10 backups, remove older ones
cd packages/database/backups
ls -t *.sql.gz | tail -n +11 | xargs rm -f
```

**5. Service Usage Review**
- **Cloudinary:** Check bandwidth/storage usage
- **Resend:** Check email quota usage
- **Stripe:** Review transaction volume
- **Render:** Review instance usage and costs

**6. Content Moderation**
- Review pending reviews (should be <5 pending)
- Review flagged content
- Verify church verification requests
- Check for spam submissions

### Monthly Maintenance (2-3 hours)

**1. Database Maintenance**
```sql
-- Vacuum and analyze all tables
VACUUM ANALYZE;

-- Check for table bloat
SELECT
  schemaname,
  tablename,
  pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) AS total_size,
  pg_size_pretty(pg_relation_size(schemaname||'.'||tablename)) AS table_size,
  pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename) -
                 pg_relation_size(schemaname||'.'||tablename)) AS index_size
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;

-- Check for unused indexes
SELECT
  schemaname,
  tablename,
  indexname,
  idx_scan,
  pg_size_pretty(pg_relation_size(indexrelid)) AS index_size
FROM pg_stat_user_indexes
WHERE idx_scan = 0
  AND indexname NOT LIKE '%_pkey%'
ORDER BY pg_relation_size(indexrelid) DESC;
```

**2. Performance Review**
- Analyze page load times (Lighthouse reports)
- Review database query performance
- Check CDN cache hit rates
- Identify optimization opportunities

**3. Security Review**
```bash
# Check for security vulnerabilities
pnpm audit

# Review access logs for suspicious activity
# Check failed login attempts
# Review API usage patterns
```

**4. Dependency Updates**
```bash
# Update all dependencies (test in dev first!)
pnpm update --latest

# Run tests
pnpm test

# Type check
pnpm type-check

# Build
pnpm build
```

**5. Backup Testing**
```bash
# Test restore process monthly
# 1. Create test database
createdb churchconnect_test

# 2. Restore latest backup
DATABASE_URL="postgresql://localhost/churchconnect_test" \
  packages/database/scripts/restore.sh \
  packages/database/backups/backup-latest.sql.gz

# 3. Verify data
psql churchconnect_test -c "SELECT COUNT(*) FROM \"Church\";"
psql churchconnect_test -c "SELECT COUNT(*) FROM \"User\";"

# 4. Clean up
dropdb churchconnect_test
```

**6. Monitoring and Alerts Review**
- Review Sentry error trends
- Adjust alert thresholds if needed
- Update incident response procedures
- Review and improve runbooks

**7. Documentation Updates**
- Update any changed procedures
- Add new troubleshooting guides
- Update environment variables documentation
- Review and update user guides

### Quarterly Maintenance (4-8 hours)

**1. Major Dependency Updates**
```bash
# Update Next.js
pnpm update next@latest react@latest react-dom@latest

# Update Prisma
pnpm update @prisma/client@latest prisma@latest

# Update other major dependencies
pnpm update --latest

# Test thoroughly in staging
pnpm test
pnpm build
```

**2. Security Audit**
- Review authentication implementation
- Check authorization logic
- Verify input validation
- Test for common vulnerabilities
- Update security documentation

**3. Performance Optimization**
- Database query optimization
- Index optimization
- Code profiling and optimization
- Bundle size reduction
- Image optimization review

**4. Secret Rotation**
```bash
# Rotate long-lived secrets
# 1. Generate new secrets
openssl rand -base64 32  # NEXTAUTH_SECRET

# 2. Update in Render environment variables
# 3. Deploy all services
# 4. Verify services working
# 5. Document rotation in security log
```

**5. Backup Strategy Review**
- Verify all backups completing successfully
- Test restore process
- Review retention policy
- Ensure offsite backups configured
- Document any changes

**6. Cost Optimization**
- Review Render usage and costs
- Optimize database queries
- Review Cloudinary usage
- Consider plan upgrades/downgrades
- Identify unused resources

**7. User Feedback Review**
- Review user support tickets
- Identify common issues
- Prioritize feature requests
- Update user documentation
- Plan improvements

### Annual Maintenance (1-2 days)

**1. Comprehensive Security Audit**
- Third-party security assessment
- Penetration testing
- Code security review
- Infrastructure review
- Update security policies

**2. Architecture Review**
- Evaluate current architecture
- Identify technical debt
- Plan major improvements
- Consider new technologies
- Document architecture decisions

**3. Disaster Recovery Testing**
- Full disaster recovery drill
- Test backup restoration
- Verify incident response procedures
- Update disaster recovery plan
- Train team on procedures

**4. Compliance Review**
- Review GDPR compliance
- Update privacy policy
- Review terms of service
- Check PCI DSS requirements
- Update cookie policy

**5. Documentation Overhaul**
- Review all documentation
- Update outdated procedures
- Add new guides as needed
- Improve clarity and completeness
- Get team feedback

**6. Performance Baseline**
- Comprehensive performance testing
- Establish performance baselines
- Set performance goals
- Document optimization opportunities
- Create performance improvement plan

---

## Database Maintenance

### Vacuum and Analyze

**Purpose:**
- Reclaim storage occupied by dead tuples
- Update query planner statistics
- Prevent transaction ID wraparound

**Automatic Vacuuming:**
PostgreSQL has autovacuum enabled by default. Monitor it:

```sql
-- Check autovacuum status
SELECT
  schemaname,
  relname,
  last_vacuum,
  last_autovacuum,
  last_analyze,
  last_autoanalyze,
  n_tup_ins,
  n_tup_upd,
  n_tup_del
FROM pg_stat_user_tables
ORDER BY last_autovacuum DESC NULLS LAST;
```

**Manual Vacuum:**
```sql
-- Vacuum specific table
VACUUM ANALYZE "Church";

-- Vacuum all tables
VACUUM ANALYZE;

-- Full vacuum (locks table, use with caution)
VACUUM FULL ANALYZE "Church";
```

**When to Run Manual Vacuum:**
- After large data deletions
- Before major queries or reports
- If autovacuum isn't keeping up
- During maintenance windows

### Index Maintenance

**Check Index Health:**
```sql
-- Index usage statistics
SELECT
  schemaname,
  tablename,
  indexname,
  idx_scan AS index_scans,
  idx_tup_read AS tuples_read,
  idx_tup_fetch AS tuples_fetched,
  pg_size_pretty(pg_relation_size(indexrelid)) AS index_size
FROM pg_stat_user_indexes
ORDER BY idx_scan DESC;

-- Unused indexes (candidates for removal)
SELECT
  schemaname,
  tablename,
  indexname,
  pg_size_pretty(pg_relation_size(indexrelid)) AS index_size
FROM pg_stat_user_indexes
WHERE idx_scan = 0
  AND indexname NOT LIKE '%_pkey%'
ORDER BY pg_relation_size(indexrelid) DESC;

-- Index bloat (simplified check)
SELECT
  schemaname,
  tablename,
  indexname,
  pg_size_pretty(pg_relation_size(indexrelid)) AS index_size
FROM pg_stat_user_indexes
WHERE idx_scan > 0
ORDER BY pg_relation_size(indexrelid) DESC;
```

**Rebuild Bloated Indexes:**
```sql
-- Rebuild specific index
REINDEX INDEX idx_church_search;

-- Rebuild all indexes on table
REINDEX TABLE "Church";

-- Rebuild concurrently (doesn't lock table, PostgreSQL 12+)
REINDEX INDEX CONCURRENTLY idx_church_search;
```

**Add Missing Indexes:**
```sql
-- Analyze missing indexes
SELECT
  schemaname,
  tablename,
  attname,
  n_distinct,
  correlation
FROM pg_stats
WHERE schemaname = 'public'
ORDER BY n_distinct DESC;

-- Example: Add index for common filter
CREATE INDEX CONCURRENTLY idx_church_prefecture
  ON "Church"("prefectureId")
  WHERE "isPublished" = true AND "isDeleted" = false;
```

### Query Performance Optimization

**Enable Query Logging:**
```sql
-- Log slow queries (>500ms)
ALTER DATABASE churchconnect SET log_min_duration_statement = 500;

-- Reset
ALTER DATABASE churchconnect RESET log_min_duration_statement;
```

**Analyze Query Plans:**
```sql
-- Explain query
EXPLAIN ANALYZE
SELECT * FROM "Church"
WHERE "prefectureId" = 13
  AND "isPublished" = true
ORDER BY name;

-- Look for:
-- - Sequential scans on large tables (bad)
-- - Index scans (good)
-- - High execution time
-- - High row estimates vs actual
```

**Common Optimizations:**

**1. Add Indexes:**
```sql
CREATE INDEX CONCURRENTLY idx_church_prefecture_published
  ON "Church"("prefectureId", "isPublished")
  WHERE "isDeleted" = false;
```

**2. Use Partial Indexes:**
```sql
-- Only index published churches
CREATE INDEX CONCURRENTLY idx_church_published
  ON "Church"("isPublished")
  WHERE "isPublished" = true AND "isDeleted" = false;
```

**3. Optimize N+1 Queries:**
```typescript
// Bad - N+1 query
const churches = await prisma.church.findMany()
for (const church of churches) {
  const staff = await prisma.staff.findMany({
    where: { churchId: church.id }
  })
}

// Good - Single query
const churches = await prisma.church.findMany({
  include: {
    staff: true
  }
})
```

**4. Use Select to Limit Fields:**
```typescript
// Only fetch needed fields
const churches = await prisma.church.findMany({
  select: {
    id: true,
    name: true,
    city: true,
    prefecture: true
  }
})
```

### Connection Pool Management

**Monitor Connections:**
```sql
-- Current active connections
SELECT count(*) FROM pg_stat_activity WHERE state = 'active';

-- All connections by state
SELECT state, count(*) FROM pg_stat_activity GROUP BY state;

-- Long-running queries
SELECT
  pid,
  now() - pg_stat_activity.query_start AS duration,
  query,
  state
FROM pg_stat_activity
WHERE state != 'idle'
  AND now() - pg_stat_activity.query_start > interval '5 minutes'
ORDER BY duration DESC;
```

**Kill Long-Running Queries:**
```sql
-- Kill specific query
SELECT pg_cancel_backend(pid);  -- Graceful
SELECT pg_terminate_backend(pid);  -- Force kill

-- Kill all idle connections
SELECT pg_terminate_backend(pid)
FROM pg_stat_activity
WHERE state = 'idle'
  AND state_change < current_timestamp - INTERVAL '30 minutes';
```

**Connection Pool Configuration:**

Prisma connection pool:
```typescript
// packages/database/src/client.ts
const prisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DATABASE_URL_POOLED || process.env.DATABASE_URL,
    },
  },
  // Optional: configure pool
  // pool: {
  //   timeout: 20,
  //   min: 2,
  //   max: 10,
  // },
})
```

### Data Cleanup

**Remove Old Soft-Deleted Records:**
```sql
-- Check soft-deleted records older than 90 days
SELECT COUNT(*) FROM "User" WHERE "deletedAt" < NOW() - INTERVAL '90 days';

-- Permanently delete old soft-deleted records
DELETE FROM "User" WHERE "deletedAt" < NOW() - INTERVAL '90 days';
```

**Clean Up Old Analytics:**
```sql
-- Keep only last 365 days of analytics
DELETE FROM "ChurchAnalytics"
WHERE "viewedAt" < NOW() - INTERVAL '365 days';
```

**Archive Old Data:**
```sql
-- Move old data to archive table (if needed)
CREATE TABLE "Review_Archive" (LIKE "Review" INCLUDING ALL);

INSERT INTO "Review_Archive"
SELECT * FROM "Review"
WHERE "createdAt" < NOW() - INTERVAL '2 years';

DELETE FROM "Review"
WHERE "createdAt" < NOW() - INTERVAL '2 years';
```

---

## Log Management

### Application Logs

**Render Logs:**
- Automatically rotated by Render
- Accessible via dashboard
- Retained for 7 days on free tier
- Longer retention on paid tiers

**Download Logs:**
```bash
# Using Render CLI
render logs -s <service-id> --tail

# Save to file
render logs -s <service-id> > logs-$(date +%Y%m%d).txt
```

### Database Logs

**Enable Query Logging:**
```sql
-- In Render database settings or postgresql.conf
log_min_duration_statement = 500  # Log queries > 500ms
log_statement = 'all'  # Log all statements (verbose!)
log_duration = on  # Log duration of each statement
```

**View Logs:**
- Access via Render database dashboard
- Download for analysis
- Set up log aggregation (e.g., Datadog, Logtail)

### Error Logs (Sentry)

**Log Retention:**
- Sentry free tier: 30 days
- Paid tiers: Custom retention

**Regular Review:**
- Review daily for critical errors
- Weekly trends analysis
- Monthly error rate review
- Quarterly error pattern analysis

**Log Management:**
```bash
# Archive errors before they expire
# Export from Sentry dashboard or API
curl -X GET \
  'https://sentry.io/api/0/projects/org/project/issues/' \
  -H "Authorization: Bearer YOUR_TOKEN" \
  > sentry-export-$(date +%Y%m%d).json
```

### Log Rotation Strategy

**Backup Logs:**
- Rotate backups (keep last 10 daily)
- Archive important logs offsite
- Compress old logs (gzip)

**Scheduled Cleanup:**
```bash
# Add to crontab
# Clean up old backup logs weekly
0 0 * * 0 find /path/to/churchconnect/packages/database/backups -name "*.sql.gz" -mtime +90 -delete

# Clean up application logs monthly
0 0 1 * * find /path/to/logs -name "*.log" -mtime +30 -delete
```

---

## Certificate Renewal

### HTTPS Certificates

**Render Automatic SSL:**
- Render automatically manages SSL certificates
- Uses Let's Encrypt
- Auto-renewal every 90 days
- No manual intervention needed

**Verify Certificate:**
```bash
# Check certificate expiration
openssl s_client -connect churchconnect.jp:443 -servername churchconnect.jp < /dev/null 2>/dev/null | openssl x509 -noout -dates

# Should show:
# notBefore: [date]
# notAfter: [date]  # Should be >30 days in future
```

**Certificate Issues:**
If certificate not renewing:
1. Check DNS records (must point to Render)
2. Check Render dashboard for errors
3. Verify domain ownership
4. Contact Render support

### Custom Domain Setup

**Add Custom Domain in Render:**
1. Go to service settings
2. Add custom domain
3. Add DNS records:
   - A record: `@` → Render IP
   - CNAME record: `www` → `your-app.onrender.com`
4. Wait for DNS propagation (up to 48 hours)
5. SSL certificate auto-provisions

---

## Dependency Updates

### Regular Update Schedule

**Patch Updates (Weekly):**
```bash
# Safe updates (bug fixes only)
pnpm update

# Check for outdated packages
pnpm outdated
```

**Minor Updates (Monthly):**
```bash
# Update minor versions
pnpm update --latest --filter "@repo/*"

# Test in development
pnpm dev

# Run type check
pnpm type-check

# Build
pnpm build
```

**Major Updates (Quarterly):**
```bash
# Update major versions (breaking changes possible)
pnpm update next@latest
pnpm update @prisma/client@latest
pnpm update react@latest react-dom@latest

# Review changelogs
# Test thoroughly
# Update code for breaking changes
```

### Security Updates

**Immediate Response:**
```bash
# Check for vulnerabilities
pnpm audit

# Fix automatically if possible
pnpm audit fix

# For critical vulnerabilities:
# 1. Update affected package immediately
# 2. Test in staging
# 3. Deploy to production ASAP
# 4. Document in security log
```

**Monitor Security Advisories:**
- GitHub Security Advisories
- npm Security Advisories
- Snyk vulnerability database
- Dependabot alerts (if enabled)

### Update Process

**1. Create Update Branch:**
```bash
git checkout -b deps/update-$(date +%Y%m%d)
```

**2. Update Dependencies:**
```bash
pnpm update --latest
```

**3. Review Changes:**
```bash
git diff package.json
git diff pnpm-lock.yaml
```

**4. Test Locally:**
```bash
pnpm install
pnpm type-check
pnpm build
pnpm dev  # Manual testing
```

**5. Commit and Push:**
```bash
git add .
git commit -m "chore(deps): update dependencies"
git push origin deps/update-$(date +%Y%m%d)
```

**6. Deploy to Staging:**
- Test all critical paths
- Check for regressions
- Monitor for errors

**7. Deploy to Production:**
- Create pull request
- Review and merge
- Monitor for 24 hours

### Dependency Health Check

**Check Package Health:**
```bash
# Check for deprecated packages
pnpm outdated

# Check package bundle size
pnpm dlx bundle-phobia <package-name>

# Check package security
pnpm audit

# Check for unused dependencies
pnpm dlx depcheck
```

---

## Performance Monitoring

### Key Metrics to Monitor

**Application Performance:**
- Response time (p50, p95, p99)
- Throughput (requests/second)
- Error rate (%)
- CPU usage (%)
- Memory usage (%)

**Database Performance:**
- Query latency (ms)
- Connection count
- Cache hit ratio (%)
- Slow queries (>500ms)
- Table sizes

**User Experience:**
- Page load time (seconds)
- First Contentful Paint (ms)
- Time to Interactive (ms)
- Cumulative Layout Shift
- Largest Contentful Paint (ms)

### Performance Testing

**Lighthouse Audits:**
```bash
# Run Lighthouse on key pages
npx lighthouse https://churchconnect.jp --output html --output-path ./lighthouse-report.html

# Focus on:
# - Performance score (>90)
# - Accessibility score (>90)
# - Best Practices score (>90)
# - SEO score (>90)
```

**Load Testing (Optional):**
```bash
# Using Apache Bench
ab -n 1000 -c 10 https://churchconnect.jp/

# Using k6 (more advanced)
k6 run load-test.js
```

### Performance Baselines

**Establish Baselines:**
Document current performance metrics:

```
Performance Baselines (as of 2025-10-31):

Homepage:
- Load time: 2.1s
- First Contentful Paint: 800ms
- Time to Interactive: 2.3s
- Lighthouse score: 92

Church Profile:
- Load time: 1.8s
- First Contentful Paint: 700ms
- Time to Interactive: 2.0s
- Lighthouse score: 94

Search Results:
- Load time: 2.5s
- First Contentful Paint: 900ms
- Time to Interactive: 2.8s
- Lighthouse score: 89

Database:
- Average query time: 45ms
- Slow queries (>500ms): 2/day
- Cache hit ratio: 96.5%
- Connection count: 15-25 (max 100)
```

**Monitor Trends:**
- Track metrics weekly
- Alert on regressions (>20% slower)
- Celebrate improvements
- Document optimization efforts

### Performance Optimization

**Database Optimization:**
- Add indexes for common queries
- Optimize N+1 queries
- Use connection pooling
- Enable query caching

**Frontend Optimization:**
- Code splitting
- Image optimization
- Lazy loading
- Bundle size reduction
- CDN usage

**Backend Optimization:**
- API response caching
- Database query optimization
- Efficient data serialization
- Background job processing

---

## Maintenance Schedules

### Daily Schedule

**Time:** 9:00 AM JST (30 minutes)

- [ ] Run health check script
- [ ] Review Sentry errors
- [ ] Check service status
- [ ] Verify backup completed
- [ ] Quick metrics review

### Weekly Schedule

**Time:** Monday 10:00 AM JST (1 hour)

- [ ] Database health check
- [ ] Slow query review
- [ ] Dependency security check
- [ ] Backup cleanup
- [ ] Service usage review
- [ ] Content moderation

### Monthly Schedule

**Time:** First Monday of month, 10:00 AM JST (3 hours)

- [ ] Database maintenance (VACUUM ANALYZE)
- [ ] Performance review
- [ ] Security review
- [ ] Dependency updates
- [ ] Backup testing
- [ ] Monitoring and alerts review
- [ ] Documentation updates

### Quarterly Schedule

**Time:** First week of quarter (1-2 days)

- [ ] Major dependency updates
- [ ] Comprehensive security audit
- [ ] Performance optimization
- [ ] Secret rotation
- [ ] Backup strategy review
- [ ] Cost optimization
- [ ] User feedback review

### Annual Schedule

**Time:** January (1-2 days)

- [ ] Comprehensive security audit
- [ ] Architecture review
- [ ] Disaster recovery testing
- [ ] Compliance review
- [ ] Documentation overhaul
- [ ] Performance baseline

---

## Maintenance Tools

### Automated Tools

**Scheduled Jobs (Render Cron Jobs):**
```yaml
# Add to render.yaml
services:
  - type: cron
    name: daily-backup
    schedule: "0 2 * * *"  # 2 AM JST
    command: "cd packages/database && ./scripts/backup.sh daily-$(date +%Y%m%d)"

  - type: cron
    name: weekly-vacuum
    schedule: "0 3 * * 0"  # 3 AM Sunday JST
    command: "psql $DATABASE_URL -c 'VACUUM ANALYZE;'"
```

**Monitoring Scripts:**
Create `scripts/maintenance-check.sh`:
```bash
#!/bin/bash
# Comprehensive maintenance check script

echo "=== ChurchConnect Maintenance Check ==="
echo "Date: $(date)"
echo ""

# Check database size
echo "Database size:"
psql "$DATABASE_URL" -c "SELECT pg_size_pretty(pg_database_size(current_database()));"

# Check connections
echo ""
echo "Active connections:"
psql "$DATABASE_URL" -c "SELECT count(*) FROM pg_stat_activity;"

# Check slow queries
echo ""
echo "Slow queries (last 7 days):"
psql "$DATABASE_URL" -c "SELECT count(*) FROM pg_stat_statements WHERE mean_exec_time > 500;"

# Check backup
echo ""
echo "Latest backup:"
ls -lh packages/database/backups/ | head -n 2

echo ""
echo "=== Maintenance Check Complete ==="
```

### Manual Tools

**Database Administration:**
- pgAdmin (GUI tool)
- psql (command-line)
- Render database dashboard

**Monitoring:**
- Render metrics dashboard
- Sentry error tracking
- Cloudinary usage dashboard
- Resend email analytics
- Stripe payment dashboard

---

## Maintenance Checklist Templates

### Pre-Deployment Maintenance

- [ ] Create database backup
- [ ] Review recent changes
- [ ] Check for pending migrations
- [ ] Run pre-deployment checks
- [ ] Notify team of deployment

### Post-Deployment Maintenance

- [ ] Verify deployment successful
- [ ] Run health checks
- [ ] Monitor error rates (1 hour)
- [ ] Check key metrics
- [ ] Update deployment log

### Monthly Maintenance Checklist

- [ ] Database VACUUM ANALYZE
- [ ] Review slow queries
- [ ] Check for unused indexes
- [ ] Update dependencies (patch)
- [ ] Test backup restore
- [ ] Review performance metrics
- [ ] Security audit (pnpm audit)
- [ ] Clean up old backups
- [ ] Review service costs
- [ ] Update documentation

### Quarterly Maintenance Checklist

- [ ] Major dependency updates
- [ ] Comprehensive security audit
- [ ] Performance optimization
- [ ] Rotate secrets
- [ ] Review backup strategy
- [ ] Cost optimization review
- [ ] User feedback analysis
- [ ] Team training on new procedures

---

## Emergency Maintenance

### Unplanned Maintenance

**When to Perform:**
- Critical security vulnerability
- Database corruption
- Service outage
- Data breach

**Procedure:**
1. Assess severity and impact
2. Create incident ticket
3. Notify stakeholders
4. Create backup (if safe to do so)
5. Implement fix
6. Test thoroughly
7. Deploy to production
8. Monitor closely (24 hours)
9. Document incident and lessons learned

### Maintenance Windows

**Recommended Schedule:**
- Weekly: Sunday 2:00 AM - 4:00 AM JST
- Monthly: First Sunday 2:00 AM - 6:00 AM JST
- Emergency: Anytime (with notification)

**Notification:**
- Email users 48 hours in advance
- Post on status page
- Show banner on site
- Update social media

---

## Additional Resources

- [OPERATIONS.md](./OPERATIONS.md) - Operations runbook
- [TROUBLESHOOTING.md](./TROUBLESHOOTING.md) - Troubleshooting guide
- [DATABASE_BACKUP.md](./DATABASE_BACKUP.md) - Backup procedures
- [SECURITY.md](./SECURITY.md) - Security best practices
- [MONITORING.md](./MONITORING.md) - Monitoring guide

---

**Last Updated:** 2025-10-31
**Document Owner:** Operations Team
**Review Frequency:** Quarterly
