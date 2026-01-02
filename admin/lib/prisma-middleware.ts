import { Prisma } from "@prisma/client";

// Models that require tenant filtering
const TENANT_MODELS = [
  "Client",
  "Appointment",
  "Invoice",
  "Note",
  "WeeklyAvailability",
  "DateAvailability",
] as const;

type TenantModel = (typeof TENANT_MODELS)[number];

/**
 * Prisma middleware to automatically inject tenantId into all queries
 * This ensures data isolation between tenants
 */
export function createTenantMiddleware(tenantId: string) {
  return async (
    params: Prisma.MiddlewareParams,
    next: (params: Prisma.MiddlewareParams) => Promise<any>
  ) => {
    // Check if this model requires tenant filtering
    if (TENANT_MODELS.includes(params.model as TenantModel)) {
      // Add tenantId to all read operations
      if (
        params.action === "findUnique" ||
        params.action === "findFirst" ||
        params.action === "findMany"
      ) {
        params.args.where = {
          ...params.args.where,
          tenantId,
        };
      }

      // Add tenantId to all count operations
      if (params.action === "count") {
        params.args.where = {
          ...params.args.where,
          tenantId,
        };
      }

      // Add tenantId to all create operations
      if (params.action === "create") {
        params.args.data = {
          ...params.args.data,
          tenantId,
        };
      }

      // Add tenantId to createMany operations
      if (params.action === "createMany") {
        if (Array.isArray(params.args.data)) {
          params.args.data = params.args.data.map((item: any) => ({
            ...item,
            tenantId,
          }));
        } else {
          params.args.data = {
            ...params.args.data,
            tenantId,
          };
        }
      }

      // Add tenantId to all update operations
      if (params.action === "update" || params.action === "updateMany") {
        params.args.where = {
          ...params.args.where,
          tenantId,
        };
      }

      // Add tenantId to all delete operations
      if (params.action === "delete" || params.action === "deleteMany") {
        params.args.where = {
          ...params.args.where,
          tenantId,
        };
      }

      // Add tenantId to upsert operations
      if (params.action === "upsert") {
        params.args.where = {
          ...params.args.where,
          tenantId,
        };
        params.args.create = {
          ...params.args.create,
          tenantId,
        };
      }
    }

    return next(params);
  };
}

/**
 * Initialize Prisma client with tenant middleware
 * Call this at the start of each request with the current user's tenantId
 */
export function initializeTenantPrisma(
  prismaClient: any,
  tenantId: string | null
) {
  console.log("Initializing Tenant Prisma with tenantId:", tenantId);
  if (!tenantId) {
    throw new Error("Tenant ID is required for database operations");
  }

  // Add middleware if not already added
  if (!prismaClient._middlewareApplied) {
    prismaClient.$use(createTenantMiddleware(tenantId));
    prismaClient._middlewareApplied = true;
  }

  return prismaClient;
}
