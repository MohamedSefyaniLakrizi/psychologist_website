import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(request: NextRequest) {
  try {
    const { appointmentId, jwt: jwtToken } = await request.json();

    if (!appointmentId || !jwtToken) {
      return NextResponse.json(
        { error: "Appointment ID and JWT token are required" },
        { status: 400 }
      );
    }

    // Find the appointment
    const appointment = await (prisma as any).appointment.findUnique({
      where: { id: appointmentId },
    });

    if (!appointment) {
      return NextResponse.json(
        { error: "Appointment not found" },
        { status: 404 }
      );
    }

    // Check if host has already attended
    if (appointment.hostAttended) {
      return NextResponse.json(
        { message: "Host attendance already recorded" },
        { status: 200 }
      );
    }

    // Check if the provided token matches the stored host JWT
    if (appointment.hostJwt !== jwtToken) {
      return NextResponse.json(
        { error: "JWT token does not match appointment host token" },
        { status: 403 }
      );
    }

    // Check timing - allow access from 30 minutes before until meeting ends
    const now = new Date();
    const startTime = new Date(appointment.startTime);
    const endTime = new Date(appointment.endTime);
    const thirtyMinutesBefore = new Date(startTime.getTime() - 30 * 60 * 1000);

    if (now < thirtyMinutesBefore) {
      return NextResponse.json(
        { error: "Meeting access is not yet available" },
        { status: 403 }
      );
    }

    if (now > endTime) {
      return NextResponse.json(
        { error: "Meeting has already ended" },
        { status: 403 }
      );
    }

    // Mark host as attended
    const updatedAppointment = await (prisma as any).appointment.update({
      where: { id: appointmentId },
      data: {
        hostAttended: true,
        // If client has already attended, set status to ATTENDED
        status: appointment.clientAttended ? "ATTENDED" : undefined,
      },
      select: {
        id: true,
        hostAttended: true,
        clientAttended: true,
        status: true,
      },
    });

    console.log("Updated appointment:", updatedAppointment);
    console.log(`✅ Host attendance marked for appointment ${appointmentId}`);

    if (updatedAppointment.status === "ATTENDED") {
      console.log(
        `📋 Appointment ${appointmentId} status set to ATTENDED (both parties attended)`
      );
    }

    return NextResponse.json(
      {
        message: "Host attendance recorded successfully",
        appointmentId: appointmentId,
        attendedAt: now.toISOString(),
        hostAttended: updatedAppointment.hostAttended,
        status: updatedAppointment.status,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error in host-attended API:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
