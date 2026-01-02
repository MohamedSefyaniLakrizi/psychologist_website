# Multi-Tenant Migration Guide

## Overview

This guide walks you through converting your single-tenant psychologist website to a multi-tenant SaaS application where multiple practices can use the same system with complete data isolation.

## Architecture Changes

### 1. Database Schema Changes

#### New Models

- **Tenant**: Represents a practice/office with subscription and payment info
- **User**: Represents individual users who can log in (multiple users per tenant)

#### Updated Models

All data models now include `tenantId` to ensure data isolation:

- Client
- Appointment
- Invoice
- Note
- WeeklyAvailability
- DateAvailability

### 2. Authentication Changes

The system now supports:

- **Google OAuth**: For existing Google sign-ins
- **Credentials**: Email/password login for users

Each user must belong to a tenant, and the tenantId is stored in the session.

### 3. Data Isolation Strategy

**Automatic Tenant Filtering**: Use the `tenant-context.ts` utility helpers to automatically inject tenantId into all database queries.

## Migration Steps

### Step 1: Install Required Dependencies

```bash
cd /home/mohamed/Desktop/work/next/psychologist_website/admin
npm install bcryptjs @types/bcryptjs
```

### Step 2: Run Prisma Migration

```bash
cd /home/mohamed/Desktop/work/next/psychologist_website/packages/prisma
npx prisma migrate dev --name add_multi_tenant_support
```

This will:

1. Create Tenant and User tables
2. Add tenantId to all existing models
3. Update indexes and constraints

### Step 3: Migrate Existing Data

You need to create a migration script to:

1. Create a default Tenant for your existing data
2. Create a User record linked to that tenant
3. Update all existing records to have the tenantId

```typescript
// migration-script.ts
import { prisma } from "./lib/prisma";

async function migrateToMultiTenant() {
  console.log("Starting multi-tenant migration...");

  // 1. Create default tenant
  const tenant = await prisma.tenant.create({
    data: {
      officeName: "Your Practice Name",
      firstName: "Your",
      lastName: "Name",
      email: process.env.AUTHORIZED_GOOGLE_EMAIL!,
      phoneNumber: "Your Phone",
      country: "Your Country",
      address: "Your Address",
      paymentStatus: "ACTIVE",
      subscriptionTier: "PROFESSIONAL",
    },
  });

  console.log("Created tenant:", tenant.id);

  // 2. Create default user
  const user = await prisma.user.create({
    data: {
      tenantId: tenant.id,
      email: process.env.AUTHORIZED_GOOGLE_EMAIL!,
      firstName: "Your",
      lastName: "Name",
      role: "OWNER",
      provider: "google",
    },
  });

  console.log("Created user:", user.id);

  // 3. Update all existing clients
  await prisma.client.updateMany({
    data: { tenantId: tenant.id },
  });

  // 4. Update all existing appointments
  await prisma.appointment.updateMany({
    data: { tenantId: tenant.id },
  });

  // 5. Update all existing invoices
  await prisma.invoice.updateMany({
    data: { tenantId: tenant.id },
  });

  // 6. Update all existing notes
  await prisma.note.updateMany({
    data: { tenantId: tenant.id },
  });

  // 7. Update all weekly availability
  await prisma.weeklyAvailability.updateMany({
    data: { tenantId: tenant.id },
  });

  // 8. Update all date availability
  await prisma.dateAvailability.updateMany({
    data: { tenantId: tenant.id },
  });

  console.log("Migration completed successfully!");
}

migrateToMultiTenant()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
```

Run it:

```bash
npx tsx migration-script.ts
```

### Step 4: Update Authentication

Replace your current auth configuration with the multi-tenant version:

```typescript
// admin/lib/auth.ts
// Replace with contents from auth-multitenant.ts
```

### Step 5: Update Server Actions

Update all server actions to use tenant context. Example:

**Before:**

