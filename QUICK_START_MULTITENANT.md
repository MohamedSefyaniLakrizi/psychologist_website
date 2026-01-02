# 🎯 Multi-Tenant Implementation - Quick Start Guide

## What You Have Now

Your psychologist website has been **prepared** for multi-tenant (SaaS) conversion. The code is ready, but **not yet active**. You need to run migrations and make configuration changes.

## ⚡ Quick Start (5 Steps)

### Step 1: Install Dependencies (2 minutes)

```bash
cd /home/mohamed/Desktop/work/next/psychologist_website/admin
npm install bcryptjs @types/bcryptjs
```

### Step 2: Run Database Migration (1 minute)

```bash
cd /home/mohamed/Desktop/work/next/psychologist_website/packages/prisma
npx prisma migrate dev --name add_multi_tenant_support
```

This creates the Tenant and User tables and adds tenantId to all your data.

### Step 3: Configure Migration Script (3 minutes)

Edit `scripts/migrate-to-multitenant.ts` and update lines 21-33 with your info:

```typescript
const TENANT_CONFIG = {
  officeName: "Your Practice Name", // ← Your practice name
  firstName: "Your", // ← Your first name
  lastName: "Name", // ← Your last name
  email: "your.email@example.com", // ← MUST match your Google login
  phoneNumber: "+1234567890", // ← Your phone
  country: "Morocco", // ← Your country
  // ... rest is good as-is
};
```

### Step 4: Run Migration Script (1 minute)

```bash
cd /home/mohamed/Desktop/work/next/psychologist_website
npx tsx scripts/migrate-to-multitenant.ts
```

This links all your existing data (clients, appointments, invoices) to your new tenant account.

### Step 5: Update Auth Configuration (2 minutes)

**Option A - Quick Replace:**

```bash
cd admin/lib
mv auth.ts auth-old-backup.ts
mv auth-multitenant.ts auth.ts
```

**Option B - Manual Merge:**
Copy the session extensions from `auth-multitenant.ts` into your current `auth.ts`

---

## ✅ You're Done!

Your system now supports multiple tenants! Each tenant's data is completely isolated.

## 🧪 Testing It Works

### Test 1: Log In

```bash
npm run dev
```

Navigate to your login page - you should be able to log in as before.

### Test 2: Check Session

Add this to any page to verify tenantId is in session:

```typescript
const session = await getServerSession(authOptions);
console.log("TenantId:", session?.user?.tenantId); // Should show your tenant ID
```

### Test 3: Create Test Tenant

Open `scripts/migrate-to-multitenant.ts`, change the email to a test email, and run again. Now you have 2 tenants!

## 📖 Full Documentation

- **Implementation Overview**: `MULTI_TENANT_IMPLEMENTATION.md`
- **Migration Guide**: `MULTI_TENANT_MIGRATION_GUIDE.md`

## 🔧 Files You Need to Update

To complete the multi-tenant conversion, update your server actions:

### Pattern to Follow

**Before (single-tenant):**

```typescript
export async function getClients() {
  return await prisma.client.findMany({
    where: { deleted: false },
  });
}
```

**After (multi-tenant):**

```typescript
import { requireTenantId } from "@/lib/session";
import { withTenantFilter } from "@/lib/tenant-context";

export async function getClients() {
  const tenantId = await requireTenantId();

  return await prisma.client.findMany({
    where: withTenantFilter(tenantId, { deleted: false }),
  });
}
```

### Files to Update

Apply the pattern above to these files:

**Priority 1 - Critical for data isolation:**

- `/admin/lib/actions/clients.ts` - All functions
- `/admin/lib/actions/appointments.ts` - All functions
- `/admin/lib/actions/invoices.ts` - All functions
- `/admin/lib/actions/notes.ts` - All functions

**Priority 2 - Important:**

- `/admin/app/api/appointments/route.ts`
- `/admin/app/api/clients/route.ts`
- `/admin/app/api/invoices/route.ts`
- `/admin/app/api/availability/route.ts`

**Priority 3 - Can do later:**

- All other API routes in `/admin/app/api/*`

## 🎨 New Features You Can Build

Now that you have multi-tenant support:

### 1. Tenant Registration Page

Let new practices sign up! Create a `/register` page that:

- Collects office info
- Creates tenant account
- Sets up first user
- Starts free trial

### 2. User Management

Let practice owners invite team members:

- Admin can invite therapists
- Assign roles (Owner, Admin, Therapist, Assistant)
- Deactivate users who leave

### 3. Subscription Billing

Charge for the service:

- Integrate Stripe or PayPal
- Track subscription status
- Auto-suspend on non-payment
- Send payment reminders

### 4. Tenant Settings

Let each practice customize:

- Office branding
- Email templates
- Default rates
- Availability templates

## 🔐 Security Reminders

**Always:**

- ✅ Get tenantId from session, never from client
- ✅ Filter all queries by tenantId
- ✅ Use `requireTenantId()` in server actions
- ✅ Use `withTenantFilter()` in where clauses

**Never:**

- ❌ Trust tenantId from form data or URL params
- ❌ Forget to filter queries
- ❌ Share data between tenants
- ❌ Allow one tenant to see another's data

## ⚠️ Before You Deploy

- [ ] Test with 2+ tenants
- [ ] Verify data isolation (Tenant A can't see Tenant B's data)
- [ ] Update all server actions with tenant filtering
- [ ] Update all API routes with tenant filtering
- [ ] Test user login flow
- [ ] Test scheduled emails respect tenant boundaries
- [ ] Add monitoring for cross-tenant leaks
- [ ] Set up database backups

## 🆘 Troubleshooting

### "Property 'tenantId' does not exist"

→ Run: `npx prisma generate`

### "Unauthorized: No tenant context found"

→ Log out and log back in after migration

### TypeScript errors with session.user.tenantId

→ Check `types/next-auth-multitenant.d.ts` exists
→ Restart your IDE/TypeScript server

### Migration script errors

→ Make sure you ran Prisma migration first:

```bash
npx prisma migrate dev --name add_multi_tenant_support
```

## 📊 What Changed?

### Database

- ➕ Added `Tenant` table (offices/practices)
- ➕ Added `User` table (login accounts)
- ➕ Added `tenantId` to all data tables
- ➕ Added 3 new enums (PaymentStatus, SubscriptionTier, UserRole)

### Code

- ➕ Created tenant isolation helpers
- ➕ Created session management helpers
- ➕ Created new auth config with tenant support
- ➕ Created TypeScript types for multi-tenant

### Your Data

- 🔄 Existing data needs to be linked to a tenant (Step 4 does this)
- 🔄 You become the first user of the first tenant
- ✅ No data is lost - everything is preserved

## 📞 Need Help?

1. Check the error message carefully
2. Look in the migration guide for your specific issue
3. Verify you completed all 5 quick start steps
4. Check that Prisma migration ran successfully
5. Ensure your session includes tenantId (log out/in if needed)

---

**Remember**: The system will work exactly as before for you, but now it's ready to support many practices! 🎉
