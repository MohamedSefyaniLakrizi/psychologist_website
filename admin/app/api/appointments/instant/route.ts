import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { generateJitsiTokensForAppointment } from "@/lib/jitsi";
import { EmailScheduler } from "@/lib/services/email-scheduler";
import { sendMeetingEmail } from "@/lib/services/meeting-email-service";

const prisma = new PrismaClient();

export async function POST(request: NextRequest) {
  try {
    const { clientId, startTime, endTime, format, customRate } =
      await request.json();

    // Validate required fields
    if (!clientId || !startTime || !endTime || !format) {
      return NextResponse.json(
        { error: "Tous les champs sont requis" },
        { status: 400 }
      );
    }

    // Get confirmed client info
    const client = await prisma.client.findUnique({
      where: {
        id: clientId,
        confirmed: true,
      },
      select: {
        firstName: true,
        lastName: true,
        email: true,
        sendInvoiceAutomatically: true,
        defaultRate: true,
      },
    });

    if (!client) {
      return NextResponse.json({ error: "Client non trouvé" }, { status: 404 });
    }

    // Generate Jitsi tokens for online meetings
    let hostJwt, clientJwt;
    if (format === "ONLINE") {
      const clientName = `${client.firstName} ${client.lastName}`;
      const tokens = await generateJitsiTokensForAppointment(
        "Séance instantanée",
        clientName,
        client.email,
        new Date(startTime),
        new Date(endTime)
      );
      hostJwt = tokens.hostJwt;
      clientJwt = tokens.clientJwt;
    }

    // Create the appointment
    const appointment = await prisma.appointment.create({
      data: {
        clientId,
        startTime: new Date(startTime),
        endTime: new Date(endTime),
        format,
        status: "NOT_YET_ATTENDED",
        hostJwt,
        clientJwt,
      },
      include: {
        client: true,
      },
    });

    // Create invoice automatically for instant appointments
    const clientRate = customRate || client.defaultRate || 300; // Use custom rate, then client's default rate, or fallback to 300
    await prisma.invoice.create({
      data: {
        clientId,
        appointmentId: appointment.id,
        amount: clientRate,
        status: "UNPAID",
        description: `Séance instantanée - ${new Date(startTime).toLocaleDateString("fr-FR")}`,
        dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
      },
    });

    // Schedule emails (but skip 24h and 1h reminders for instant meetings)
    try {
      await EmailScheduler.scheduleAppointmentEmails(
        appointment.id,
        client.email,
        `${client.firstName} ${client.lastName}`,
        new Date(startTime),
        new Date(endTime),
        client.sendInvoiceAutomatically,
        false // Don't include reminders for instant meetings
      );
    } catch (emailError) {
      console.error("Error scheduling emails:", emailError);
      // Don't fail the appointment creation if email scheduling fails
    }

    // Generate meeting URLs
    const baseUrl = process.env.WEBSITE_URL;
    const hostJoinUrl = hostJwt
      ? `${baseUrl}/meeting/host?jwt=${hostJwt}&appointmentId=${appointment.id}&role=host&title=Rendez Vous&room=Rendez Vous&user=Malika Lkhabir`
      : null;
    const clientJoinUrl = clientJwt
      ? `${baseUrl}/meeting?jwt=${clientJwt}&appointmentId=${appointment.id}&role=client&title=Rendez Vous&room=Rendez Vous&user=${client.firstName} ${client.lastName}`
      : null;

    // Send meeting email to client
    if (clientJoinUrl) {
      console.log("Sending meeting email to:", client.email);

      try {
        const emailResult = await sendMeetingEmail({
          clientEmail: client.email,
          clientName: `${client.firstName} ${client.lastName}`,
          meetingUrl: clientJoinUrl,
        });

        if (emailResult.success) {
          console.log("✅ Meeting email sent successfully");
        } else {
          console.error("Failed to send meeting email:", emailResult.error);
        }
      } catch (emailError) {
        console.error("Error sending meeting email:", emailError);
      }
    }

    return NextResponse.json({
      ...appointment,
      hostJoinUrl,
      clientJoinUrl,
    });
  } catch (error) {
    console.error("Error creating instant appointment:", error);
    return NextResponse.json(
      { error: "Erreur interne du serveur" },
      { status: 500 }
    );
  }
}
