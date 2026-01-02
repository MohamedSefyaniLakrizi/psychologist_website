"use server";

import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// In-memory cache for tenantId per session (lasts for the server instance lifetime)
const tenantCache = new Map<string, { tenantId: string; timestamp: number }>();
const CACHE_TTL = 1000 * 60 * 60; // 1 hour

export async function getTenantId(): Promise<string | null> {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
      return null;
    }

    // First, try to get from NextAuth session (fastest - already in JWT token)
    if ((session.user as any).tenantId) {
      console.log(
        "✅ Retrieved tenantId from session:",
        (session.user as any).tenantId
      );
      return (session.user as any).tenantId;
    }

    // Second, check in-memory cache
    const cached = tenantCache.get(session.user.email);
    if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
      console.log("✅ Retrieved tenantId from cache:", cached.tenantId);
      return cached.tenantId;
    }

    // Third, query database (slowest - only runs once per hour per user)
    console.log("🔍 Querying database for tenantId...");
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { tenantId: true },
    });

    if (user?.tenantId) {
      // Store in cache
      tenantCache.set(session.user.email, {
        tenantId: user.tenantId,
        timestamp: Date.now(),
      });
      console.log("� Cached tenantId:", user.tenantId);
      return user.tenantId;
    }

    return null;
  } catch (error) {
    console.error("Error getting tenantId:", error);
    return null;
  }
}

/**
 * Clear the tenant cache for a specific user
 */
export async function clearTenantCache(email?: string): Promise<void> {
  if (email) {
    tenantCache.delete(email);
  } else {
    tenantCache.clear();
  }
}

// Tenant data interface matching schema.prisma
export interface TenantInfo {
  id: string;
  officeName: string;
  phoneNumber: string;
  address: string | null;
  firstName: string;
  lastName: string;
  email: string;
  country: string;
  paymentStatus: string;
  subscriptionTier: string;
}

// In-memory cache for tenant data
const tenantDataCache = new Map<
  string,
  { data: TenantInfo; timestamp: number }
>();

/**
 * Get full tenant information from session, cache, or database
 * Returns all tenant details including officeName, phoneNumber, address, etc.
 */
export async function getTenant(): Promise<TenantInfo | null> {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
      return null;
    }

    // First, try to get from NextAuth session (fastest)
    const sessionUser = session.user as any;
    if (sessionUser.tenantId && sessionUser.tenantOfficeName) {
      console.log("✅ Retrieved tenant info from session");

      // Build tenant info from session data (partial - only what we store in JWT)
      const tenantIdFromSession = sessionUser.tenantId;

      // Check if we have full data in cache
      const cached = tenantDataCache.get(tenantIdFromSession);
      if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
        console.log("✅ Retrieved full tenant data from cache");
        return cached.data;
      }

      // We have tenantId from session but need full data from DB
      console.log("🔍 Fetching full tenant data from database...");
      const tenant = await prisma.tenant.findUnique({
        where: { id: tenantIdFromSession },
        select: {
          id: true,
          officeName: true,
          phoneNumber: true,
          address: true,
          firstName: true,
          lastName: true,
          email: true,
          country: true,
          paymentStatus: true,
          subscriptionTier: true,
        },
      });

      if (tenant) {
        // Store in cache
        tenantDataCache.set(tenantIdFromSession, {
          data: tenant as TenantInfo,
          timestamp: Date.now(),
        });
        console.log("💾 Cached full tenant data");
        return tenant as TenantInfo;
      }
    }

    // Fallback: get tenantId first, then fetch tenant data
    const tenantId = await getTenantId();

    if (!tenantId) {
      return null;
    }

    // Check cache with tenantId
    const cached = tenantDataCache.get(tenantId);
    if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
      console.log("✅ Retrieved tenant data from cache via tenantId");
      return cached.data;
    }

    // Query database for full tenant info
    console.log("🔍 Querying database for full tenant data...");
    const tenant = await prisma.tenant.findUnique({
      where: { id: tenantId },
      select: {
        id: true,
        officeName: true,
        phoneNumber: true,
        address: true,
        firstName: true,
        lastName: true,
        email: true,
        country: true,
        paymentStatus: true,
        subscriptionTier: true,
      },
    });

    if (tenant) {
      // Store in cache
      tenantDataCache.set(tenantId, {
        data: tenant as TenantInfo,
        timestamp: Date.now(),
      });
      console.log("💾 Cached tenant data");
      return tenant as TenantInfo;
    }

    return null;
  } catch (error) {
    console.error("Error getting tenant info:", error);
    return null;
  }
}

/**
 * Get tenant information directly by tenantId (for cron jobs and server-side operations without session)
 * @param tenantId - The ID of the tenant to fetch
 * @returns TenantInfo or null if not found
 */
export async function getTenantById(
  tenantId: string
): Promise<TenantInfo | null> {
  try {
    // Check cache first
    const cached = tenantDataCache.get(tenantId);
    if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
      console.log("✅ Retrieved tenant data from cache (by ID)");
      return cached.data;
    }

    // Query database for tenant info
    console.log("🔍 Fetching tenant data from database by ID...");
    const tenant = await prisma.tenant.findUnique({
      where: { id: tenantId },
      select: {
        id: true,
        officeName: true,
        phoneNumber: true,
        address: true,
        firstName: true,
        lastName: true,
        email: true,
        country: true,
        paymentStatus: true,
        subscriptionTier: true,
      },
    });

    if (tenant) {
      // Store in cache
      tenantDataCache.set(tenantId, {
        data: tenant as TenantInfo,
        timestamp: Date.now(),
      });
      console.log("💾 Cached tenant data (by ID)");
      return tenant as TenantInfo;
    }

    return null;
  } catch (error) {
    console.error("Error getting tenant by ID:", error);
    return null;
  }
}

/**
 * Clear the tenant data cache
 */
export async function clearTenantDataCache(tenantId?: string): Promise<void> {
  if (tenantId) {
    tenantDataCache.delete(tenantId);
  } else {
    tenantDataCache.clear();
  }
}
