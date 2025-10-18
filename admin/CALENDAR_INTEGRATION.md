# Calendar Integration with Prisma - Updated with Start/End Times

This document explains how the calendar has been updated to work with your Prisma database using the Appointment and Client models, now with separate start and end times.

## Latest Updates (Start/End Times)

### 🆕 Prisma Schema Changes

- **Updated Appointment Model**: Changed from single `dateTime` field to separate `startTime` and `endTime` fields
- **Database Migration Applied**: `init_with_start_end_times` migration successfully applied
- **Default Behavior**: End time defaults to start time + 1 hour

### 🆕 Updated Components

- **Appointment Schema**: Now validates both start and end times with validation that end time must be after start time
- **Appointment Dialog**: Updated to include separate start time and end time inputs with automatic end time calculation
- **Calendar Context**: Updated to handle start/end time parameters in all appointment functions
- **Appointment Actions**: All CRUD operations now work with start/end times instead of single dateTime

# Calendar Integration with Prisma

This document explains how the calendar has been updated to work with your Prisma database using the Appointment and Client models.

## Changes Made

### 1. Updated Interfaces (`interfaces.ts`)

- Changed `IEvent.id` from `number` to `string` to match Prisma's `cuid()`
- Added appointment-specific fields to `IEvent`:
  - `clientId`, `rate`, `format`, `isCompleted`, `notes`, `createdAt`, `updatedAt`
- Updated `IUser` interface to include client information:
  - `email`, `phoneNumber`, `preferredContact`

### 2. New Appointment Actions (`lib/actions/appointments.ts`)

- `getAppointments()`: Fetches all appointments with client data
- `getClients()`: Fetches all clients for selection
- `createAppointment()`: Creates new appointments
- `updateAppointment()`: Updates existing appointments
- `deleteAppointment()`: Removes appointments

### 3. Updated Calendar Context (`calendar-context.tsx`)

- Added async event management functions
- Added loading states and error handling
- Updated function signatures to work with Prisma data

### 4. New Appointment Dialog (`add-edit-appointment-dialog.tsx`)

- Client selection dropdown
- Date/time picker
- Rate input
- Format selection (Online/Face-to-Face)
- Proper form validation with Zod

### 5. Updated Calendar Component (`calendar.tsx`)

- ✅ **Removed Mock Data**: Completely removed all mock data references
- Now exclusively uses `getAppointments()` and `getClients()` from Prisma
- Removed old `requests.ts` file that contained mock data

## Usage Examples

### Creating a New Appointment

```tsx
import { AddEditAppointmentDialog } from "@/app/components/calendar/dialogs/add-edit-appointment-dialog";

// In your component
<AddEditAppointmentDialog>
  <Button>Add Appointment</Button>
</AddEditAppointmentDialog>;
```

### Using the Calendar Context

```tsx
const { addEvent, updateEvent, removeEvent, isLoading, error } = useCalendar();

// Create appointment
await addEvent({
  clientId: "client_id_here",
  dateTime: new Date("2025-09-25T14:00:00"),
  rate: 100,
  format: "ONLINE",
});

// Update appointment
await updateEvent("appointment_id", {
  dateTime: new Date("2025-09-25T15:00:00"),
  rate: 120,
  isCompleted: true,
});

// Delete appointment
await removeEvent("appointment_id");
```

### Displaying Appointments

The calendar will automatically display appointments as events with:

- Title: Client's full name
- Color: Green for completed, blue for pending
- Description: Format and rate information

## Database Requirements

Make sure your database has the following:

1. Clients with required fields (firstName, lastName, email, etc.)
2. Proper Prisma client setup with the schema provided
3. Database connection configured in your environment

## Error Handling

The calendar now includes:

- Loading states during async operations
- Error messages for failed operations
- Toast notifications for user feedback
- Proper error boundaries

## Next Steps

1. Ensure you have clients in your database
2. Test creating appointments through the new dialog
3. Verify appointments display correctly in calendar views
4. Add additional features like:
   - Appointment status management
   - Client filtering
   - Notes integration
   - Document attachments
