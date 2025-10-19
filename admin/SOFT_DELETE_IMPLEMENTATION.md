# Soft Delete Implementation for Clients

## Overview

A soft delete system has been implemented for the `Client` model to handle cases where clients have associated data (appointments, invoices, etc.). Instead of hard deleting clients and losing their history, the system now intelligently handles deletions:

- **No constraints**: Hard delete the client (completely removed from database)
- **Has constraints**: Soft delete the client (marked as deleted, data preserved)

## What Changed

### 1. Database Schema

**File**: `packages/prisma/schema.prisma`

Added a new column to the `Client` model:

```prisma
model Client {
  // ... existing fields ...
  deleted Boolean @default(false) // Soft delete flag
  // ... existing fields ...
  @@index([deleted])
}
```

**Migration**: Applied automatically - `add_soft_delete_to_client`

### 2. Delete Logic

**File**: `admin/lib/actions/clients.ts`

```typescript
export async function deleteClient(clientId: string) {
  // 1. Count appointments and invoices
  const appointmentCount = await prisma.appointment.count({
    where: { clientId },
  });

  const invoiceCount = await prisma.invoice.count({
    where: { clientId },
  });

  // 2. If no constraints → hard delete
  if (appointmentCount === 0 && invoiceCount === 0) {
    await prisma.client.delete({
      where: { id: clientId },
    });
    return "Client deleted successfully";
  }

  // 3. If has constraints → soft delete
  await prisma.client.update({
    where: { id: clientId },
    data: { deleted: true },
  });
  return "Client archived successfully (has appointments/invoices)";
}
```

### 3. All Client Queries Updated

Every `prisma.client.find*()` query now includes `deleted: false` filter:

#### Files Updated:

1. **`admin/lib/actions/clients.ts`** ✅
   - `getClients()` - Excludes deleted clients

2. **`admin/app/api/clients/[id]/route.ts`** ✅
   - GET endpoint filters out deleted clients

3. **`admin/app/api/appointments/instant/route.ts`** ✅
   - When creating instant appointments, only shows active clients

4. **`admin/lib/actions/approvals.ts`** ✅
   - `getPendingClients()` - Excludes deleted clients

5. **`client/app/api/appointments/route.ts`** ✅
   - When booking appointments, excludes deleted clients

## How It Works

### Scenario 1: Delete Client with No Data

```
Before: Client has 0 appointments, 0 invoices
Action: Click delete
Result:
  ✅ Hard delete (completely removed)
  ✅ Data cleared from database
  ✅ Email, name, etc. all gone
```

### Scenario 2: Delete Client with Data

```
Before: Client has 3 appointments, 1 invoice
Action: Click delete
Result:
  ✅ Soft delete (marked deleted = true)
  ✅ Historical data preserved
  ✅ Cannot be selected for new appointments
  ✅ Can view past appointments/invoices
  ✅ Admin sees message: "Client archived successfully"
```

## Query Pattern

All client queries follow this pattern:

```typescript
// BEFORE
const clients = await prisma.client.findMany({
  where: { confirmed: true },
});

// AFTER
const clients = await prisma.client.findMany({
  where: {
    confirmed: true,
    deleted: false, // ← Always added
  },
});
```

## Important: Index

An index was added on the `deleted` column for performance:

```prisma
@@index([deleted])
```

This ensures queries filtering by `deleted: false` are fast even with many clients.

## Verification Checklist

### Schema ✅

- [x] `deleted` column added to Client model
- [x] Default value is `false`
- [x] Index created on `deleted` column

### Delete Function ✅

- [x] Counts appointments before delete
- [x] Counts invoices before delete
- [x] Hard deletes if no constraints
- [x] Soft deletes if has constraints
- [x] Returns appropriate message

### All Queries ✅

- [x] `admin/lib/actions/clients.ts` - getClients()
- [x] `admin/app/api/clients/[id]/route.ts` - GET single client
- [x] `admin/app/api/appointments/instant/route.ts` - Create instant appointment
- [x] `admin/lib/actions/approvals.ts` - getPendingClients()
- [x] `client/app/api/appointments/route.ts` - Book appointment

## Benefits

✅ **No more "Foreign Key Violations"** when trying to delete clients with data
✅ **Historical data preserved** for audit trail and reporting
✅ **Clean interface** - Deleted clients hidden from lists
✅ **Reversible** - Can query deleted clients if needed
✅ **Database integrity** - No constraint violations
✅ **Better UX** - Clear feedback about what happened

## Testing

### Test Hard Delete (No Constraints)

1. Create a client without appointments/invoices
2. Click delete
3. Expected: Client removed completely
4. Verify: Cannot find in database or UI

### Test Soft Delete (Has Constraints)

1. Create a client with an appointment
2. Click delete
3. Expected: "Client archived successfully" message
4. Verify: Client no longer visible in active list
5. Verify: Appointment data still accessible
6. Check database: `deleted = true`

## Filtering Deleted Clients (Advanced)

To retrieve deleted clients (for admin viewing):

```typescript
// Show only deleted clients
const deletedClients = await prisma.client.findMany({
  where: {
    deleted: true, // Flip the filter
  },
});

// Show all clients including deleted (for reporting)
const allClients = await prisma.client.findMany({
  where: {}, // No filter
});
```

## Edge Cases Handled

✅ Client with multiple appointments → Soft deleted
✅ Client with invoices → Soft deleted
✅ Client with both appointments and invoices → Soft deleted
✅ Client with no data → Hard deleted
✅ Creating appointment for deleted client → Prevented
✅ Approving deleted client → Prevented
✅ Re-activation → Would require additional endpoint (currently not implemented)

## Future Improvements

Optional additions:

1. **Admin endpoint** to view deleted clients
2. **Restore functionality** to un-delete clients
3. **Permanent delete** option for admins to hard delete archived clients
4. **Audit log** tracking who deleted when
5. **Scheduled cleanup** to hard delete soft-deleted clients after X days

## Notes

- Soft deleted clients are completely hidden from normal operations
- They don't appear in dropdowns, lists, or approval screens
- Their data (appointments, invoices) remains intact
- The system is transparent - users get clear feedback
