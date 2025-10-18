# Client Availability Display System - Implementation Complete

## Overview

A visual availability management system for controlling what time slots clients can see and book. This system:

- Shows a **visual weekly calendar** with green time blocks for available slots
- Lets you **block specific dates** (vacations, days off, specific hours)
- **Does NOT restrict admin** - you can book appointments anytime
- **Only affects client-facing booking** - controls what clients see as available

## Database Schema

### WorkingHours Table

```prisma
model WorkingHours {
  id         String   @id @default(cuid())
  weekday    Int      // 0=Monday, 1=Tuesday, ..., 6=Sunday
  startTime  String   // "09:00" (HH:mm format)
  endTime    String   // "17:00" (HH:mm format)
  isActive   Boolean  @default(true)
  createdAt  DateTime @default(now())
  updatedAt  DateTime @updatedAt
}
```

### AvailabilityException Table

```prisma
model AvailabilityException {
  id        String        @id @default(cuid())
  type      ExceptionType
  startDate DateTime
  endDate   DateTime?
  startTime String?       // For PARTIAL_DAY
  endTime   String?       // For PARTIAL_DAY
  reason    String?
  createdAt DateTime      @default(now())
  updatedAt DateTime      @updatedAt
}

enum ExceptionType {
  FULL_DAY      // All day unavailable
  PARTIAL_DAY   // Specific hours unavailable
  DATE_RANGE    // Multiple days unavailable
}
```

## API Endpoints

### Working Hours

- `GET /api/working-hours` - List all weekly hours
- `POST /api/working-hours` - Create or bulk update working hours
- `PUT /api/working-hours/:id` - Update a specific block
- `DELETE /api/working-hours/:id` - Delete a block

### Availability Exceptions

- `GET /api/availability-exceptions` - List all exceptions
- `POST /api/availability-exceptions` - Create an exception
- `PUT /api/availability-exceptions/:id` - Update an exception
- `DELETE /api/availability-exceptions/:id` - Delete an exception

### Availability Check

- `GET /api/availability/check?startTime=...&endTime=...&excludeAppointmentId=...`
  - Returns availability status and any conflicts
- `GET /api/availability/slots?date=...&duration=...`
  - Returns available time slots for a specific date

## Visual UI

### `/availability` Page - New Design

A **highly visual** interface with three main sections:

#### 1. Quick Actions Bar

- **Preset buttons** for instant setup:
  - "Lun-Ven 9h-17h" - Standard workweek
  - "Toute la semaine 9h-17h" - 7 days a week
  - "Bloquer des dates" - Quick access to block dates

#### 2. Visual Weekly Calendar (Main Section)

- **7 columns** (one per day: Mon-Sun)
- Each day shows:
  - Day name and badge (e.g., "2 créneaux" or "Fermé")
  - **Green time blocks** showing available slots
    - Start time prominently displayed
    - End time below
    - Hover to see edit/delete buttons
  - **"+ Ajouter" button** to add more time blocks
- **Color coding**:
  - 🟢 Green = Available for clients
  - ⚪ Gray = Day is closed

#### 3. Blocked Dates Section

- **Card-based layout** showing all blocked periods
- Each card displays:
  - Date or date range
  - Time (if partial day block)
  - Reason (optional note)
  - Delete button on hover
- **Visual indicators**:
  - 🔴 Red background for blocked dates
  - Clear icon when no blocks exist

### Navigation

"Disponibilité" link in sidebar with Clock icon

## How It Works

### For Admin (You)

- ✅ **No restrictions** - You can create/edit appointments at ANY time
- ✅ Book appointments outside working hours if needed
- ✅ Override blocked dates for special cases
- ✅ Full control over your schedule

### For Clients (Future Implementation)

When you create a client-facing booking page:

- ❌ Clients can **only see** time slots marked as available (green blocks)
- ❌ Blocked dates are **hidden** from their view
- ❌ They **cannot book** outside your defined availability
- ✅ Prevents scheduling conflicts and unwanted bookings

### The Availability Check API

The system provides `/api/availability/check` and `/api/availability/slots` endpoints that:

- Return which time slots are available based on your settings
- Consider working hours + blocked dates + existing appointments
- Will be used for client booking interfaces (future feature)

## Features

### Working Hours Management

- ✅ Set different hours for each day of the week
- ✅ Multiple time blocks per day (e.g., 9-12, 14-18)
- ✅ Enable/disable without deleting
- ✅ Quick presets for common schedules
- ✅ 15-minute granularity

### Exception Management

- ✅ Full day off
- ✅ Partial hours (e.g., doctor appointment 14:00-16:00)
- ✅ Date ranges (e.g., vacation Aug 1-15)
- ✅ Optional reason field
- ✅ Edit and delete existing exceptions

### Availability Checking

