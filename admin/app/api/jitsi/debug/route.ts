import { NextResponse } from "next/server";

export async function GET() {
  try {
    const appId = process.env.JITSI_APP_ID;
    const apiKeyId = process.env.JITSI_API_KEY_ID;
    const privateKey = process.env.JITSI_PRIVATE_KEY;
    const domain = process.env.NEXT_PUBLIC_JITSI_DOMAIN;

    return NextResponse.json({
      config: {
        appId: appId ? `${appId.substring(0, 8)}...` : "MISSING",
        apiKeyId: apiKeyId ? `${apiKeyId.substring(0, 8)}...` : "MISSING",
        privateKeyExists: !!privateKey,
        privateKeyLength: privateKey?.length || 0,
        domain: domain || "MISSING",
      },
      issues: [
        !appId && "JITSI_APP_ID is missing",
        !apiKeyId && "JITSI_API_KEY_ID is missing",
        !privateKey && "JITSI_PRIVATE_KEY is missing",
        !domain && "NEXT_PUBLIC_JITSI_DOMAIN is missing",
      ].filter(Boolean),
      instructions: [
        "1. Go to https://jaas.8x8.vc/",
        "2. Create or select your app",
        "3. Get your App ID (like vpaas-magic-cookie-...)",
        "4. Create an API Key and get both the API Key ID and Private Key",
        "5. Set these in your .env.local file:",
        "   JITSI_APP_ID=your_app_id",
        "   JITSI_API_KEY_ID=your_api_key_id",
        "   JITSI_PRIVATE_KEY=your_private_key",
        "   NEXT_PUBLIC_JITSI_DOMAIN=8x8.vc",
      ],
    });
  } catch (error) {
    return NextResponse.json(
      {
        error: "Failed to check configuration",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}
