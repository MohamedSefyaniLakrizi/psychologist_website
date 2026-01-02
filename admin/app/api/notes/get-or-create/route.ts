import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { generateMeetingName } from "@/lib/jitsi";
import { getTenantId } from "@/lib/actions/tenant";

export async function POST(request: Request) {
  try {
    const tenantId = await getTenantId();
    const body = await request.json();
    const { appointmentId, title } = body;

    if (!appointmentId) {
      return NextResponse.json(
        { error: "appointmentId is required" },
        { status: 400 }
      );
    }

    // Try to find an existing note linked to this appointment
    const existing = await prisma.note.findFirst({
      where: { appointmentId, tenantId },
      select: { id: true },
    });

    if (existing) {
      return NextResponse.json({ id: existing.id });
    }

    // Find appointment to get clientId and appointment details (if any)
    const appointment = await prisma.appointment.findUnique({
      where: { id: appointmentId, tenantId: tenantId },
      select: {
        clientId: true,
        startTime: true,
        client: {
          select: {
            firstName: true,
            lastName: true,
          },
        },
      },
    });

    // Generate meeting name using the same logic as meetings
    let noteName = title || "Note de séance";
    if (appointment) {
      const clientName = appointment.client
        ? `${appointment.client.firstName} ${appointment.client.lastName}`
        : undefined;
      noteName = generateMeetingName(clientName, appointment.startTime);
    }

    // Create a new note for this appointment and attach clientId when available
    const createData: any = {
      title: noteName,
      content: {},
      appointmentId,
      tenantId: tenantId,
    };

    if (appointment?.clientId) {
      createData.clientId = appointment.clientId;
    }

    const note = await prisma.note.create({
      data: createData,
      select: { id: true },
    });

    return NextResponse.json({ id: note.id });
  } catch (error) {
    console.error("Error in get-or-create note API:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
