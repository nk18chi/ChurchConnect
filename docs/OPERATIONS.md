# Operations Runbook

This guide provides step-by-step procedures for operating ChurchConnect in production, including incident response, common issue resolution, scaling guidance, and routine maintenance.

## Table of Contents

- [Daily Operations](#daily-operations)
- [Incident Response](#incident-response)
- [Common Issues and Resolutions](#common-issues-and-resolutions)
- [Scaling Guidance](#scaling-guidance)
- [Backup and Restore Procedures](#backup-and-restore-procedures)
- [Database Maintenance](#database-maintenance)
- [Monitoring Dashboards](#monitoring-dashboards)
- [Performance Optimization](#performance-optimization)

---

## Daily Operations

### Morning Health Check (5-10 minutes)

**Run automated health check:**
```bash
./scripts/health-check.sh
```

**Check key dashboards:**
1. **Render Dashboard** - Verify all services are running
2. **Sentry** - Review any new errors overnight
3. **Resend Dashboard** - Check email delivery rate
4. **Stripe Dashboard** - Verify payment processing

**Expected Metrics:**
- All services: Status "Running" (green)
- Error rate: <1% (24 hours)
- Email delivery rate: >95%
- Response time: <3 seconds (p95)
- No critical alerts

**If Issues Found:**
- Refer to [Incident Response](#incident-response) section
- Check specific service status pages
- Review error logs in Sentry
- Escalate if needed (see [Escalation Procedures](#escalation-procedures))

### Database Backup

**Daily Backup (Automated):**
```bash
cd packages/database
./scripts/backup.sh daily-$(date +%Y%m%d)
```

This should be automated via cron job or Render scheduled task:
```cron
0 2 * * * cd /path/to/churchconnect/packages/database && ./scripts/backup.sh daily-$(date +%Y%m%d)
```

**Verify Backup Created:**
```bash
ls -lh packages/database/backups/
```

Most recent backup should be dated today.

### Email Monitoring

**Check Resend Dashboard:**
1. Login to https://resend.com/dashboard
2. Review "Analytics" section
3. Check metrics:
   - Delivery rate: Should be >95%
   - Bounce rate: Should be <2%
   - Spam complaints: Should be <0.1%

**If delivery rate drops:**
- Check bounce reasons in Resend logs
- Verify domain authentication (SPF, DKIM, DMARC)
- Review email content for spam triggers
- Contact Resend support if needed

### Image Storage Monitoring

**Check Cloudinary Usage:**
1. Login to https://cloudinary.com/console
2. Review "Usage" dashboard
3. Monitor:
   - Bandwidth usage (5GB free tier)
   - Storage used
   - Transformations
   - Upload success rate

**Optimization Actions:**
- If approaching limits, reduce image quality settings
- Implement additional compression
- Clean up unused images
- Consider upgrading plan

---

## Incident Response

### Severity Levels

#### P0 - Critical (Site Down)
**Response Time:** Immediate
**Examples:**
- Database completely unavailable
- All apps returning 500 errors
- Total site outage
- Payment processing completely broken

**Action Steps:**
1. Immediately acknowledge the incident
2. Page on-call engineer via phone/SMS
3. Post in #incidents Slack channel
4. Create incident ticket
5. Begin investigation immediately
6. Update status page (if available)
7. Notify stakeholders every 30 minutes

**Resolution Target:** <1 hour

#### P1 - High (Major Feature Broken)
**Response Time:** <1 hour
**Examples:**
- Login/authentication broken
- Donations failing
- Church admin portal down
- Database connection errors (partial)

**Action Steps:**
1. Acknowledge within 1 hour
2. Create incident ticket
3. Investigate via Sentry and logs
4. Post in #alerts Slack channel
5. Notify affected users if widespread
6. Implement fix and deploy

**Resolution Target:** <4 hours

#### P2 - Medium (Minor Feature Broken)
**Response Time:** <4 hours
**Examples:**
- Contact form not working
- Image upload failing
- Search returning errors
- Email notifications delayed

**Action Steps:**
1. Create ticket with priority "high"
2. Investigate during business hours
3. Fix within 24 hours
4. Deploy during next release window

**Resolution Target:** <24 hours

#### P3 - Low (Cosmetic Issue)
**Response Time:** <24 hours
**Examples:**
- Styling issues
- Typos
- Minor UI glitches
- Non-critical logging errors

**Action Steps:**
1. Create ticket with priority "low"
2. Schedule fix for next sprint
3. Batch with other low-priority fixes

**Resolution Target:** Next release

### Incident Response Checklist

When incident is detected:

- [ ] **1. Assess Severity** - Determine P0/P1/P2/P3
- [ ] **2. Create Ticket** - Document in issue tracker
- [ ] **3. Acknowledge** - Respond within SLA timeframe
- [ ] **4. Notify** - Alert team and stakeholders
- [ ] **5. Investigate** - Check logs, Sentry, dashboards
- [ ] **6. Diagnose** - Identify root cause
- [ ] **7. Mitigate** - Implement temporary fix if needed
- [ ] **8. Fix** - Implement permanent solution
- [ ] **9. Deploy** - Push fix to production
- [ ] **10. Verify** - Confirm issue resolved
- [ ] **11. Monitor** - Watch for recurrence (24 hours)
- [ ] **12. Document** - Update runbook with lessons learned
- [ ] **13. Post-Mortem** - Conduct if P0 or P1
- [ ] **14. Close** - Close ticket and notify stakeholders

### Escalation Procedures

**Critical Issues (P0):**
1. Post in #incidents Slack channel
2. Call on-call engineer directly
3. If no response in 15 minutes, call backup engineer
4. Email admin@churchconnect.jp
5. Update status page

**Non-Critical Issues:**
1. Create GitHub issue
2. Assign to appropriate team member
3. Post in #engineering Slack channel
4. Email weekly summary to stakeholders

---

## Common Issues and Resolutions

### Issue: Database Connection Failed

**Symptoms:**
- "Connection refused" errors in logs
- Apps unable to connect to database
- Timeout errors
- 500 errors across all apps

**Diagnosis:**
```bash
# Check database status
psql "$DATABASE_URL" -c "SELECT 1"

# Check connection count
psql "$DATABASE_URL" -c "SELECT count(*) FROM pg_stat_activity;"

# Check for long-running queries
psql "$DATABASE_URL" -c "SELECT pid, age(clock_timestamp(), query_start), usename, query FROM pg_stat_activity WHERE query != '<IDLE>' AND query NOT ILIKE '%pg_stat_activity%' ORDER BY query_start desc;"
```

**Resolution:**
1. Verify DATABASE_URL is correct in environment variables
2. Check Render database status in dashboard
3. Review connection limits (default: 100)
4. Kill long-running queries if needed:
   ```sql
   SELECT pg_terminate_backend(pid) FROM pg_stat_activity WHERE pid = <pid>;
   ```
5. Restart apps if connection pool exhausted
6. Scale database if persistently at capacity

**Prevention:**
- Use connection pooling (PgBouncer)
- Set appropriate connection limits
- Monitor connection count
- Alert on >80% connection usage

### Issue: High Error Rate

**Symptoms:**
- Error rate >5% in Sentry
- Multiple 500 errors in logs
- Users reporting errors

**Diagnosis:**
1. Check Sentry dashboard for error patterns
2. Review recent deployments
3. Check database performance
4. Review application logs in Render

**Resolution:**
1. Identify most common error
2. Check if related to recent deployment (rollback if needed)
3. Fix code issue
4. Deploy hotfix
5. Monitor error rate for 1 hour

**Rollback Procedure:**
```bash
# In Render dashboard:
1. Navigate to service
2. Click "Manual Deploy"
3. Select previous known-good commit
4. Deploy
```

### Issue: Slow Response Times

**Symptoms:**
- Response times >5 seconds
- Users reporting slow page loads
- High CPU usage in Render

**Diagnosis:**
```sql
-- Check slow queries
SELECT query, mean_exec_time, calls
FROM pg_stat_statements
ORDER BY mean_exec_time DESC
LIMIT 10;

-- Check table sizes
SELECT
  schemaname,
  tablename,
  pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) AS size
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;
```

**Resolution:**
1. Identify slow queries
2. Add missing indexes
3. Optimize N+1 queries
4. Enable query result caching
5. Consider database upgrade
6. Enable CDN caching

**Performance Optimization:**
- See [Performance Optimization](#performance-optimization) section

### Issue: Email Not Sending

**Symptoms:**
- Contact forms submit but no email received
- Review notifications not arriving
- Donation receipts missing

**Diagnosis:**
```bash
# Test Resend API directly
curl -X POST https://api.resend.com/emails \
  -H "Authorization: Bearer $RESEND_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "from": "'"$EMAIL_FROM"'",
    "to": "test@example.com",
    "subject": "Test Email",
    "html": "<p>Test email from ChurchConnect</p>"
  }'
```

**Resolution:**
1. Check RESEND_API_KEY is valid
2. Verify EMAIL_FROM domain is verified in Resend
3. Check Resend dashboard for failed sends
4. Review error logs in Sentry
5. Check if rate limit exceeded (100 emails/day free)
6. Verify recipient email addresses are valid

**Prevention:**
- Set up monitoring alerts for email delivery rate
- Upgrade to paid Resend plan before hitting limits
- Implement email queue with retry logic

### Issue: Image Upload Failing

**Symptoms:**
- Upload button doesn't work
- Error after selecting image
- Images don't appear after upload

**Diagnosis:**
1. Check browser console for errors
2. Review Cloudinary dashboard for upload errors
3. Check application logs for signature generation errors
4. Verify CLOUDINARY_* environment variables

**Resolution:**
1. Verify Cloudinary credentials are correct
2. Check file size (<5MB limit)
3. Verify file type is allowed (images only)
4. Check CORS settings in Cloudinary dashboard
5. Regenerate upload signature server-side
6. Clear browser cache and retry

**Prevention:**
- Add client-side file validation
- Improve error messages
- Monitor Cloudinary error rate

### Issue: Stripe Checkout Not Working

**Symptoms:**
- Checkout button doesn't redirect
- Payment doesn't process
- Stripe webhook not receiving events

**Diagnosis:**
```bash
# Check Stripe webhook endpoint
curl https://api.churchconnect.jp/api/stripe/webhooks

# List recent checkout sessions
stripe checkout sessions list --limit 5

# Test webhook
stripe trigger checkout.session.completed
```

**Resolution:**
1. Verify STRIPE_SECRET_KEY matches mode (test/live)
2. Check NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY matches
3. Verify webhook endpoint URL in Stripe dashboard
4. Check STRIPE_WEBHOOK_SECRET is correct
5. Review webhook logs in Stripe dashboard
6. Test with Stripe test cards

**Prevention:**
- Monitor webhook delivery success rate
- Set up Stripe alerts for failed payments
- Test payment flow in staging regularly

### Issue: Search Not Returning Results

**Symptoms:**
- Search returns empty results
- Relevant churches not appearing
- Search completely broken

**Diagnosis:**
```sql
-- Check search vectors populated
SELECT COUNT(*) FROM "Church" WHERE "searchVector" IS NOT NULL;

-- Test search directly
SELECT name FROM "Church"
WHERE "searchVector" @@ plainto_tsquery('english', 'church')
LIMIT 10;

-- Check triggers active
SELECT * FROM pg_trigger WHERE tgname LIKE '%search%';
```

**Resolution:**
1. Rebuild search vectors:
   ```sql
   UPDATE "Church" SET "updatedAt" = NOW();
   ```
2. Verify full-text search triggers are active
3. Check if trigger function exists
4. Re-run migration if needed
5. Test search in PostgreSQL directly

**Prevention:**
- Add monitoring for search success rate
- Regularly verify search vectors populated
- Test search after major database changes

---

## Scaling Guidance

### When to Scale

#### Database Scaling Indicators

**Scale When:**
- CPU usage >80% for sustained period (>1 hour)
- Memory usage >80%
- Query latency >100ms (p95)
- Connection pool frequently exhausted (>80% connections used)
- Disk usage >80%

**Monitoring Queries:**
```sql
-- Check current connections
SELECT count(*) FROM pg_stat_activity;

-- Check database size
SELECT pg_size_pretty(pg_database_size(current_database()));

-- Check cache hit ratio (should be >95%)
SELECT
  sum(blks_hit) / (sum(blks_hit) + sum(blks_read)) AS cache_hit_ratio
FROM pg_stat_database;
```

#### Application Server Scaling Indicators

**Scale When:**
- CPU usage >80% for sustained period
- Memory usage >80%
- Response time >3 seconds (p95)
- Request queue backing up
- Consistent 503 errors

### How to Scale

#### Vertical Scaling (Increase Instance Size)

**Render:**
1. Navigate to service in Render dashboard
2. Click "Settings" tab
3. Change "Instance Type" to larger size
4. Click "Save Changes"
5. Service will restart automatically

**Recommended Tiers:**
- **Starter:** 512MB RAM, 0.5 CPU - Development only
- **Standard:** 2GB RAM, 1 CPU - MVP production
- **Pro:** 4GB RAM, 2 CPU - Growing production
- **Pro Plus:** 8GB RAM, 4 CPU - High traffic

#### Horizontal Scaling (Add Instances)

**Render:**
1. Navigate to service in Render dashboard
2. Click "Settings" tab
3. Under "Scaling", increase "Instance Count"
4. Click "Save Changes"
5. Render will add instances automatically

**Load Balancing:**
- Render automatically load balances across instances
- No configuration needed

**Session Considerations:**
- NextAuth sessions stored in database (not memory)
- Stateless - can scale horizontally without issues

#### Database Scaling

**Render PostgreSQL Plans:**
1. **Starter:** 1GB RAM, 1GB storage - Development
2. **Standard:** 4GB RAM, 100GB storage - MVP production
3. **Pro:** 16GB RAM, 256GB storage - Growing production
4. **Pro Plus:** 32GB RAM, 512GB storage - High traffic

**Upgrade Process:**
1. Create database backup first
2. Navigate to database in Render dashboard
3. Click "Upgrade" button
4. Select new plan
5. Confirm upgrade
6. Zero-downtime upgrade (a few seconds of read-only mode)

**Read Replicas:**
- Not available in Render Starter/Standard plans
- Consider implementing application-level caching instead
- Use Redis or Upstash for caching

#### CDN and Caching

**Cloudinary (Images):**
- Automatically cached globally
- Serves images from nearest edge location
- No configuration needed

**Next.js Static Assets:**
- Automatically served from Render's CDN
- Configure cache headers for optimal performance:
```typescript
// next.config.js
module.exports = {
  async headers() {
    return [
      {
        source: '/:all*(svg|jpg|png|webp|avif)',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
    ]
  },
}
```

#### Connection Pooling

**Enable PgBouncer:**
- Render includes PgBouncer automatically
- Use external connection URL with `?pgbouncer=true`
- Significantly reduces connection overhead

**Configure Prisma:**
```typescript
// packages/database/src/client.ts
const prisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DATABASE_URL_POOLED || process.env.DATABASE_URL,
    },
  },
})
```

### Scaling Checklist

Before scaling:
- [ ] Identify bottleneck (CPU, memory, database, network)
- [ ] Review current resource usage
- [ ] Estimate cost increase
- [ ] Create backup
- [ ] Schedule during low-traffic period
- [ ] Notify team
- [ ] Monitor during and after scaling
- [ ] Verify performance improvement
- [ ] Document in operations log

---

## Backup and Restore Procedures

See [DATABASE_BACKUP.md](./DATABASE_BACKUP.md) for comprehensive backup documentation.

### Daily Backup

**Automated Daily Backup:**
```bash
cd packages/database
./scripts/backup.sh daily-$(date +%Y%m%d)
```

**Retention Policy:**
- Keep last 10 daily backups
- Keep 4 weekly backups (every Sunday)
- Keep 12 monthly backups (1st of month)
- Archive yearly backups offsite

### Pre-Migration Backup

**ALWAYS backup before applying migrations:**
```bash
cd packages/database
./scripts/backup.sh pre-migration-$(date +%Y%m%d-%H%M%S)
npx prisma migrate deploy
```

### Manual Backup

**Full database backup:**
```bash
pg_dump "$DATABASE_URL" > backup-$(date +%Y%m%d-%H%M%S).sql
gzip backup-*.sql
```

**Backup specific tables:**
```bash
pg_dump "$DATABASE_URL" -t "Church" -t "User" > partial-backup.sql
```

### Restore Procedures

**DANGER: This will overwrite your database!**

**Full Restore:**
```bash
cd packages/database
./scripts/restore.sh backups/backup-20251031-120000.sql.gz
```

**Test Restore (Recommended):**
```bash
# Create test database
createdb churchconnect_test

# Restore to test database
DATABASE_URL="postgresql://localhost/churchconnect_test" \
  ./scripts/restore.sh backups/backup-20251031-120000.sql.gz

# Verify data
psql churchconnect_test -c "SELECT COUNT(*) FROM \"Church\";"

# Clean up
dropdb churchconnect_test
```

### Disaster Recovery

**If database completely lost:**

1. **Don't Panic** - You have backups
2. **Create new database** in Render
3. **Restore latest backup:**
   ```bash
   DATABASE_URL="new-database-url" ./scripts/restore.sh backups/latest.sql.gz
   ```
4. **Verify data integrity:**
   ```sql
   SELECT COUNT(*) FROM "Church";
   SELECT COUNT(*) FROM "User";
   SELECT COUNT(*) FROM "Review";
   ```
5. **Update DATABASE_URL** in all apps
6. **Restart all services**
7. **Run health check**
8. **Monitor for issues** (24 hours)
9. **Document incident** and lessons learned

---

## Database Maintenance

### Routine Maintenance Tasks

#### Daily

- Run automated backup (via cron)
- Monitor connection count
- Check for long-running queries
- Review slow query log

#### Weekly

- Analyze table statistics
- Vacuum tables (if autovacuum insufficient)
- Review index usage
- Check table sizes
- Clean up old backups

#### Monthly

- Full database analysis
- Review and optimize slow queries
- Check for unused indexes
- Review disk usage trends
- Update statistics

### Database Health Checks

**Connection Health:**
```sql
-- Current connections
SELECT count(*) AS connections,
       max_conn,
       max_conn - count(*) AS available
FROM pg_stat_activity,
     (SELECT setting::int AS max_conn FROM pg_settings WHERE name='max_connections') AS mc
GROUP BY max_conn;

-- Idle connections
SELECT count(*) FROM pg_stat_activity WHERE state = 'idle';
```

**Performance Metrics:**
```sql
-- Cache hit ratio (should be >95%)
SELECT
  sum(blks_hit) / NULLIF(sum(blks_hit) + sum(blks_read), 0) * 100 AS cache_hit_ratio
FROM pg_stat_database;

-- Table bloat
SELECT schemaname, tablename,
  pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) AS size
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;
```

**Index Usage:**
```sql
-- Unused indexes
SELECT schemaname, tablename, indexname, idx_scan
FROM pg_stat_user_indexes
WHERE idx_scan = 0
AND indexname NOT LIKE '%_pkey%'
ORDER BY pg_relation_size(indexrelid) DESC;

-- Index cache hit ratio
SELECT
  sum(idx_blks_hit) / NULLIF(sum(idx_blks_hit) + sum(idx_blks_read), 0) * 100 AS index_cache_hit_ratio
FROM pg_statio_user_indexes;
```

### Vacuum and Analyze

**Manual Vacuum:**
```sql
-- Vacuum specific table
VACUUM ANALYZE "Church";

-- Vacuum all tables
VACUUM ANALYZE;

-- Full vacuum (requires exclusive lock, use with caution)
VACUUM FULL ANALYZE "Church";
```

**Monitor Autovacuum:**
```sql
SELECT schemaname, relname, last_vacuum, last_autovacuum,
       last_analyze, last_autoanalyze
FROM pg_stat_user_tables
ORDER BY last_autovacuum DESC NULLS LAST;
```

### Query Performance Optimization

**Enable Query Logging:**
```sql
-- Log queries slower than 500ms
ALTER DATABASE churchconnect SET log_min_duration_statement = 500;
```

**Find Slow Queries:**
```sql
SELECT query, mean_exec_time, calls,
       total_exec_time / 60000 AS total_minutes
FROM pg_stat_statements
ORDER BY mean_exec_time DESC
LIMIT 20;
```

**Add Missing Indexes:**
```sql
-- Check for sequential scans on large tables
SELECT schemaname, tablename, seq_scan, seq_tup_read,
       idx_scan, seq_tup_read / seq_scan AS avg_seq_tup
FROM pg_stat_user_tables
WHERE seq_scan > 0
ORDER BY seq_tup_read DESC
LIMIT 20;
```

---

## Monitoring Dashboards

### Render Dashboard

**Access:** https://dashboard.render.com

**Key Metrics:**
- Service status (all should be "Running")
- CPU usage (target: <70%)
- Memory usage (target: <70%)
- Request rate (requests/second)
- Response time (target: <3s at p95)
- Error rate (target: <1%)

**Set Up Alerts:**
1. Navigate to service
2. Click "Alerts" tab
3. Configure alerts:
   - CPU >80% for 5 minutes
   - Memory >80% for 5 minutes
   - Error rate >5% for 5 minutes
   - Response time >5s at p95

### Sentry Dashboard

**Access:** https://sentry.io

**Key Metrics:**
- Error count (last 24 hours)
- Affected users
- Error frequency trends
- New error types
- Performance regressions

**Alerts to Configure:**
- New error type detected
- Error spike (>100 errors/hour)
- Performance regression (>3s load time)
- High error rate (>5%)

**Daily Review:**
1. Check "Issues" dashboard
2. Review new errors
3. Prioritize by affected users
4. Assign to team members
5. Track resolution

### Database Dashboard

**Render Metrics:**
- CPU usage (target: <70%)
- Memory usage (target: <70%)
- Disk usage (target: <80%)
- Connection count (target: <80 of 100)
- Query latency

**Custom Monitoring Queries:**

Save these in `packages/database/prisma/monitoring-queries.sql`:

```sql
-- Daily Active Users
SELECT DATE("viewedAt") as date, COUNT(DISTINCT "userId") as dau
FROM "ChurchAnalytics"
WHERE "viewedAt" > NOW() - INTERVAL '30 days'
GROUP BY DATE("viewedAt")
ORDER BY date DESC;

-- Churches Added (last 7 days)
SELECT DATE("createdAt") as date, COUNT(*) as churches
FROM "Church"
WHERE "createdAt" > NOW() - INTERVAL '7 days'
GROUP BY DATE("createdAt")
ORDER BY date DESC;

-- Review Activity
SELECT
  COUNT(*) FILTER (WHERE status = 'PENDING') as pending,
  COUNT(*) FILTER (WHERE status = 'APPROVED') as approved,
  COUNT(*) FILTER (WHERE status = 'REJECTED') as rejected
FROM "Review"
WHERE "createdAt" > NOW() - INTERVAL '7 days';

-- Donation Summary
SELECT
  DATE("createdAt") as date,
  COUNT(*) as donations,
  SUM(amount) as total_amount,
  AVG(amount) as avg_amount
FROM "PlatformDonation"
WHERE "createdAt" > NOW() - INTERVAL '30 days'
  AND status = 'succeeded'
GROUP BY DATE("createdAt")
ORDER BY date DESC;
```

### Third-Party Service Dashboards

**Cloudinary:**
- Usage: https://cloudinary.com/console/usage
- Monitor bandwidth, storage, transformations
- Alert at 80% of limits

**Resend:**
- Analytics: https://resend.com/analytics
- Monitor delivery rate, bounces, spam complaints
- Alert if delivery rate <90%

**Stripe:**
- Dashboard: https://dashboard.stripe.com
- Monitor successful payments, failures, webhooks
- Alert on webhook endpoint failures

---

## Performance Optimization

### Database Query Optimization

**Find N+1 Queries:**
```typescript
// Bad - N+1 query
const churches = await prisma.church.findMany()
for (const church of churches) {
  const staff = await prisma.staff.findMany({ where: { churchId: church.id }})
}

// Good - Single query with include
const churches = await prisma.church.findMany({
  include: {
    staff: true
  }
})
```

**Add Appropriate Indexes:**
```sql
-- Index frequently queried columns
CREATE INDEX idx_church_is_published ON "Church"("isPublished");
CREATE INDEX idx_review_status ON "Review"("status");
CREATE INDEX idx_event_date ON "Event"("date");

-- Composite indexes for common filters
CREATE INDEX idx_church_published_verified
  ON "Church"("isPublished", "isVerified");
```

**Use Select to Limit Fields:**
```typescript
// Bad - Fetches all fields
const churches = await prisma.church.findMany()

// Good - Only fetch needed fields
const churches = await prisma.church.findMany({
  select: {
    id: true,
    name: true,
    city: true,
    prefecture: true
  }
})
```

### Application Performance

**Enable Next.js Caching:**
```typescript
// pages/api/churches.ts
export const revalidate = 3600 // Revalidate every hour

// app/churches/page.tsx
export const dynamic = 'force-static'
export const revalidate = 3600
```

**Optimize Images:**
```typescript
// Use Next.js Image component
import Image from 'next/image'

<Image
  src="/church.jpg"
  width={800}
  height={600}
  alt="Church"
  placeholder="blur"
  quality={85}
/>
```

**Implement Pagination:**
```typescript
// Bad - Fetch all churches
const churches = await prisma.church.findMany()

// Good - Paginate results
const churches = await prisma.church.findMany({
  take: 20,
  skip: (page - 1) * 20,
  orderBy: { name: 'asc' }
})
```

### Frontend Performance

**Code Splitting:**
```typescript
// Dynamic imports for heavy components
const HeavyComponent = dynamic(() => import('./HeavyComponent'), {
  loading: () => <div>Loading...</div>,
  ssr: false
})
```

**Optimize Bundle Size:**
```bash
# Analyze bundle
pnpm build --analyze

# Check for large dependencies
pnpm list --depth=0 --sort=size
```

**Lazy Load Images:**
```typescript
<Image
  src="/photo.jpg"
  loading="lazy"
  alt="Photo"
/>
```

### Monitoring Performance Improvements

**Before/After Metrics:**
- Response time (p50, p95, p99)
- Database query time
- Page load time (First Contentful Paint)
- Time to Interactive
- Total Blocking Time

**Tools:**
- Lighthouse (Chrome DevTools)
- WebPageTest.org
- Sentry Performance Monitoring
- Render Metrics Dashboard

---

## Emergency Contacts

**On-Call Engineer:** [Phone Number]
**Platform Admin:** admin@churchconnect.jp
**DevOps Lead:** [Email]
**Technical Support:** support@churchconnect.jp

**Service Status Pages:**
- Render: https://status.render.com
- Cloudinary: https://status.cloudinary.com
- Stripe: https://status.stripe.com
- Resend: https://resend.com/status

---

## Additional Resources

- [TROUBLESHOOTING.md](./TROUBLESHOOTING.md) - Detailed troubleshooting procedures
- [MONITORING.md](./MONITORING.md) - Comprehensive monitoring guide
- [DATABASE_BACKUP.md](./DATABASE_BACKUP.md) - Backup procedures
- [DEPLOYMENT.md](./DEPLOYMENT.md) - Deployment procedures
- [SECURITY.md](./SECURITY.md) - Security best practices

---

**Last Updated:** 2025-10-31
**Document Owner:** Operations Team
**Review Frequency:** Quarterly
