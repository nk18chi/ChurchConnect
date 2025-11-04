# Complete GraphQL API Implementation Plan

## Overview
Implement all missing GraphQL queries and mutations for ChurchConnect.

**Status:** Ready for execution
**Estimated Time:** 4-6 hours
**Tasks:** 8 main tasks

---

## Task 1: Add Authentication Mutations (login/logout)

**What:** Add login and logout mutations to complement the existing register mutation.

**Why:** Users need to be able to log in and log out. Currently only registration exists.

**Steps:**

1. Update `packages/graphql/src/types/user.ts`:
   - Add `login` mutation that validates credentials and returns AuthResponse
   - Add `logout` mutation that clears the session
   - Use NextAuth's `signIn` and `signOut` functions

2. Login mutation should:
   - Accept email and password
   - Validate credentials using NextAuth
   - Return success/failure with user data

3. Logout mutation should:
   - Clear the session
   - Return success status

**Verification:**
```bash
# Test in GraphQL playground or via curl
# Login mutation should authenticate user
# Logout mutation should clear session
```

---

## Task 2: Add Church Profile Mutations

**What:** Add mutations for church admins to update their church profile.

**Why:** Church admins need to manage all 10 profile content sections.

**Steps:**

1. Create input types in `packages/graphql/src/types/church-profile.ts`:
   - `UpdateChurchProfileInput` with all profile fields
   - `UpdateChurchBasicInfoInput` for basic church details

2. Add mutations:
   - `updateChurchProfile` - Update profile content (whoWeAre, vision, etc.)
   - `updateChurchBasicInfo` - Update name, address, contact info
   - `updateChurchHeroImage` - Update hero image URL

3. Add authorization:
   - Check user is CHURCH_ADMIN
   - Verify user owns the church they're updating

**Verification:**
- Church admin can update all profile fields
- Non-admins cannot update profiles
- Updates are persisted to database

---

## Task 3: Add Staff CRUD Mutations

**What:** Add full CRUD operations for church staff management.

**Why:** Church admins need to add, edit, reorder, and remove staff members.

**Steps:**

1. Create input types in `packages/graphql/src/types/church-staff.ts`:
   - `CreateStaffInput`
   - `UpdateStaffInput`
   - `ReorderStaffInput`

2. Add mutations:
   - `createStaff` - Add new staff member
   - `updateStaff` - Edit existing staff member
   - `deleteStaff` - Remove staff member
   - `reorderStaff` - Change display order

3. Add authorization:
   - Check user is CHURCH_ADMIN for their church
   - Validate all staff belong to user's church

**Verification:**
- Can create, read, update, delete staff
- Can reorder staff members
- Only church admin can manage their own staff

---

## Task 4: Add Sermon CRUD Mutations

**What:** Add full CRUD operations for sermons.

**Why:** Church admins need to manage their sermon archive.

**Steps:**

1. Create input types in `packages/graphql/src/types/sermon.ts`:
   - `CreateSermonInput`
   - `UpdateSermonInput`

2. Add mutations:
   - `createSermon` - Add new sermon
   - `updateSermon` - Edit existing sermon
   - `deleteSermon` - Remove sermon

3. Add query:
   - `sermons` - List sermons with filtering by churchId

**Verification:**
- Can create, read, update, delete sermons
- Sermons ordered by date descending
- Only church admin can manage their own sermons

---

## Task 5: Add Event CRUD Mutations

**What:** Add full CRUD operations for events.

**Why:** Church admins need to manage their events calendar.

**Steps:**

1. Create input types in `packages/graphql/src/types/event.ts`:
   - `CreateEventInput`
   - `UpdateEventInput`

2. Add mutations:
   - `createEvent` - Add new event
   - `updateEvent` - Edit existing event
   - `deleteEvent` - Remove event

3. Add query:
   - `events` - List events with filtering (upcoming, past, by church)

**Verification:**
- Can create, read, update, delete events
- Can filter upcoming vs past events
- Only church admin can manage their own events

---

## Task 6: Add Service Time CRUD Mutations

**What:** Add full CRUD operations for service times.

**Why:** Church admins need to configure their service schedule.

**Steps:**

1. Create input types in `packages/graphql/src/types/service-time.ts`:
   - `CreateServiceTimeInput`
   - `UpdateServiceTimeInput`

2. Add mutations:
   - `createServiceTime` - Add new service time
   - `updateServiceTime` - Edit existing service time
   - `deleteServiceTime` - Remove service time

3. Add validation:
   - dayOfWeek must be 0-6 (Sunday-Saturday)
   - startTime/endTime must be valid time strings

**Verification:**
- Can create, read, update, delete service times
- Service times ordered by day of week
- Only church admin can manage their own service times

---

## Task 7: Add Review Moderation Mutations

**What:** Add mutations for platform admins to moderate reviews.

**Why:** Platform admins need to approve/reject reviews and church admins need to respond.

**Steps:**

1. Create input types in `packages/graphql/src/types/review.ts`:
   - `ModerateReviewInput` (approve/reject with optional note)
   - `RespondToReviewInput` (church response)

2. Add mutations:
   - `approveReview` - Approve a pending review (ADMIN only)
   - `rejectReview` - Reject a pending review (ADMIN only)
   - `respondToReview` - Church admin responds to review
   - `deleteReviewResponse` - Remove church response

3. Add email notifications:
   - Send approval email to reviewer
   - Send notification to church when review approved
   - Use existing email templates

**Verification:**
- Only ADMIN can approve/reject reviews
- Only church admin can respond to their own church's reviews
- Email notifications sent on approval

---

## Task 8: Add Missing Entity Queries

**What:** Add query operations for all entities that are missing them.

**Why:** Frontend apps need to fetch data for display.

**Steps:**

1. Add to `packages/graphql/src/types/sermon.ts`:
   - `sermons` query with filtering (churchId, limit, offset)
   - `sermon` query by ID

2. Add to `packages/graphql/src/types/event.ts`:
   - `events` query with filtering (churchId, upcomingOnly, limit, offset)
   - `event` query by ID

3. Add to `packages/graphql/src/types/church-staff.ts`:
   - `churchStaff` query by churchId

4. Add to `packages/graphql/src/types/service-time.ts`:
   - `serviceTimes` query by churchId

5. Add to `packages/graphql/src/types/review.ts`:
   - `reviews` query with filtering (churchId, status, limit)
   - `review` query by ID

6. Add to `packages/graphql/src/types/church-photo.ts`:
   - `churchPhotos` query with filtering (churchId, category)

**Verification:**
- All queries return correct data
- Filtering works as expected
- Authorization applied where needed

---

## Testing Checklist

After all tasks complete:

- [ ] All queries return data correctly
- [ ] All mutations create/update/delete correctly
- [ ] Authorization prevents unauthorized access
- [ ] Email notifications sent where appropriate
- [ ] GraphQL schema validates
- [ ] API server starts without errors
- [ ] Can test all operations in GraphQL Playground

---

## Notes

- Use existing patterns from implemented mutations
- Follow authorization patterns (CHURCH_ADMIN, ADMIN roles)
- Use Prisma relations for efficient queries
- Add proper error messages
- Use existing email integration for notifications
