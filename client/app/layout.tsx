"use client";

import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import Header from "./components/layout/header";
import { usePathname } from "next/navigation";
import { Toaster } from "./components/ui/sonner";
import { SessionProvider } from "next-auth/react";
import { Analytics } from "@vercel/analytics/next";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

function LayoutContent({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isAdminPage =
    pathname?.startsWith("/admin") || pathname?.startsWith("/dashboard");

  return (
    <div className="min-h-screen">
      {!isAdminPage && <Header />} {children}
    </div>
  );
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="light">
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              // Force light theme
              document.documentElement.classList.remove('dark');
              document.documentElement.classList.add('light');
              document.documentElement.style.colorScheme = 'light';
            `,
          }}
        />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <SessionProvider>
          <LayoutContent>{children}</LayoutContent>
          <Toaster />
        </SessionProvider>
        <Analytics />
      </body>
    </html>
  );
}
