# Attendance System Multi-Session Migration Guide

## Overview
The attendance system has been updated to support multiple work sessions per day, allowing staff to clock in and out multiple times (e.g., for lunch breaks) with accurate hour tracking.

## Database Migration Required

### Why Migration is Needed
The old database has a unique index on `user` and `date` that prevents multiple attendance records per day. This index must be dropped and replaced with a new index that includes `sessionNumber`.

###Method 1: Using the Migration API Endpoint (Recommended)

As an **Admin user**, call the migration endpoint once:

```bash
POST /api/admin/migrate-attendance
```

Or use this curl command while logged in as admin:
```bash
curl -X POST https://your-domain.com/api/admin/migrate-attendance \
  -H "Content-Type: application/json" \
  -H "Cookie: next-auth.session-token=YOUR_SESSION_TOKEN"
```

### Method 2: Manual MongoDB Command

If you have direct access to MongoDB, run this command:

```javascript
// Connect to your MongoDB database
use your_database_name;

// Drop the old index
db.attendances.dropIndex("user_1_date_1");

// Create the new index
db.attendances.createIndex(
  { user: 1, date: 1, sessionNumber: 1 },
  { unique: true }
);
```

## Changes Made

### 1. Attendance Model (`src/models/Attendance.ts`)
- Added `sessionNumber` field to track multiple sessions per day
- Updated unique index from `{user, date}` to `{user, date, sessionNumber}`

### 2. API Routes (`src/app/api/attendance/route.ts`)

**POST /api/attendance (Clock In):**
- Now creates a NEW attendance record for each clock-in
- Prevents clocking in if there's already an active session
- Automatically increments session number

**PUT /api/attendance (Clock Out):**
- Finds the active session (clockOut is null)
- Calculates hours for THIS session only
- Determines status based on TOTAL hours for the day

**GET /api/attendance:**
- Returns grouped attendance records with total hours
- Includes all sessions in the `sessions` array
- Provides `activeSession` and `totalHours` for easy UI rendering

### 3. Header Component (`src/core/common-components/header/header.tsx`)
- Changed from `todayAttendance` to `activeSession` and `totalHours`
- Displays total hours worked today (sum of all sessions)
- Shows appropriate buttons based on active session status

### 4. Attendance Dashboard (`src/app/(pages)/(manage-module)/attendance/page.tsx`)
- Displays total hours for each user/date
- Shows session count
- Expandable rows to view all sessions for a day

## Testing the Flow

After running the migration:

1. **Clock In** (First Session)
   - User clicks "Clock In" → Creates Session 1
   - Header shows: "Clocked in at 08:00 AM"

2. **Clock Out** (Break)
   - User clicks "Clock Out" → Closes Session 1 (4 hours)
   - Header shows: "Last clock-out: 12:00 PM" and "Total hours today: 4.00 hrs"

3. **Clock In** (Second Session)
   - User clicks "Clock In" → Creates Session 2
   - Header shows: "Clocked in at 01:00 PM" and "Total hours today: 4.00 hrs"

4. **Clock Out** (End of Day)
   - User clicks "Clock Out" → Closes Session 2 (4 hours)
   - Header shows: "Total hours today: 8.00 hrs"

5. **Admin View**
   - Dashboard shows total: 8.00 hours
   - Click to expand shows both sessions:
     - Session 1: 08:00 AM - 12:00 PM (4.00 hrs)
     - Session 2: 01:00 PM - 05:00 PM (4.00 hrs)

## Benefits

✅ **Accurate Hour Tracking** - Break times are excluded from work hours
✅ **Multiple Sessions** - Supports flexible work schedules
✅ **Transparent Reporting** - Admin can see all sessions per day
✅ **Prevents Errors** - Can't clock in twice without clocking out first
✅ **Auto Clock-Out** - Logout automatically closes active sessions

## Troubleshooting

**Error: "E11000 duplicate key error"**
- This means the old index still exists
- Run the migration endpoint or manually drop the index

**Error: "Already clocked in"**
- You have an active session without a clock-out
- Clock out first, then clock in again

**Error: "No active session found"**
- You're trying to clock out without an active session
- Clock in first before clocking out
