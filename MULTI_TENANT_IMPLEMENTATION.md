# Multi-Tenant System Implementation Summary

## 🎯 What Was Changed

Your single-tenant psychologist website has been prepared for multi-tenant (SaaS) conversion. Multiple practices can now use the same system with complete data isolation.

## 📁 New Files Created

### 1. **Schema Changes** (`packages/prisma/schema.prisma`)

- ✅ Added `Tenant` model with office info, subscription, and payment tracking
- ✅ Added `User` model for authentication (multiple users per tenant)
- ✅ Added `tenantId` to all data models (Client, Appointment, Invoice, Note, Availability)
- ✅ Added new enums: `PaymentStatus`, `SubscriptionTier`, `UserRole`

### 2. **Utility Files**

#### `/admin/lib/tenant-context.ts`

Helper functions for tenant-aware database queries:

- `requireTenantId()` - Validates and returns tenantId
- `withTenantFilter()` - Adds tenantId to where clauses
- `withTenantData()` - Adds tenantId to create operations
- `TenantPrisma` - Wrapper object with tenant-aware query helpers

#### `/admin/lib/session.ts`

Session management helpers:

- `getTenantId()` - Get current user's tenantId
- `requireTenantId()` - Get tenantId or throw error
- `getUserId()` - Get current user ID
- `getUserRole()` - Get current user's role
- `hasRole()` - Check user role
- `isAdmin()` - Check if user is owner/admin

#### `/admin/lib/auth-multitenant.ts`

New authentication configuration:

- Supports Google OAuth
- Supports email/password login
- Validates tenant payment status
- Stores tenantId and role in session
- Handles tenant-aware sign-in flow

#### `/admin/types/next-auth-multitenant.d.ts`

TypeScript definitions:

- Extended Session type with `tenantId` and `role`
- Extended User type with tenant information
- Extended JWT type for token storage

### 3. **Documentation**

#### `MULTI_TENANT_MIGRATION_GUIDE.md`

Comprehensive guide covering:

- Architecture overview
- Step-by-step migration process
- Data migration script
- Code update patterns
- Testing procedures
- Security checklist
- Common pitfalls
- Performance considerations

## 🔑 Key Concepts

### Data Isolation Strategy

Every tenant's data is isolated by `tenantId`:

```typescript
// ❌ OLD WAY - No tenant isolation
const clients = await prisma.client.findMany();

// ✅ NEW WAY - Tenant-isolated
const tenantId = await requireTenantId();
const clients = await prisma.client.findMany({
  where: withTenantFilter(tenantId, {}),
});
```

### Session Structure

The session now includes critical isolation data:

```typescript
{
  user: {
    id: "user123",
    tenantId: "tenant456",  // 🔐 Isolates data
    role: "OWNER",          // 👮 Controls permissions
    email: "user@example.com",
    name: "User Name"
  }
}
```

## 📊 Database Schema Overview

```
Tenant (Practice/Office)
├── id
├── officeName
├── firstName, lastName
├── email, phoneNumber
├── country, address
├── paymentStatus (TRIAL/ACTIVE/PAST_DUE/SUSPENDED/CANCELLED)
├── subscriptionTier (BASIC/PROFESSIONAL/ENTERPRISE)
└── Users[] (multiple users)

User (Login Account)
├── id
├── tenantId → Tenant
├── email, password
├── firstName, lastName
├── role (OWNER/ADMIN/THERAPIST/ASSISTANT)
└── isActive

Client
├── tenantId → Tenant (NEW!)
├── ... existing fields

Appointment
├── tenantId → Tenant (NEW!)
├── ... existing fields

Invoice
├── tenantId → Tenant (NEW!)
├── ... existing fields

Note
├── tenantId → Tenant (NEW!)
├── ... existing fields
```

## 🚀 Next Steps to Go Live

### 1. Install Dependencies

```bash
cd /home/mohamed/Desktop/work/next/psychologist_website/admin
npm install bcryptjs @types/bcryptjs
```

### 2. Run Migration

```bash
cd /home/mohamed/Desktop/work/next/psychologist_website/packages/prisma
npx prisma migrate dev --name add_multi_tenant_support
```

### 3. Migrate Existing Data

Create and run the migration script from the guide to:

- Create your first tenant
- Create your user account
- Link all existing data to your tenant

### 4. Update Code Files

You need to update these patterns:

#### Server Actions (~/lib/actions/\*.ts)

```typescript
// Add at the top of each function:
const tenantId = await requireTenantId();

// Update queries:
where: { /* existing */ }
→
where: withTenantFilter(tenantId, { /* existing */ })

// Update creates:
data: { /* existing */ }
→
data: withTenantData(tenantId, { /* existing */ })
```

#### API Routes (~/app/api/\*/route.ts)

