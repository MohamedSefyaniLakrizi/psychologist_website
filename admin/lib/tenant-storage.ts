import { AsyncLocalStorage } from "async_hooks";

/**
 * Async Local Storage for tenant context
 * This stores the tenantId for the current request/operation
 */
export const tenantStorage = new AsyncLocalStorage<{ tenantId: string }>();

/**
 * Run a function with tenant context
 */
export function runWithTenant<T>(tenantId: string, callback: () => T): T {
  return tenantStorage.run({ tenantId }, callback);
}

/**
 * Get the current tenant ID from storage
 */
export function getTenantId(): string | undefined {
  return tenantStorage.getStore()?.tenantId;
}
