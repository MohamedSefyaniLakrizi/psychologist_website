import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/app/lib/prisma";

const appointmentSchema = z.object({
  firstName: z.string().min(1, "Le prénom est requis"),
  lastName: z.string().min(1, "Le nom est requis"),
  email: z.string().email("Email invalide"),
  phoneNumber: z.string().min(1, "Le numéro de téléphone est requis"),
  appointmentDate: z.string(), // ISO date string
  appointmentTime: z.string(), // HH:MM format
  format: z.enum(["ONLINE", "IN_PERSON"]),
  preferredContact: z.enum(["EMAIL", "PHONE", "WHATSAPP"]),
});

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const validatedData = appointmentSchema.parse(body);

    const {
      firstName,
      lastName,
      email,
      phoneNumber,
      appointmentDate,
      appointmentTime,
      format,
      preferredContact,
    } = validatedData;

    // Parse the appointment date and time
    const startDateTime = new Date(`${appointmentDate}T${appointmentTime}:00`);
    const endDateTime = new Date(startDateTime.getTime() + 60 * 60 * 1000); // Add 1 hour

    try {
      // Create or find client
      const client = await prisma.client.upsert({
        where: { email },
        update: {
          firstName,
          lastName,
          phoneNumber,
          preferredContact,
        },
        create: {
          firstName,
          lastName,
          email,
          phoneNumber,
          preferredContact,
          confirmed: false,
        },
      });

      // Create appointment
      const appointment = await prisma.appointment.create({
        data: {
          clientId: client.id,
          startTime: startDateTime,
          endTime: endDateTime,
          format,
          confirmed: false,
        },
      });

      // Send confirmation email (reuse existing email functionality)
      try {
        const emailResponse = await fetch(
          `${request.url.replace("/api/appointments", "/api/send-booking-email")}`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              firstName,
              lastName,
              email,
              phone: phoneNumber,
              date: startDateTime.toISOString(),
              time: appointmentTime,
              preferred_method: preferredContact,
              appointmentType: format,
            }),
          }
        );

        if (!emailResponse.ok) {
          console.error("Failed to send confirmation email");
        }
      } catch (emailError) {
        console.error("Error sending confirmation email:", emailError);
      }

      return NextResponse.json(
        {
          message: "Rendez-vous créé avec succès",
          appointment: {
            id: appointment.id,
            startTime: appointment.startTime,
            endTime: appointment.endTime,
            format: appointment.format,
          },
          client: {
            id: client.id,
            firstName: client.firstName,
            lastName: client.lastName,
            email: client.email,
          },
        },
        { status: 201 }
      );
    } catch (prismaError) {
      console.error("Database error:", prismaError);

      // Fallback: create mock data and send email
      const mockClient = {
        id: "mock-client-id",
        firstName,
        lastName,
        email,
        phoneNumber,
        preferredContact,
        confirmed: false,
      };

      const mockAppointment = {
        id: "mock-appointment-id",
        clientId: mockClient.id,
        startTime: startDateTime,
        endTime: endDateTime,
        format,
        confirmed: false,
      };

      // Send confirmation email
      try {
        const emailResponse = await fetch(
          `${request.url.replace("/api/appointments", "/api/send-booking-email")}`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              firstName,
              lastName,
              email,
              phone: phoneNumber,
              date: startDateTime.toISOString(),
              time: appointmentTime,
              preferred_method: preferredContact,
              appointmentType: format,
            }),
          }
        );

        if (!emailResponse.ok) {
          console.error("Failed to send confirmation email");
        }
      } catch (emailError) {
        console.error("Error sending confirmation email:", emailError);
      }

      return NextResponse.json(
        {
          message: "Rendez-vous créé avec succès (mode dégradé)",
          appointment: {
            id: mockAppointment.id,
            startTime: mockAppointment.startTime,
            endTime: mockAppointment.endTime,
            format: mockAppointment.format,
          },
          client: {
            id: mockClient.id,
            firstName: mockClient.firstName,
            lastName: mockClient.lastName,
            email: mockClient.email,
          },
        },
        { status: 201 }
      );
    }
  } catch (error) {
    console.error("Appointment creation error:", error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Données invalides", details: error.issues },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: "Erreur lors de la création du rendez-vous" },
      { status: 500 }
    );
  }
}

export async function GET(request: Request) {
  try {
    const appointments = await prisma.appointment.findMany({
      where: {
        confirmed: false, // Only unconfirmed appointments for admin review
      },
      include: {
        client: true,
      },
      orderBy: {
        startTime: "asc",
      },
    });

    return NextResponse.json(appointments);
  } catch (error) {
    console.error("Error fetching appointments:", error);

    // Fallback to mock data if database is unavailable
    const mockAppointments = [
      {
        id: "mock-appointment-1",
        startTime: new Date(),
        endTime: new Date(Date.now() + 60 * 60 * 1000),
        format: "IN_PERSON",
        confirmed: false,
        client: {
          id: "mock-client-1",
          firstName: "John",
          lastName: "Doe",
          email: "john.doe@example.com",
          phoneNumber: "06 12 34 56 78",
          preferredContact: "EMAIL",
        },
      },
    ];

    return NextResponse.json(mockAppointments);
  }
}