```typescript
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { requireTenantId } from "@/lib/tenant-context";

export async function GET(request: Request) {
  const session = await getServerSession(authOptions);
  const tenantId = requireTenantId(session?.user?.tenantId);

  // Use tenantId in all queries
}
```

### 5. Replace Auth Configuration

Option A: Replace current auth.ts

```bash
mv admin/lib/auth.ts admin/lib/auth-old.ts
mv admin/lib/auth-multitenant.ts admin/lib/auth.ts
```

Option B: Update existing auth.ts with multi-tenant changes

### 6. Update Type Definitions

```bash
# Replace or merge with your existing next-auth.d.ts
mv admin/types/next-auth-multitenant.d.ts admin/types/next-auth.d.ts
```

## ⚠️ Important Considerations

### Security

- **Always** validate tenantId exists in session
- **Never** trust client-provided tenantId
- **Always** filter queries by tenantId
- **Test** data isolation between tenants

### Testing Checklist

- [ ] Create two test tenants
- [ ] Verify Tenant A cannot see Tenant B's data
- [ ] Test all CRUD operations with tenant filtering
- [ ] Verify scheduled emails respect tenant boundaries
- [ ] Test subscription suspension flow
- [ ] Test user role permissions

### Performance

- All `tenantId` fields are indexed
- Queries are optimized for tenant filtering
- Consider caching tenant settings
- Monitor query performance with multiple tenants

## 🎨 UI Features to Build

### 1. Tenant Registration

- New sign-up flow
- Collect office information
- Set up first user account
- Start free trial

### 2. User Management (for Owners/Admins)

- Invite team members
- Assign roles
- Activate/deactivate users
- View user activity

### 3. Subscription Management

- View current plan
- Upgrade/downgrade
- Payment method management
- Billing history

### 4. Tenant Settings

- Update office info
- Configure defaults
- Customize email templates
- Manage availability templates

## 📚 Code Examples

### Example 1: Get Clients (Server Action)

```typescript
// lib/actions/clients.ts
import { requireTenantId } from "@/lib/session";
import { withTenantFilter } from "@/lib/tenant-context";

export async function getClients() {
  const tenantId = await requireTenantId();

  return await prisma.client.findMany({
    where: withTenantFilter(tenantId, { deleted: false }),
    orderBy: { createdAt: "desc" },
  });
}
```

### Example 2: Create Appointment

```typescript
import { requireTenantId } from "@/lib/session";
import { withTenantData } from "@/lib/tenant-context";

export async function createAppointment(data: CreateAppointmentData) {
  const tenantId = await requireTenantId();

  return await prisma.appointment.create({
    data: withTenantData(tenantId, {
      clientId: data.clientId,
      startTime: data.startTime,
      // ... other fields
    }),
  });
}
```

### Example 3: API Route with Tenant Check

```typescript
// app/api/clients/route.ts
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function GET() {
  const session = await getServerSession(authOptions);

  if (!session?.user?.tenantId) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const clients = await prisma.client.findMany({
    where: { tenantId: session.user.tenantId },
  });

  return Response.json(clients);
}
```

## 🐛 Troubleshooting

### "Unauthorized: No tenant context found"

- User session doesn't have tenantId
- Need to log out and log back in after migration
- Check auth configuration includes tenantId in session

### "Column 'tenantId' does not exist"

- Migration hasn't been run
- Run: `npx prisma migrate dev`

### Data showing from wrong tenant

- Query missing tenant filter
- Use `withTenantFilter()` helper
- Check middleware is applied

### Type errors with session.user.tenantId

- TypeScript definitions not loaded
- Check `next-auth.d.ts` is in types folder
- Restart TypeScript server

## 📞 Support Resources

- **Migration Guide**: `MULTI_TENANT_MIGRATION_GUIDE.md`
- **Prisma Docs**: https://www.prisma.io/docs/concepts/components/prisma-client/middleware
- **NextAuth Docs**: https://next-auth.js.org/

## ✅ Checklist Before Going Live

- [ ] Dependencies installed
- [ ] Prisma migration run successfully
- [ ] Existing data migrated to first tenant
- [ ] Auth configuration updated
- [ ] All server actions updated with tenant filtering
- [ ] All API routes updated with tenant filtering
- [ ] Type definitions updated
- [ ] Multi-tenant isolation tested
- [ ] User registration flow created
- [ ] Subscription management implemented
- [ ] Payment integration configured
- [ ] Email templates tenant-aware
- [ ] File uploads tenant-scoped
- [ ] Background jobs tenant-aware
- [ ] Monitoring and logging configured
- [ ] Backup strategy in place

---

**Remember**: The key to multi-tenancy is **always filtering by tenantId** in every database query. Use the helper functions to make this automatic and safe! 🔐
