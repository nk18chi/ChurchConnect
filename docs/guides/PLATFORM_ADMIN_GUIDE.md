# Platform Admin Guide

This guide is for platform administrators who manage ChurchConnect Japan. Admins have access to moderation tools, verification approval, user management, and platform oversight.

## Table of Contents

- [Getting Started](#getting-started)
- [Dashboard Overview](#dashboard-overview)
- [Church Management](#church-management)
- [Review Moderation](#review-moderation)
- [Verification Approval](#verification-approval)
- [Platform Donations](#platform-donations)
- [User Management](#user-management)
- [Analytics & Reporting](#analytics--reporting)
- [System Settings](#system-settings)
- [Security & Compliance](#security--compliance)
- [Troubleshooting](#troubleshooting)

## Getting Started

### Logging In

1. Visit https://admin.churchconnect.jp
2. Enter your admin email and password
3. Complete 2FA verification (if enabled)
4. Click "Sign In"

**Screenshot location: Admin login page**

**Security note:** Admin accounts should use strong, unique passwords and enable two-factor authentication.

### Admin Roles

ChurchConnect has different admin access levels:

**Platform Admin (ADMIN role):**
- Full access to all admin functions
- Review moderation
- Verification approval
- User management
- Church management
- Platform settings
- Donation management

**Future roles planned:**
- Moderator: Review moderation only
- Support: User support and church assistance
- Finance: Donation and financial reporting only

**Current access:** All admin accounts have full ADMIN role access.

### Dashboard Overview

After logging in, the admin dashboard displays:

**Key Metrics:**
- Total churches (active/pending/deleted)
- Total users (by role)
- Reviews pending moderation
- Verification requests pending
- Platform donations this month
- New churches this week
- Active users this week

**Screenshot location: Admin dashboard with metric cards**

**Recent Activity:**
- Latest review submissions
- Recent verification requests
- New church registrations
- Recent donations
- Flagged content

**Quick Actions:**
- Moderate pending reviews
- Approve verifications
- View recent donations
- Export reports

## Dashboard Overview

### Main Dashboard Sections

**Statistics Overview:**
- Real-time platform metrics
- Growth trends (daily, weekly, monthly)
- User engagement rates
- Church activity levels

**Screenshot location: Stats overview with graphs**

**Pending Items:**
- Reviews awaiting moderation (count)
- Verification requests (count)
- Flagged content (count)
- Support tickets (if applicable)

**System Health:**
- Database status
- API response times
- Error rate (last 24 hours)
- Email delivery success rate
- Storage usage

**Recent Activity Feed:**
- Chronological list of platform activities
- Filterable by type (reviews, churches, users, donations)
- Click any item to view details

### Navigation

**Sidebar menu:**
- **Dashboard**: Overview and metrics
- **Churches**: Manage all church profiles
- **Reviews**: Moderate and manage reviews
- **Verifications**: Approve verification requests
- **Users**: Manage user accounts
- **Donations**: View and manage platform donations
- **Reports**: Analytics and exports
- **Settings**: Platform configuration
- **Logs**: Audit trail and system logs

## Church Management

### Viewing All Churches

**How to access:**
1. Click "Churches" in sidebar
2. View list of all churches with:
   - Church name
   - Status (Active, Pending, Deleted)
   - Verification status
   - Creation date
   - Last updated
   - Profile completeness %

**Screenshot location: Churches list view**

**Filtering options:**
- **By status**: Active, Pending, Deleted
- **By verification**: Verified, Unverified
- **By location**: Prefecture, City
- **By denomination**: Select from list
- **By completeness**: <50%, 50-80%, >80%
- **By date**: Created/updated date range

**Search:**
- Search by church name
- Search by city
- Search by admin email

### Viewing Church Details

**How to view:**
1. Click on any church name
2. View detailed information:
   - All profile data
   - Associated admin user
   - Review history
   - Analytics summary
   - Verification status
   - Activity log

**Screenshot location: Church detail page**

**Actions available:**
- Edit church information
- View public profile (opens in new tab)
- Delete church
- Verify/unverify church
- Suspend/activate church
- View audit log
- Contact church admin

### Editing Churches

**When to edit:**
- Correct errors in church data
- Update contact info (when requested)
- Fix address/location issues
- Moderate inappropriate content

**How to edit:**
1. Click church name → "Edit"
2. Modify any field
3. Add admin note (explaining change)
4. Click "Save Changes"

**Screenshot location: Edit church form**

**Best practices:**
- Always add notes explaining administrative changes
- Notify church admin of significant changes
- Document reason for edits
- Use this sparingly (churches should self-manage)

### Deleting Churches

**When to delete:**
- Church permanently closed
- Duplicate church entries
- Spam/fraudulent churches
- Church requests removal

**How to delete:**
1. Click church name → "Delete"
2. Select reason:
   - Church closed
   - Duplicate entry
   - Church request
   - Spam/fraud
   - Other
3. Add explanation
4. Confirm deletion

**Screenshot location: Delete church dialog**

**What happens:**
- Church profile becomes inaccessible
- Church admin loses access
- Reviews are preserved (but hidden)
- Data retained for 90 days (soft delete)
- Can be restored within 90 days

**Restoration:**
1. Filter churches by "Deleted" status
2. Find church → "Restore"
3. Confirm restoration

### Church Verification

See [Verification Approval](#verification-approval) section.

### Bulk Operations

**Available bulk actions:**
- Export church data (CSV)
- Send mass email to church admins
- Bulk verification status update

**How to use:**
1. Filter/select churches
2. Check boxes next to churches
3. Choose action from dropdown
4. Confirm action

**Screenshot location: Bulk actions interface**

**Security note:** Bulk operations are logged in audit trail.

## Review Moderation

All reviews require admin approval before appearing publicly. This ensures quality and prevents spam.

### Review Moderation Queue

**How to access:**
1. Click "Reviews" in sidebar
2. See pending reviews list with:
   - Reviewer name
   - Church name
   - Star rating
   - Review text (preview)
   - Date submitted
   - Visit date

**Screenshot location: Review moderation queue**

**Filtering:**
- Pending (awaiting moderation)
- Approved (live on site)
- Rejected (not approved)
- Flagged (reported by churches)

**Sorting:**
- Newest first (default)
- Oldest first
- Rating (high to low)
- Rating (low to high)

### Reviewing Individual Reviews

**How to moderate:**
1. Click on review to expand
2. Read full review text
3. Check for:
   - Authenticity (seems genuine?)
   - Appropriateness (no offensive language?)
   - Relevance (actually about the church?)
   - Guidelines compliance
4. Choose action: Approve or Reject

**Screenshot location: Review detail modal**

**Review information displayed:**
- Full review text
- Star rating
- Visit date
- Submission date
- Reviewer information
- Church response (if any)
- Previous reviews by this user
- Flagging history

### Approving Reviews

**When to approve:**
- Review is authentic and genuine
- Language is appropriate
- Content is relevant to the church
- No personal attacks or offensive content
- Follows community guidelines

**How to approve:**
1. Click "Approve" button
2. Review appears immediately on church profile
3. Email sent to:
   - Church admin (notification)
   - Reviewer (confirmation)

**Screenshot location: Approve button and confirmation**

### Rejecting Reviews

**When to reject:**
- Spam or fake review
- Offensive/inappropriate language
- Personal attacks
- Completely irrelevant
- Promotional content
- Duplicate review
- Violates terms of service

**How to reject:**
1. Click "Reject" button
2. Select rejection reason:
   - Spam or fake
   - Inappropriate language
   - Personal attack
   - Not relevant
   - Promotional
   - Duplicate
   - Other (explain)
3. Add explanation (optional but recommended)
4. Confirm rejection

**Screenshot location: Reject dialog with reason selection**

**What happens:**
- Review is hidden (not deleted)
- Reviewer is notified with reason
- Church admin is notified
- Review can be appealed

### Handling Flagged Reviews

Churches can flag reviews they believe violate guidelines.

**How to view flagged reviews:**
1. Filter by "Flagged" status
2. See flag reason submitted by church
3. Review both the review and flag reason

**Screenshot location: Flagged reviews with church's explanation**

**How to handle:**
1. Read review carefully
2. Read church's flag reason
3. Consider both perspectives
4. Decide:
   - **Keep Review**: Dismiss flag, review stays
   - **Remove Review**: Flag valid, reject review
   - **Contact Church**: Need more information

**Decision criteria:**
- Is review factual?
- Is criticism constructive vs. personal attack?
- Does it violate guidelines?
- Is church's concern valid?

**After decision:**
- Email both parties with outcome
- Document decision in notes
- Log in audit trail

### Review Guidelines (Reference)

**Reviews should:**
- Be based on personal experience
- Describe specific aspects (worship, community, teaching)
- Be honest and constructive
- Use respectful language

**Reviews should NOT:**
- Contain hate speech or slurs
- Include personal attacks on individuals
- Be promotional or spam
- Contain false information
- Violate privacy (names of minors, etc.)

### Bulk Review Moderation

**Quick approve multiple reviews:**
1. Filter pending reviews
2. Check boxes next to reviews
3. Click "Approve Selected"
4. Confirm bulk approval

**Screenshot location: Bulk moderation interface**

**Use carefully:**
- Best for clearly appropriate reviews
- Double-check selected reviews
- Can't be undone (only individually)

## Verification Approval

Churches can request verified status. Verification adds a ✓ badge and improves search ranking.

### Verification Request Queue

**How to access:**
1. Click "Verifications" in sidebar
2. See pending verification requests with:
   - Church name
   - Request date
   - Profile completeness
   - Documents uploaded
   - Current status

**Screenshot location: Verification requests queue**

**Statuses:**
- **Pending**: Awaiting admin review
- **Approved**: Verified (has badge)
- **Rejected**: Request denied
- **Appealed**: Church appealed rejection

### Reviewing Verification Requests

**How to review:**
1. Click on verification request
2. View submitted information:
   - Church profile (check completeness)
   - Uploaded documents
   - Church admin information
   - Request notes/comments

**Screenshot location: Verification request detail**

**Profile completeness check:**
- Must be 100% complete
- All sections filled
- At least 5 photos uploaded
- Service times added
- Contact information complete

**Document review:**
- Check document type (what was submitted?)
- Verify document shows:
  - Church name (matches profile)
  - Church address (matches profile)
  - Recent date (within 12 months)
  - Official/legitimate appearance

**Screenshot location: Document viewer with zoom**

**Common documents:**
- Religious corporation certificate (宗教法人証明書)
- Articles of incorporation
- Church letterhead with signature
- Utility bill for church address
- Rental/lease agreement
- Official government correspondence

### Approving Verifications

**When to approve:**
- Profile is 100% complete
- Documents clearly prove church ownership
- Church name and address match documents
- Documents are recent and legitimate
- Church has been operating 6+ months
- No red flags

**How to approve:**
1. Click "Approve Verification"
2. Add approval note (optional)
3. Confirm approval

**Screenshot location: Approve verification confirmation**

**What happens:**
- ✓ Verified badge added to profile immediately
- Church moves up in search rankings
- Email sent to church admin
- Church added to verified directory
- Audit log entry created

### Rejecting Verifications

**When to reject:**
- Profile not complete
- Documents insufficient or unclear
- Documents don't match church info
- Documents are too old (>12 months)
- Church operating less than 6 months
- Suspicious or fraudulent documents
- Contact information unverifiable

**How to reject:**
1. Click "Reject Verification"
2. Select rejection reason:
   - Profile incomplete
   - Documents insufficient
   - Information doesn't match
   - Documents expired
   - Church too new
   - Cannot verify
   - Other
3. Add detailed explanation (helps church reapply)
4. Confirm rejection

**Screenshot location: Reject verification dialog**

**What happens:**
- Status changes to "Rejected"
- Email sent to church admin with reason
- Church can resubmit with better documentation
- Audit log entry created

**Good rejection explanation:**
```
Thank you for your verification request. Unfortunately, we cannot
approve at this time because your uploaded document (utility bill)
does not clearly show the church name, only the address. Please
resubmit with a document that shows both the church name and
address, such as:
- Official church registration document
- Letter on church letterhead signed by senior pastor
- Religious corporation certificate

We look forward to your resubmission!
```

### Revoking Verification

**When to revoke:**
- Church profile becomes seriously outdated
- Church information no longer accurate
- Church closure/major changes
- Terms of service violation

**How to revoke:**
1. Go to church detail page
2. Click "Revoke Verification"
3. Select reason
4. Add explanation
5. Confirm revocation

**Screenshot location: Revoke verification dialog**

**What happens:**
- ✓ badge removed immediately
- Search ranking decreases
- Email sent to church admin
- Can reapply for verification

## Platform Donations

Monitor and manage donations made to support the ChurchConnect platform.

### Viewing Donations

**How to access:**
1. Click "Donations" in sidebar
2. See donations list with:
   - Donor name (or Anonymous)
   - Amount
   - Type (One-time or Monthly)
   - Date
   - Status (Succeeded, Failed, Refunded)
   - Stripe payment ID

**Screenshot location: Donations list**

**Filtering:**
- By status (succeeded, failed, refunded)
- By type (one-time, monthly)
- By date range
- By amount range

**Metrics displayed:**
- Total donations (all time)
- Donations this month
- Donations this year
- Average donation amount
- Monthly recurring revenue (MRR)
- Active monthly donors

### Donation Details

**How to view:**
1. Click on any donation
2. See detailed information:
   - Donor information (if provided)
   - Stripe customer ID
   - Payment method
   - Receipt URL
   - Email confirmation status
   - Refund status
   - Stripe dashboard link

**Screenshot location: Donation detail page**

**Actions available:**
- View Stripe payment details (opens Stripe)
- Send thank you email
- Issue refund
- Download receipt
- Add internal notes

### Managing Subscriptions

**Viewing active subscriptions:**
1. Filter donations by "Monthly" type
2. See active recurring donors
3. View subscription details:
   - Start date
   - Next billing date
   - Total amount donated
   - Subscription status

**Screenshot location: Subscriptions list**

**Subscription actions:**
- View in Stripe dashboard
- Cancel subscription (if requested)
- Update payment method (via Stripe)
- Pause subscription (if supported)

### Issuing Refunds

**When to refund:**
- Duplicate payment
- Donor requests refund
- Payment error
- Fraudulent transaction

**How to refund:**
1. Click donation → "Issue Refund"
2. Select refund type:
   - Full refund
   - Partial refund (enter amount)
3. Enter reason for internal records
4. Confirm refund

**Screenshot location: Refund dialog**

**What happens:**
- Refund processed via Stripe
- Status updated to "Refunded"
- Donor receives refund confirmation
- Audit log entry created

**Note:** Refunds typically take 5-7 business days to appear in donor's account.

### Donation Reports

**Available reports:**
- Monthly donation summary
- Donor breakdown (one-time vs. recurring)
- Average donation trends
- Donor retention rate
- Failed payment report

**How to generate:**
1. Click "Reports" tab in Donations
2. Select report type
3. Choose date range
4. Click "Generate Report"
5. Export as CSV or PDF

**Screenshot location: Reports interface**

**Use cases:**
- Monthly financial reporting
- Thank you letters to major donors
- Trend analysis
- Budget planning

### Failed Payments

**Monitoring failed payments:**
1. Filter by "Failed" status
2. Review failure reasons:
   - Insufficient funds
   - Expired card
   - Card declined
   - Authentication failed

**Screenshot location: Failed payments list**

**How to handle:**
- Email donor with payment update request
- Provide link to update payment method
- Track resolution
- Cancel subscription if repeated failures

## User Management

Manage all user accounts across the platform.

### Viewing All Users

**How to access:**
1. Click "Users" in sidebar
2. See users list with:
   - Name
   - Email
   - Role (USER, CHURCH_ADMIN, ADMIN)
   - Churches (for CHURCH_ADMIN)
   - Status (Active, Suspended)
   - Created date
   - Last login

**Screenshot location: Users list**

**Filtering:**
- By role
- By status
- By registration date
- By last login date

**Search:**
- Search by name
- Search by email
- Search by church (for church admins)

### User Details

**How to view:**
1. Click on any user
2. See detailed information:
   - Profile information
   - Role and permissions
   - Associated churches
   - Review history
   - Activity log
   - Login history

**Screenshot location: User detail page**

**Actions available:**
- Edit user information
- Change role
- Reset password
- Suspend/activate account
- Delete account
- View audit log
- Send email to user

### Creating Admin Users

**How to create new admin:**
1. Click "Add User" → "Create Admin"
2. Fill in:
   - Name
   - Email
   - Role (ADMIN)
   - Send invitation email
3. Click "Create"

**Screenshot location: Create admin form**

**What happens:**
- Admin account created
- Invitation email sent
- User sets password on first login
- Logged in audit trail

**Security best practices:**
- Use work email addresses
- Enable 2FA for all admins
- Review admin list quarterly
- Remove inactive admins

### Managing Church Admins

**Creating church admin:**
1. Go to church detail page
2. Click "Add Admin" or "Change Admin"
3. Fill in:
   - Name
   - Email
   - Send invitation
4. Click "Create"

**Screenshot location: Assign church admin**

**Changing church admin:**
1. Go to church detail page
2. Click "Change Admin"
3. Select new admin method:
   - Create new user
   - Assign existing user
4. Complete process

**What happens:**
- New admin gets access to church portal
- Previous admin loses access (if replaced)
- Email notifications sent
- Audit log entry created

### Suspending Users

**When to suspend:**
- Terms of service violation
- Abusive behavior
- Spam activity
- Security concern
- User request (temporary)

**How to suspend:**
1. User detail page → "Suspend Account"
2. Select reason
3. Add explanation
4. Choose notification:
   - Email user
   - Don't email user
5. Confirm suspension

**Screenshot location: Suspend user dialog**

**What happens:**
- User cannot log in
- All sessions terminated
- User receives notification (if selected)
- Can be reactivated later

### Deleting Users

**When to delete:**
- User requests account deletion
- Spam/fraudulent account
- Duplicate account
- Data privacy request (GDPR)

**How to delete:**
1. User detail page → "Delete Account"
2. Select deletion type:
   - Soft delete (data retained 90 days)
   - Hard delete (permanent, GDPR compliance)
3. Confirm deletion

**Screenshot location: Delete user dialog**

**What happens:**
- User account inaccessible
- Sessions terminated
- Associated reviews handled per policy:
  - Keep reviews anonymized
  - Or delete all user reviews
- Church admin associations removed
- Can be restored (soft delete only)

### Bulk User Operations

**Available actions:**
- Export user data (CSV)
- Send mass email
- Bulk role assignment

**Security:** All bulk operations logged.

## Analytics & Reporting

Monitor platform performance and generate reports.

### Platform Analytics

**How to access:**
1. Click "Reports" → "Analytics"
2. View platform-wide metrics:

**Screenshot location: Analytics dashboard**

**Key metrics:**
- **User Growth**: Daily, weekly, monthly new users
- **Church Growth**: New churches over time
- **Engagement**: Active users, page views, search queries
- **Reviews**: Submissions, approvals, rejection rate
- **Donations**: Revenue trends, donor growth
- **Performance**: Page load times, error rates

**Visualizations:**
- Line graphs for trends
- Bar charts for comparisons
- Pie charts for distribution
- Tables for detailed data

### Custom Reports

**Available reports:**

**Church Reports:**
- Church directory export
- Profile completeness report
- Verification status report
- Church activity report

**User Reports:**
- User list export
- User activity report
- Church admin assignments
- Login activity report

**Review Reports:**
- Review moderation report
- Review activity by church
- Average ratings report
- Flagged reviews report

**Financial Reports:**
- Donation summary
- Revenue trends
- Donor retention
- Failed payments

**How to generate:**
1. Click "Reports"
2. Select report type
3. Configure parameters:
   - Date range
   - Filters
   - Grouping
4. Click "Generate"
5. Export as CSV or PDF

**Screenshot location: Custom report builder**

### Data Exports

**Export options:**
- CSV (for spreadsheets)
- PDF (for documents)
- JSON (for API integration)

**Available data:**
- All churches
- All users
- All reviews
- All donations
- Analytics data

**How to export:**
1. Navigate to section (Churches, Users, etc.)
2. Apply filters if needed
3. Click "Export" button
4. Select format
5. Download file

**Screenshot location: Export dialog**

**Privacy note:** Exports contain sensitive data. Handle securely.

### Scheduled Reports

**Set up automated reports:**
1. Click "Reports" → "Scheduled Reports"
2. Click "Create Schedule"
3. Configure:
   - Report type
   - Frequency (daily, weekly, monthly)
   - Email recipients
   - Format
4. Save schedule

**Screenshot location: Create scheduled report**

**Common scheduled reports:**
- Daily moderation queue summary
- Weekly user growth report
- Monthly financial report
- Quarterly platform review

## System Settings

Configure platform-wide settings and preferences.

### General Settings

**How to access:**
1. Click "Settings" → "General"
2. Configure:
   - Platform name
   - Contact email
   - Support email
   - Logo and branding
   - Social media links
   - Maintenance mode

**Screenshot location: General settings**

**Maintenance Mode:**
- Enable to show "maintenance" message
- Useful during deployments or updates
- Admins can still access site
- Displays custom message to users

### Email Settings

**Configure email system:**
1. Click "Settings" → "Email"
2. Settings:
   - Email provider (Resend)
   - From address
   - Reply-to address
   - Email templates
   - Notification preferences

**Screenshot location: Email settings**

**Email templates:**
- Welcome email
- Password reset
- Review notifications
- Verification notifications
- Donation receipts

**Editing templates:**
1. Select template
2. Edit content (supports HTML)
3. Use variables: `{churchName}`, `{userName}`, etc.
4. Preview
5. Save

### Feature Flags

**Enable/disable features:**
1. Click "Settings" → "Features"
2. Toggle features:
   - User registration
   - Church registration
   - Reviews
   - Donations
   - Search
   - Analytics

**Screenshot location: Feature flags**

**Use cases:**
- Disable during issues
- Beta testing new features
- Gradual rollouts

### Content Moderation Settings

**Configure moderation:**
1. Click "Settings" → "Moderation"
2. Settings:
   - Auto-approve reviews (off by default)
   - Profanity filter settings
   - Spam detection sensitivity
   - Review guidelines text

**Screenshot location: Moderation settings**

**Recommended:**
- Keep manual review approval
- Medium spam detection
- Update guidelines as needed

### Security Settings

**Configure security:**
1. Click "Settings" → "Security"
2. Settings:
   - Password requirements
   - Session timeout
   - 2FA enforcement for admins
   - Rate limiting
   - CORS settings

**Screenshot location: Security settings**

**Recommended settings:**
- Require strong passwords (8+ chars, mixed case, numbers)
- Session timeout: 7 days
- 2FA required for admins
- Rate limit: 5 requests/hour for contact forms

## Security & Compliance

Maintain platform security and compliance with regulations.

### Audit Logs

**View all platform actions:**
1. Click "Logs" → "Audit Log"
2. See chronological record of:
   - Admin actions
   - User account changes
   - Church modifications
   - Review moderation
   - Verification decisions
   - System changes

**Screenshot location: Audit log**

**Log details include:**
- Timestamp
- Admin user who performed action
- Action type
- Target (user, church, review, etc.)
- Before/after values
- IP address
- Additional notes

**Filtering:**
- By date range
- By admin user
- By action type
- By target

**Use cases:**
- Investigate issues
- Compliance audits
- Security reviews
- Accountability

### Security Monitoring

**Monitor security events:**
1. Click "Logs" → "Security"
2. View:
   - Failed login attempts
   - Suspicious activity
   - Rate limit violations
   - Access from new locations
   - Permission changes

**Screenshot location: Security log**

**Alerts for:**
- Multiple failed logins (possible brute force)
- Admin permission changes
- Unusual access patterns
- Mass data exports

**Response procedures:**
1. Investigate flagged events
2. Contact user if needed
3. Suspend account if compromised
4. Update security measures
5. Document incident

### Data Privacy (GDPR)

**User data requests:**

**Data Export Request:**
1. User emails requesting their data
2. Click "Users" → Find user → "Export Data"
3. Generate export package (all user data)
4. Send to user via secure method

**Screenshot location: Export user data**

**Data Deletion Request:**
1. User requests account deletion
2. Verify identity
3. Click "Users" → Find user → "Delete Account"
4. Select "Hard Delete" (permanent)
5. Confirm deletion
6. Email confirmation to user

**Data retention:**
- Soft deleted data: 90 days
- Hard deleted data: Immediate
- Audit logs: 7 years
- Financial records: Per regulations

### Compliance Checklist

**Regular compliance tasks:**

**Weekly:**
- [ ] Review flagged content
- [ ] Check for privacy complaints
- [ ] Monitor security logs

**Monthly:**
- [ ] Audit admin access
- [ ] Review data retention
- [ ] Check email deliverability
- [ ] Verify backup integrity

**Quarterly:**
- [ ] Security audit
- [ ] Privacy policy review
- [ ] Terms of service review
- [ ] Compliance training

**Annually:**
- [ ] Full security assessment
- [ ] Third-party audit
- [ ] Update legal documents
- [ ] Review all admin accounts

## Troubleshooting

### Common Admin Issues

#### Can't Access Admin Dashboard

**Problem:** Admin login not working

**Solutions:**
1. Verify admin role in database
2. Clear browser cache
3. Try different browser
4. Check session timeout
5. Reset password
6. Contact platform owner

#### Changes Not Saving

**Problem:** Form submissions failing

**Solutions:**
1. Check for error messages
2. Verify all required fields
3. Check database connection
4. Review error logs (Sentry)
5. Try smaller batch of changes
6. Contact technical support

#### Email Notifications Not Sending

**Problem:** Users not receiving emails

**Solutions:**
1. Check Resend dashboard for failures
2. Verify email templates
3. Check email rate limits
4. Review spam complaints
5. Verify sender domain authentication
6. Check recipient email addresses

#### Slow Performance

**Problem:** Admin dashboard loading slowly

**Solutions:**
1. Check database performance
2. Review recent data growth
3. Clear application cache
4. Optimize slow queries
5. Check server resources (Render)
6. Contact technical support

### Getting Technical Support

**For technical issues:**
- Email: tech@churchconnect.jp
- Include: Error messages, screenshots, steps to reproduce

**For urgent issues:**
- Email: urgent@churchconnect.jp
- Include: "URGENT" in subject
- Describe impact on users

**Before contacting support:**
1. Check audit logs for errors
2. Review Sentry for exceptions
3. Check system status page
4. Try basic troubleshooting
5. Document the issue

### Emergency Procedures

#### Site Down

**Response:**
1. Check Render status dashboard
2. Check database connection
3. Review recent deployments
4. Check error logs
5. Contact hosting support if needed
6. Update status page
7. Communicate with users

#### Data Breach

**Response:**
1. Immediately document incident
2. Identify scope of breach
3. Contain breach (suspend access)
4. Notify affected users
5. Reset compromised credentials
6. File security incident report
7. Review and improve security

#### Payment Processing Failure

**Response:**
1. Check Stripe dashboard
2. Verify webhook endpoint
3. Review failed payments
4. Contact affected donors
5. Document issue
6. Fix underlying problem
7. Process manual refunds if needed

---

## Quick Reference

### Daily Admin Tasks
- [ ] Review moderation queue
- [ ] Check verification requests
- [ ] Monitor flagged content
- [ ] Check security alerts
- [ ] Review recent donations

### Weekly Admin Tasks
- [ ] Review analytics trends
- [ ] Audit new church registrations
- [ ] Check email deliverability
- [ ] Review failed payments
- [ ] Export weekly reports

### Monthly Admin Tasks
- [ ] Generate monthly reports
- [ ] Review admin access
- [ ] Audit security logs
- [ ] Check compliance items
- [ ] Update documentation

### Quarterly Admin Tasks
- [ ] Full platform audit
- [ ] Review terms and policies
- [ ] Security assessment
- [ ] User feedback review
- [ ] Feature planning

---

**Emergency Contact:** urgent@churchconnect.jp

**Technical Support:** tech@churchconnect.jp

**Platform Owner:** admin@churchconnect.jp

---

**Thank you for maintaining ChurchConnect Japan!** Your work helps connect people with churches and furthers God's kingdom. 🙏
