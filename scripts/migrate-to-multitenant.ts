/**
 * Multi-Tenant Data Migration Script
 *
 * This script migrates your existing single-tenant data to the multi-tenant structure.
 *
 * IMPORTANT: Run this AFTER running the Prisma migration!
 *
 * Steps:
 * 1. Run Prisma migration: npx prisma migrate dev --name add_multi_tenant_support
 * 2. Update the configuration below with your information
 * 3. Run this script: npx tsx scripts/migrate-to-multitenant.ts
 */

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// ========================================
// CONFIGURATION - UPDATE THESE VALUES
// ========================================

const TENANT_CONFIG = {
  // Office Information
  officeName: "Malika Lkhabir", // Your practice name
  firstName: "Malika", // Your first name
  lastName: "Lkhabir", // Your last name
  email: "mohamedsefyani@gmail.com", // Your email (must match your Google login if using OAuth)
  phoneNumber: "+212762914290", // Your phone number
  country: "Morocco", // Your country
  address: "123 Rue de la Sante, Casablanca", // Your address (optional)

  // Subscription Settings
  paymentStatus: "ACTIVE" as const, // TRIAL, ACTIVE, PAST_DUE, SUSPENDED, CANCELLED
  subscriptionTier: "PROFESSIONAL" as const, // BASIC, PROFESSIONAL, ENTERPRISE

  // User Settings
  userRole: "OWNER" as const, // OWNER, ADMIN, THERAPIST, ASSISTANT
  userProvider: "google", // "google" or "credentials"
};

// ========================================
// MIGRATION LOGIC
// ========================================

