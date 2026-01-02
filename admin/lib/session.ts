import { getServerSession } from "next-auth";
import { authOptions } from "./auth";

/**
 * Get the current user's ID from the session
 */
export async function getUserId(): Promise<string | null> {
  const session = await getServerSession(authOptions);
  return session?.user?.id || null;
}

/**
 * Get the current user's role from the session
 */
export async function getUserRole(): Promise<string | null> {
  const session = await getServerSession(authOptions);
  return session?.user?.role || null;
}

/**
 * Check if user has specific role
 */
export async function hasRole(role: string | string[]): Promise<boolean> {
  const userRole = await getUserRole();

  if (!userRole) return false;

  if (Array.isArray(role)) {
    return role.includes(userRole);
  }

  return userRole === role;
}

/**
 * Check if user is owner or admin
 */
export async function isAdmin(): Promise<boolean> {
  return hasRole(["OWNER", "ADMIN"]);
}
