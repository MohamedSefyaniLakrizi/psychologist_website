import { NextAuthOptions } from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import CredentialsProvider from "next-auth/providers/credentials";
import { prisma } from "./prisma";
import bcrypt from "bcryptjs";

// Extend the built-in session types to include tenantId and tenant metadata
declare module "next-auth" {
  interface Session {
    accessToken?: string;
    refreshToken?: string;
    error?: string;
    user: {
      id: string;
      tenantId: string;
      role: string;
      // Tenant metadata available in session
      tenantOfficeName?: string;
      tenantPhone?: string;
      tenantAddress?: string;
      name?: string | null;
      email?: string | null;
      image?: string | null;
    };
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    accessToken?: string;
    refreshToken?: string;
    expiresAt?: number;
    error?: string;
    sub: string;
    tenantId?: string;
    role?: string;
    // Tenant metadata stored in token
    tenantOfficeName?: string;
    tenantPhone?: string;
    tenantAddress?: string;
  }
}

export const authOptions: NextAuthOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      authorization: {
        params: {
          scope:
            "openid email profile https://www.googleapis.com/auth/calendar",
          access_type: "offline",
          prompt: "consent",
        },
      },
    }),
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          throw new Error("Email and password required");
        }

        // Find user by email
        const user = await prisma.user.findUnique({
          where: { email: credentials.email },
          include: {
            tenant: {
              select: {
                id: true,
                officeName: true,
                phoneNumber: true,
                address: true,
                paymentStatus: true,
              },
            },
          },
        });

        if (!user) {
          throw new Error("Invalid credentials");
        }

        // Check if user is active
        if (!user.isActive) {
          throw new Error("Account is inactive");
        }

        // Check if tenant payment is valid
        if (
          user.tenant.paymentStatus === "SUSPENDED" ||
          user.tenant.paymentStatus === "CANCELLED"
        ) {
          throw new Error("Account subscription is not active");
        }

        // Verify password if it exists (credentials login)
        if (user.password) {
          const isValid = await bcrypt.compare(
            credentials.password,
            user.password
          );
          if (!isValid) {
            throw new Error("Invalid credentials");
          }
        }

        // Update last login
        await prisma.user.update({
          where: { id: user.id },
          data: { lastLoginAt: new Date() },
        });

        return {
          id: user.id,
          email: user.email,
          name: `${user.firstName} ${user.lastName}`,
          tenantId: user.tenantId,
          role: user.role,
          tenantOfficeName: user.tenant?.officeName,
          tenantPhone: user.tenant?.phoneNumber,
          tenantAddress: user.tenant?.address,
        };
      },
    }),
  ],
  session: {
    strategy: "jwt",
    maxAge: 10 * 365 * 24 * 60 * 60, // 10 years in seconds
  },
  callbacks: {
    async signIn({ user, account, profile }) {
      // For Google OAuth sign-in
      if (account?.provider === "google") {
        // Check if user exists in database
        const existingUser = await prisma.user.findUnique({
          where: { email: user.email! },
          include: {
            tenant: {
              select: {
                officeName: true,
                phoneNumber: true,
                address: true,
                paymentStatus: true,
              },
            },
          },
        });

        if (!existingUser) {
          // For new Google users, you might want to:
          // 1. Auto-create a tenant and user, OR
          // 2. Redirect to a registration page to complete tenant setup
          // For now, we'll reject new Google sign-ins
          console.log(`New Google sign-in attempt from: ${user.email}`);
          return `/login?error=no_account&email=${encodeURIComponent(user.email || "")}`;
        }

        // Check if account is active
        if (!existingUser.isActive) {
          return `/login?error=inactive&email=${encodeURIComponent(user.email || "")}`;
        }

        // Check tenant payment status
        if (
          existingUser.tenant.paymentStatus === "SUSPENDED" ||
          existingUser.tenant.paymentStatus === "CANCELLED"
        ) {
          return `/login?error=subscription&email=${encodeURIComponent(user.email || "")}`;
        }

        // Update last login
        await prisma.user.update({
          where: { id: existingUser.id },
          data: { lastLoginAt: new Date() },
        });

        // Store user data for JWT callback (cast to any for custom props)
        (user as any).id = existingUser.id;
        (user as any).tenantId = existingUser.tenantId;
        (user as any).role = existingUser.role;
        (user as any).tenantOfficeName = existingUser.tenant?.officeName;
        (user as any).tenantPhone = existingUser.tenant?.phoneNumber;
        (user as any).tenantAddress = existingUser.tenant?.address;
      }

      return true;
    },
    async jwt({ token, account, user }) {
      // Persist tenant and role info after signin
      if (user) {
        token.tenantId = (user as any).tenantId;
        token.role = (user as any).role;
        token.tenantOfficeName = (user as any).tenantOfficeName;
        token.tenantPhone = (user as any).tenantPhone;
        token.tenantAddress = (user as any).tenantAddress;
      }

      // If tenantId is not in token yet, fetch it from database (one-time lookup)
      if (!token.tenantId && token.email) {
        const dbUser = await prisma.user.findUnique({
          where: { email: token.email },
          select: {
            tenantId: true,
            role: true,
            tenant: {
              select: { officeName: true, phoneNumber: true, address: true },
            },
          },
        });

        if (dbUser) {
          token.tenantId = dbUser.tenantId;
          token.role = dbUser.role;
          token.tenantOfficeName = dbUser.tenant?.officeName;
          token.tenantPhone = dbUser.tenant?.phoneNumber;
          token.tenantAddress = dbUser.tenant?.address;
        }
      }

      // Persist the OAuth access_token and refresh_token
      if (account) {
        token.accessToken = account.access_token;
        token.refreshToken = account.refresh_token;
        token.expiresAt = account.expires_at;
      }

      // Return previous token if the access token has not expired yet
      if (token.expiresAt && Date.now() < (token.expiresAt as number) * 1000) {
        return token;
      }

      // Access token has expired, try to update it (for Google OAuth)
      if (token.refreshToken && account?.provider === "google") {
        try {
          const response = await fetch("https://oauth2.googleapis.com/token", {
            headers: { "Content-Type": "application/x-www-form-urlencoded" },
            body: new URLSearchParams({
              client_id: process.env.GOOGLE_CLIENT_ID!,
              client_secret: process.env.GOOGLE_CLIENT_SECRET!,
              grant_type: "refresh_token",
              refresh_token: token.refreshToken as string,
            }),
            method: "POST",
          });

          const tokens = await response.json();

          if (!response.ok) throw tokens;

          return {
            ...token,
            accessToken: tokens.access_token,
            expiresAt: Math.floor(Date.now() / 1000 + tokens.expires_in),
            refreshToken: tokens.refresh_token ?? token.refreshToken,
          };
        } catch (error) {
          console.error("Error refreshing access token", error);
          return { ...token, error: "RefreshAccessTokenError" };
        }
      }

      return token;
    },
    async session({ session, token }) {
      // Send properties to the client
      session.accessToken = token.accessToken;
      session.refreshToken = token.refreshToken;
      session.error = token.error;

      // Add critical tenant isolation data
      if (session.user) {
        session.user.id = token.sub;
        session.user.tenantId = token.tenantId!;
        session.user.role = token.role!;
        // Tenant metadata
        (session.user as any).tenantOfficeName = token.tenantOfficeName;
        (session.user as any).tenantPhone = token.tenantPhone;
        (session.user as any).tenantAddress = token.tenantAddress;
      }

      return session;
    },
  },
  pages: {
    signIn: "/login",
    error: "/login",
  },
  secret: process.env.NEXTAUTH_SECRET,
  debug: process.env.NODE_ENV === "development",
};