```typescript
export async function getClients() {
  return await prisma.client.findMany({
    where: { deleted: false },
  });
}
```

**After:**

```typescript
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { requireTenantId, withTenantFilter } from "@/lib/tenant-context";

export async function getClients() {
  const session = await getServerSession(authOptions);
  const tenantId = requireTenantId(session?.user?.tenantId);

  return await prisma.client.findMany({
    where: withTenantFilter(tenantId, { deleted: false }),
  });
}
```

### Step 6: Update Type Definitions

Update `next-auth.d.ts`:

```typescript
// types/next-auth.d.ts
import { DefaultSession } from "next-auth";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      tenantId: string;
      role: string;
    } & DefaultSession["user"];
  }
}
```

### Step 7: Update API Routes

Add tenant filtering to all API routes:

```typescript
// Example: app/api/clients/route.ts
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { requireTenantId } from "@/lib/tenant-context";

export async function GET(request: Request) {
  const session = await getServerSession(authOptions);
  const tenantId = requireTenantId(session?.user?.tenantId);

  const clients = await prisma.client.findMany({
    where: { tenantId, deleted: false },
  });

  return Response.json(clients);
}
```

## Testing Multi-Tenant Isolation

### Test 1: Create Second Tenant

```typescript
const tenant2 = await prisma.tenant.create({
  data: {
    officeName: "Test Practice",
    firstName: "Test",
    lastName: "User",
    email: "test@example.com",
    phoneNumber: "123456789",
    country: "Morocco",
  },
});
```

### Test 2: Verify Data Isolation

1. Log in as Tenant 1
2. Create a client
3. Log in as Tenant 2
4. Verify you cannot see Tenant 1's client

## Security Checklist

- [ ] All queries include tenantId filtering
- [ ] Session includes tenantId
- [ ] Middleware validates tenantId
- [ ] API routes check tenantId
- [ ] No raw SQL queries bypass tenant filtering
- [ ] File uploads are tenant-scoped
- [ ] Scheduled jobs respect tenant boundaries

## Additional Features to Implement

### 1. Tenant Registration Flow

Create a registration page where new tenants can sign up:

- Collect office information
- Set up initial user account
- Start free trial period

### 2. Subscription Management

- Payment processing integration (Stripe, PayPal)
- Subscription tier enforcement
- Payment deadline monitoring
- Auto-suspend on non-payment

### 3. User Management UI

- Allow tenant owners to invite team members
- Role-based permissions (Owner, Admin, Therapist, Assistant)
- User activation/deactivation

### 4. Tenant Settings Page

- Update office information
- Manage subscription
- Configure email templates
- Set availability defaults

## Common Pitfalls

1. **Forgetting tenantId in queries**: Always use `withTenantFilter` helper
2. **Hardcoding tenant data**: Never hardcode tenantId values
3. **Sharing sessions across tenants**: Ensure logout clears all session data
4. **Cross-tenant references**: Validate all relationship IDs belong to same tenant
5. **Scheduled jobs**: Always pass tenantId to background jobs

## Performance Considerations

1. **Indexes**: All tenantId fields are indexed for fast filtering
2. **Connection pooling**: Consider tenant-aware connection pooling
3. **Caching**: Include tenantId in all cache keys
4. **Database scaling**: Consider sharding by tenantId for very large deployments

## Rollback Plan

If issues arise:

1. **Keep backup** of database before migration
2. **Migration rollback**:
   ```bash
   npx prisma migrate resolve --rolled-back MIGRATION_NAME
   ```
3. **Restore from backup** if needed

## Support

For issues:

1. Check error logs for tenant context issues
2. Verify session contains tenantId
3. Ensure all queries use tenant helpers
4. Test with multiple tenants to verify isolation

## Next Steps

After migration:

1. Test all features with multiple tenants
2. Implement tenant registration UI
3. Add subscription payment integration
4. Create admin dashboard for tenant management
5. Implement usage analytics per tenant
