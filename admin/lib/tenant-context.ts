/**
 * Tenant Context Utilities
 *
 * These utilities help manage multi-tenant data isolation by automatically
 * injecting tenantId into database queries.
 */

/**
 * Get tenant ID from session or throw error
 * Use this in server actions and API routes
 */
export function requireTenantId(tenantId: string | undefined | null): string {
  if (!tenantId) {
    throw new Error("Unauthorized: Tenant ID is required");
  }
  return tenantId;
}

/**
 * Add tenant filter to Prisma where clause
 */
export function withTenantFilter<T extends Record<string, any>>(
  tenantId: string,
  where?: T
): T & { tenantId: string } {
  return {
    ...where,
    tenantId,
  } as T & { tenantId: string };
}

/**
 * Add tenant ID to data being created
 */
export function withTenantData<T extends Record<string, any>>(
  tenantId: string,
  data: T
): T & { tenantId: string } {
  return {
    ...data,
    tenantId,
  };
}

/**
 * Tenant-aware Prisma query helpers
 * Use these wrappers around Prisma operations to ensure tenant filtering
 */
export const TenantPrisma = {
  /**
   * Find many records for a tenant
   */
  findMany: <T extends Record<string, any>>(tenantId: string, args?: T) => {
    return {
      ...args,
      where: withTenantFilter(tenantId, args?.where),
    };
  },

  /**
   * Find unique record for a tenant
   */
  findUnique: <T extends Record<string, any>>(tenantId: string, where: T) => {
    return {
      where: withTenantFilter(tenantId, where),
    };
  },

  /**
   * Find first record for a tenant
   */
  findFirst: <T extends Record<string, any>>(tenantId: string, args?: T) => {
    return {
      ...args,
      where: withTenantFilter(tenantId, args?.where),
    };
  },

  /**
   * Create record for a tenant
   */
  create: <T extends Record<string, any>>(
    tenantId: string,
    args: { data: T; [key: string]: any }
  ) => {
    return {
      ...args,
      data: withTenantData(tenantId, args.data),
    };
  },

  /**
   * Update record for a tenant
   */
  update: <T extends Record<string, any>>(
    tenantId: string,
    args: { where: any; data: T; [key: string]: any }
  ) => {
    return {
      ...args,
      where: withTenantFilter(tenantId, args.where),
    };
  },

  /**
   * Delete record for a tenant
   */
  delete: <T extends Record<string, any>>(tenantId: string, where: T) => {
    return {
      where: withTenantFilter(tenantId, where),
    };
  },

  /**
   * Count records for a tenant
   */
  count: <T extends Record<string, any>>(tenantId: string, args?: T) => {
    return {
      ...args,
      where: withTenantFilter(tenantId, args?.where),
    };
  },
};