- ✅ Real-time validation during appointment creation
- ✅ Considers working hours, exceptions, and existing bookings
- ✅ Excludes current appointment when editing
- ✅ Detailed conflict information in responses

## How to Use

### Quick Start - Setting Up Your Availability

1. Navigate to `/availability` from the sidebar
2. Click **"Lun-Ven 9h-17h"** quick preset (or customize each day)
3. Your weekly availability is now visible!

### Adding Custom Time Blocks

1. Look at the day you want to configure
2. Click **"+ Ajouter"** button below that day
3. Select start and end times (15-minute intervals)
4. Click **"Enregistrer"**
5. The green block appears immediately!

### Editing Existing Blocks

1. Hover over any green time block
2. Click the **pencil icon** to edit
3. Or click the **trash icon** to delete

### Blocking Dates (Vacations, Days Off)

1. Click **"Bloquer des dates"** in the quick actions
2. Choose the type:
   - **Journée(s) complète(s)**: Block full day(s)
   - **Créneaux horaires spécifiques**: Block specific hours on a day
   - **Plage de dates (vacances)**: Block multiple consecutive days
3. Select date(s) using the calendar picker
4. Add optional reason (e.g., "En vacances", "Formation")
5. Click **"Bloquer"**
6. The blocked period appears in red cards below

### Creating Admin Appointments

- ✅ Continue using the calendar as normal
- ✅ No restrictions apply to you
- ✅ Book any time, any day

## Technical Notes

### Timezone Handling

- Currently uses browser/server timezone
- All times stored in local format (HH:mm for recurring, DateTime for specific dates)
- Weekday calculation: `(date.getDay() + 6) % 7` converts Sunday=0 to Monday=0

### Performance

- Indexed fields: `weekday`, `startDate`, `endDate`, `status`
- Efficient conflict detection using date range queries
- Batch operations for recurring appointments

### Edge Cases Handled

- Appointment updates exclude self from conflict check
- Cancelled appointments don't block availability
- Partial day exceptions use time comparison
- Date ranges handle single and multi-day periods

## Files Created/Modified

### New Files

- `/lib/actions/availability.ts` - Server actions for availability management
- `/app/api/working-hours/route.ts` - API for working hours CRUD
- `/app/api/working-hours/[id]/route.ts` - API for individual working hour blocks
- `/app/api/availability-exceptions/route.ts` - API for blocked dates CRUD
- `/app/api/availability-exceptions/[id]/route.ts` - API for individual exceptions
- `/app/api/availability/check/route.ts` - Check if time slot is available
- `/app/api/availability/slots/route.ts` - Get all available slots for a date
- `/app/availability/page.tsx` - Main availability page
- `/app/components/availability/visual-availability-calendar.tsx` - **NEW visual component**

### Modified Files

- `/prisma/schema.prisma` - Added WorkingHours and AvailabilityException models
- `/lib/actions/appointments.ts` - **REVERTED**: No restrictions on admin bookings
- `/app/api/appointments/instant/route.ts` - **REVERTED**: No validation
- `/app/components/layout/app-sidebar.tsx` - Added Disponibilité nav link

### Removed Files (Replaced with Visual Component)

- `~/app/components/availability/working-hours-editor.tsx` - Old UI
- `~/app/components/availability/exceptions-manager.tsx` - Old UI

## Migration Applied

```bash
npx prisma migrate dev --name add_availability_system
```

## Next Steps

1. **Restart your dev server** (if needed, to clear Prisma cache)
2. Visit **`/availability`** in your dashboard
3. Use **quick presets** to set up initial availability
4. **Customize** each day with your actual schedule
5. **Block specific dates** for vacations or time off

## What's Different from Before

### ✅ Improvements

- **Much more visual** - See availability at a glance with color-coded blocks
- **Simplified workflow** - Add/edit blocks directly from the weekly view
- **Better UX** - Hover interactions, quick presets, clear visual feedback
- **No admin restrictions** - You can book appointments anytime regardless of availability settings

### ❌ Removed

- Old table-based UI (replaced with visual calendar)
- Validation on admin appointment creation (you have full freedom)
- Complex edit modes (replaced with simple click-to-edit)

## Future Enhancements

When you want to add a **client-facing booking page**:

- [ ] Public booking page at `/book/:providerId`
- [ ] Client sees only green available slots
- [ ] Automatic conflict prevention for clients
- [ ] Optional: Buffer time between appointments
- [ ] Optional: Different availability rules per appointment type
- [ ] Optional: Integration with external calendars (Google Calendar)

---

## Summary

**This is now a CLIENT-AVAILABILITY display system**, not an admin restriction system:

- 🟢 **Green blocks** = What clients will see as available
- 🔴 **Red blocks** = Dates clients cannot book
- 👤 **You (admin)** = Can book anytime, anywhere

**Perfect for**: Showing clients when they can book, while keeping full admin flexibility!

---

**Ready to use!** 🎉 Visit `/availability` to get started.
