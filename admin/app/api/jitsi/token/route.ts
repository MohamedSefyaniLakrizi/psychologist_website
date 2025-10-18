import { NextRequest, NextResponse } from "next/server";
import { generateJitsiToken, generateRoomName } from "@/lib/jitsi";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function POST(request: NextRequest) {
  try {
    const {
      appointmentId,
      userName,
      userEmail,
      isHost,
      startTime,
      endTime,
      meetingName,
    } = await request.json();

    console.log("Generating Jitsi token for:", {
      appointmentId,
      userName,
      userEmail,
      isHost,
      startTime,
      endTime,
      meetingName,
    });

    if (!appointmentId || !userName) {
      return NextResponse.json(
        { error: "Appointment ID and user name are required" },
        { status: 400 }
      );
    }

    // For hosts, verify authentication
    if (isHost) {
      const session = await getServerSession(authOptions);
      if (!session) {
        return NextResponse.json(
          { error: "Authentication required for hosts" },
          { status: 401 }
        );
      }
    }

    // Generate a clean room name
    const roomName = generateRoomName(appointmentId);

    // Parse dates if provided
    const parsedStartTime = startTime ? new Date(startTime) : undefined;
    const parsedEndTime = endTime ? new Date(endTime) : undefined;

    // Generate JWT token
    const token = generateJitsiToken({
      roomName,
      userName,
      userEmail,
      isHost,
      appointmentId,
      startTime: parsedStartTime,
      endTime: parsedEndTime,
      meetingName,
    });

    const response = {
      token,
      roomName,
      domain: process.env.NEXT_PUBLIC_JITSI_DOMAIN || "8x8.vc",
    };

    console.log("Generated Jitsi config:", {
      roomName: response.roomName,
      domain: response.domain,
      tokenLength: token.length,
      isHost,
    });

    return NextResponse.json(response);
  } catch (error) {
    console.error("Error generating Jitsi token:", error);
    return NextResponse.json(
      {
        error: "Failed to generate token",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