async function migrateToMultiTenant() {
  console.log("🚀 Starting multi-tenant migration...\n");

  try {
    // Step 1: Check if tenant already exists
    console.log("📋 Step 1: Checking for existing tenant...");
    const existingTenant = await prisma.tenant.findUnique({
      where: { email: TENANT_CONFIG.email },
    });

    if (existingTenant) {
      console.log("⚠️  Tenant already exists with this email!");
      console.log("   Tenant ID:", existingTenant.id);
      console.log("   Office:", existingTenant.officeName);

      const proceed = process.argv.includes("--force");
      if (!proceed) {
        console.log(
          "\n❌ Migration aborted. Use --force flag to continue anyway."
        );
        return;
      }
      console.log("   Continuing with existing tenant...\n");
    }

    // Step 2: Create or get tenant
    console.log("📋 Step 2: Creating/retrieving tenant...");
    const tenant =
      existingTenant ||
      (await prisma.tenant.create({
        data: {
          officeName: TENANT_CONFIG.officeName,
          firstName: TENANT_CONFIG.firstName,
          lastName: TENANT_CONFIG.lastName,
          email: TENANT_CONFIG.email,
          phoneNumber: TENANT_CONFIG.phoneNumber,
          country: TENANT_CONFIG.country,
          address: TENANT_CONFIG.address,
          paymentStatus: TENANT_CONFIG.paymentStatus,
          subscriptionTier: TENANT_CONFIG.subscriptionTier,
        },
      }));

    console.log("✅ Tenant created/retrieved:");
    console.log("   ID:", tenant.id);
    console.log("   Office:", tenant.officeName);
    console.log("   Email:", tenant.email);
    console.log();

    // Step 3: Create user account
    console.log("📋 Step 3: Creating user account...");
    const existingUser = await prisma.user.findUnique({
      where: { email: TENANT_CONFIG.email },
    });

    if (existingUser) {
      console.log("ℹ️  User already exists, skipping creation");
    } else {
      const user = await prisma.user.create({
        data: {
          tenantId: tenant.id,
          email: TENANT_CONFIG.email,
          firstName: TENANT_CONFIG.firstName,
          lastName: TENANT_CONFIG.lastName,
          role: TENANT_CONFIG.userRole,
          provider: TENANT_CONFIG.userProvider,
          isActive: true,
        },
      });

      console.log("✅ User created:");
      console.log("   ID:", user.id);
      console.log("   Email:", user.email);
      console.log("   Role:", user.role);
    }
    console.log();

    // Step 4: Update existing clients
    console.log("📋 Step 4: Migrating existing clients...");
    const clientsWithoutTenant = await prisma.client.findMany({
      where: { tenantId: null },
    });

    if (clientsWithoutTenant.length > 0) {
      const clientsResult = await prisma.client.updateMany({
        where: { tenantId: null },
        data: { tenantId: tenant.id },
      });
      console.log(`✅ Updated ${clientsResult.count} clients`);
    } else {
      console.log("ℹ️  No clients to migrate");
    }

    // Step 5: Update existing appointments
    console.log("📋 Step 5: Migrating existing appointments...");
    const appointmentsWithoutTenant = await prisma.appointment.findMany({
      where: { tenantId: null },
    });

    if (appointmentsWithoutTenant.length > 0) {
      const appointmentsResult = await prisma.appointment.updateMany({
        where: { tenantId: null },
        data: { tenantId: tenant.id },
      });
      console.log(`✅ Updated ${appointmentsResult.count} appointments`);
    } else {
      console.log("ℹ️  No appointments to migrate");
    }

    // Step 6: Update existing invoices
    console.log("📋 Step 6: Migrating existing invoices...");
    const invoicesWithoutTenant = await prisma.invoice.findMany({
      where: { tenantId: null },
    });

    if (invoicesWithoutTenant.length > 0) {
      const invoicesResult = await prisma.invoice.updateMany({
        where: { tenantId: null },
        data: { tenantId: tenant.id },
      });
      console.log(`✅ Updated ${invoicesResult.count} invoices`);
    } else {
      console.log("ℹ️  No invoices to migrate");
    }

    // Step 7: Update existing notes
    console.log("📋 Step 7: Migrating existing notes...");
    const notesWithoutTenant = await prisma.note.findMany({
      where: { tenantId: null },
    });

    if (notesWithoutTenant.length > 0) {
      const notesResult = await prisma.note.updateMany({
        where: { tenantId: null },
        data: { tenantId: tenant.id },
      });
      console.log(`✅ Updated ${notesResult.count} notes`);
    } else {
      console.log("ℹ️  No notes to migrate");
    }

    // Step 8: Update weekly availability
    console.log("📋 Step 8: Migrating weekly availability...");
    const weeklyAvailWithoutTenant = await prisma.weeklyAvailability.findMany({
      where: { tenantId: null },
    });

    if (weeklyAvailWithoutTenant.length > 0) {
      const weeklyResult = await prisma.weeklyAvailability.updateMany({
        where: { tenantId: null },
        data: { tenantId: tenant.id },
      });
      console.log(`✅ Updated ${weeklyResult.count} weekly availability slots`);
    } else {
      console.log("ℹ️  No weekly availability to migrate");
    }

    // Step 9: Update date availability
    console.log("📋 Step 9: Migrating date availability...");
    const dateAvailWithoutTenant = await prisma.dateAvailability.findMany({
      where: { tenantId: null },
    });

    if (dateAvailWithoutTenant.length > 0) {
      const dateResult = await prisma.dateAvailability.updateMany({
        where: { tenantId: null },
        data: { tenantId: tenant.id },
      });
      console.log(`✅ Updated ${dateResult.count} date availability overrides`);
    } else {
      console.log("ℹ️  No date availability to migrate");
    }

    // Step 10: Verification
    console.log("\n📋 Step 10: Verifying migration...");
    const finalCounts = {
      clients: await prisma.client.count({ where: { tenantId: tenant.id } }),
      appointments: await prisma.appointment.count({
        where: { tenantId: tenant.id },
      }),
      invoices: await prisma.invoice.count({ where: { tenantId: tenant.id } }),
      notes: await prisma.note.count({ where: { tenantId: tenant.id } }),
      weeklyAvail: await prisma.weeklyAvailability.count({
        where: { tenantId: tenant.id },
      }),
      dateAvail: await prisma.dateAvailability.count({
        where: { tenantId: tenant.id },
      }),
    };

    console.log("\n✅ Migration completed successfully!\n");
    console.log("📊 Final counts for tenant:", tenant.id);
    console.log("   Clients:", finalCounts.clients);
    console.log("   Appointments:", finalCounts.appointments);
    console.log("   Invoices:", finalCounts.invoices);
    console.log("   Notes:", finalCounts.notes);
    console.log("   Weekly Availability:", finalCounts.weeklyAvail);
    console.log("   Date Availability:", finalCounts.dateAvail);
    console.log();

    // Check for orphaned records
    const orphanedClients = await prisma.client.count({
      where: { tenantId: null },
    });
    const orphanedAppointments = await prisma.appointment.count({
      where: { tenantId: null },
    });
    const orphanedInvoices = await prisma.invoice.count({
      where: { tenantId: null },
    });
    const orphanedNotes = await prisma.note.count({
      where: { tenantId: null },
    });

    if (
      orphanedClients ||
      orphanedAppointments ||
      orphanedInvoices ||
      orphanedNotes
    ) {
      console.log("⚠️  WARNING: Some records still have null tenantId:");
      if (orphanedClients) console.log("   Clients:", orphanedClients);
      if (orphanedAppointments)
        console.log("   Appointments:", orphanedAppointments);
      if (orphanedInvoices) console.log("   Invoices:", orphanedInvoices);
      if (orphanedNotes) console.log("   Notes:", orphanedNotes);
      console.log("\n   You may need to manually investigate these records.");
    } else {
      console.log("✅ No orphaned records found. All data has been migrated!");
    }

    console.log("\n🎉 Migration process complete!");
    console.log("\n📝 Next steps:");
    console.log("   1. Update your .env file with the tenant configuration");
    console.log("   2. Update auth.ts to use the new multi-tenant auth config");
    console.log("   3. Update all server actions to use tenant filtering");
    console.log("   4. Test the application with multiple test tenants");
    console.log("   5. Update UI to show tenant-specific branding\n");
  } catch (error) {
    console.error("\n❌ Migration failed!");
    console.error(error);
    console.error("\n💡 Tip: Make sure you've run the Prisma migration first:");
    console.error(
      "   npx prisma migrate dev --name add_multi_tenant_support\n"
    );
    throw error;
  }
}

// Run the migration
migrateToMultiTenant()
  .catch((error) => {
    console.error("Fatal error:", error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
