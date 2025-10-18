import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";

export default withAuth(
  function middleware(req) {
    const { pathname } = req.nextUrl;
    const token = req.nextauth.token;

    // Debug logging for Vercel logs
    console.log(`🔍 Middleware: ${pathname}`);
    console.log(`🔑 Token exists: ${!!token}`);
    if (token) {
      console.log(`📧 Token email: ${token.email}`);
      console.log(`⏰ Token expires at: ${token.expiresAt}`);
      console.log(`❌ Token error: ${token.error || "none"}`);
    }

    // If token has error, force re-authentication
    if (token?.error === "RefreshAccessTokenError") {
      console.log(`🔄 Token refresh error, redirecting to login`);
      const loginUrl = new URL("/login", req.url);
      loginUrl.searchParams.set("error", "SessionExpired");
      return NextResponse.redirect(loginUrl);
    }

    // Create the response
    let response = NextResponse.next();

    // Handle meeting pages - allow public access to /meeting but protect /meeting/host
    if (pathname.startsWith("/meeting/") && pathname !== "/meeting-room") {
      // Set headers for cross-site cookies and iframe embedding
      response.headers.set("X-Frame-Options", "SAMEORIGIN");
      response.headers.set(
        "Content-Security-Policy",
        "frame-ancestors 'self' *.8x8.vc *.jitsi.net"
      );
      response.headers.set(
        "Permissions-Policy",
        "microphone=*, camera=*, speaker-selection=*, display-capture=*"
      );
      response.headers.set("Cross-Origin-Embedder-Policy", "unsafe-none");
      response.headers.set(
        "Cross-Origin-Opener-Policy",
        "same-origin-allow-popups"
      );

      // Check if this is the host route - require authentication
      if (pathname.startsWith("/meeting/host")) {
        if (!token) {
          console.log(`🚫 Redirecting to login from meeting/host: no token`);
          const loginUrl = new URL("/login", req.url);
          loginUrl.searchParams.set("callbackUrl", req.url);
          return NextResponse.redirect(loginUrl);
        } else {
          console.log(`✅ Allowing access to meeting/host with token`);
        }
      }

      // Allow public access to other meeting routes (like /meeting/[...id])
      return response;
    }

    // Handle direct /meeting route - allow public access
    if (pathname === "/meeting") {
      console.log(`🌐 Allowing public access to /meeting`);
      return response;
    }

    // Allow access to login page and auth routes
    if (pathname.startsWith("/login") || pathname.startsWith("/api/auth")) {
      console.log(`🔓 Allowing access to auth routes: ${pathname}`);
      return response;
    }

    // Redirect to login if no token and trying to access protected route
    if (!token) {
      console.log(`🚫 No token, redirecting to login from: ${pathname}`);
      const loginUrl = new URL("/login", req.url);
      loginUrl.searchParams.set("callbackUrl", req.url);
      return NextResponse.redirect(loginUrl);
    }

    // User has token - allow access to protected route
    console.log(`✅ Token found, allowing access to: ${pathname}`);

    // Log authorized email check
    const authorizedEmail = process.env.AUTHORIZED_GOOGLE_EMAIL;
    console.log(`🎯 Authorized email: ${authorizedEmail}`);

    if (token.email !== authorizedEmail) {
      console.log(`❌ UNAUTHORIZED: ${token.email} is not ${authorizedEmail}`);
    } else {
      console.log(`✅ AUTHORIZED: ${token.email} matches authorized email`);
    }

    // Add any role-based access control here if needed
    // Example:
    // if (pathname.startsWith("/admin") && token.role !== "admin") {
    //   return NextResponse.redirect(new URL("/unauthorized", req.url));
    // }

    return response;
  },
  {
    callbacks: {
      authorized: ({ token, req }) => {
        const { pathname } = req.nextUrl;
        console.log(
          `🔐 Authorized callback: ${pathname}, hasToken: ${!!token}`
        );

        // Always return true here, let the middleware function handle the logic
        return true;
      },
    },
  }
);

export const config = {
  matcher: [
    /*
     * Match all request paths except for:
     * - api/auth/* (NextAuth API routes)
     * - api/cron/* (Cron job endpoints - public)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public files (images, etc.)
     * - debug page (optional, remove in production)
     */
    "/((?!api/auth|api/cron|_next/static|_next/image|favicon.ico|.*\\.png$|.*\\.jpg$|.*\\.jpeg$|.*\\.gif$|.*\\.svg$|debug).*)",
  ],
};
