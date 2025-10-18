import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(request: NextRequest) {
  try {
    const { appointmentId, jwt } = await request.json();
    if (!appointmentId || !jwt) {
      return NextResponse.json(
        { error: "Missing appointmentId or JWT" },
        { status: 400 }
      );
    }

    // Find the appointment and verify the JWT matches
    const appointment = await (prisma as any).appointment.findUnique({
      where: { id: appointmentId },
      select: {
        id: true,
        clientJwt: true,
        clientAttended: true,
        hostAttended: true,
        startTime: true,
        endTime: true,
      },
    });

    if (!appointment) {
      return NextResponse.json(
        { error: "Appointment not found" },
        { status: 404 }
      );
    }

    // Verify the JWT matches the stored client JWT
    if (appointment.clientJwt !== jwt) {
      return NextResponse.json(
        { error: "JWT token does not match appointment" },
        { status: 403 }
      );
    }

    // Check if client is accessing during valid time (30 minutes before start to end time)
    const now = new Date();
    const startTime = new Date(appointment.startTime);
    const endTime = new Date(appointment.endTime);
    const thirtyMinutesBefore = new Date(startTime.getTime() - 30 * 60 * 1000);

    if (now < thirtyMinutesBefore || now > endTime) {
      return NextResponse.json(
        { error: "Meeting access outside allowed time window" },
        { status: 403 }
      );
    }

    // Update clientAttended to true if not already set
    const updatedAppointment = await (prisma as any).appointment.update({
      where: { id: appointmentId },
      data: {
        clientAttended: true,
        // If host has already attended, set status to ATTENDED
        status: appointment.hostAttended ? "ATTENDED" : undefined,
      },
      select: {
        id: true,
        clientAttended: true,
        hostAttended: true,
        status: true,
      },
    });
    console.log("Updated appointment:", updatedAppointment);
    console.log(`✅ Client attendance marked for appointment ${appointmentId}`);

    if (updatedAppointment.status === "ATTENDED") {
      console.log(
        `📋 Appointment ${appointmentId} status set to ATTENDED (both parties attended)`
      );
    }

    return NextResponse.json({
      success: true,
      clientAttended: updatedAppointment.clientAttended,
      status: updatedAppointment.status,
    });
  } catch (error) {
    console.error("Error updating client attendance:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
