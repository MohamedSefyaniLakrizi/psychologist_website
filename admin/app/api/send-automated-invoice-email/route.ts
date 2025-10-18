import { NextRequest, NextResponse } from "next/server";
import { Resend } from "resend";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { PrismaClient } from "@prisma/client";
import {
  generateInvoicePdf,
  generateInvoiceFilename,
} from "@/lib/pdf-generator";

const resend = new Resend(process.env.RESEND_API_KEY);
const prisma = new PrismaClient();

export async function POST(request: NextRequest) {
  try {
    const { appointmentId } = await request.json();

    // Validate required fields
    if (!appointmentId) {
      return NextResponse.json(
        { error: "ID de rendez-vous manquant" },
        { status: 400 }
      );
    }

    // Fetch appointment data from database
    const appointment = await prisma.appointment.findUnique({
      where: { id: appointmentId },
      include: {
        client: true,
        invoice: true,
      },
    });

    if (!appointment) {
      return NextResponse.json(
        { error: "Rendez-vous non trouvé" },
        { status: 404 }
      );
    }

    // Check if appointment was attended (status = ATTENDED)
    if (appointment.status !== "ATTENDED") {
      console.log(
        `⏭️ Skipping invoice email for appointment ${appointmentId} - status: ${appointment.status}`
      );
      return NextResponse.json(
        {
          message: "Facture non envoyée - rendez-vous non marqué comme assisté",
        },
        { status: 200 }
      );
    }

    if (!appointment.client.email) {
      return NextResponse.json(
        { error: "Aucune adresse email disponible pour ce client" },
        { status: 400 }
      );
    }

    // Check if invoice exists, if not create one automatically
    let invoice = appointment.invoice;
    if (!invoice) {
      console.log(
        "💳 Creating invoice automatically for attended appointment:",
        appointmentId
      );

      // Get the rate from a default value or appointment-related data
      // For now, using a default rate - you might want to store this in the appointment or get from settings
      const defaultRate = 300; // Default rate in Dh

      invoice = await prisma.invoice.create({
        data: {
          clientId: appointment.clientId,
          appointmentId: appointment.id,
          amount: defaultRate,
          status: "UNPAID",
          description: `Consultation - ${format(new Date(appointment.startTime), "PPP", { locale: fr })}`,
          dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
        },
        include: {
          client: true,
          appointment: true,
        },
      });

      console.log("✅ Created invoice automatically:", invoice.id);
    } else {
      // Include client and appointment relations for existing invoice
      invoice = await prisma.invoice.findUnique({
        where: { id: invoice.id },
        include: {
          client: true,
          appointment: true,
        },
      });
    }

    if (!invoice) {
      return NextResponse.json(
        { error: "Impossible de créer ou récupérer la facture" },
        { status: 500 }
      );
    }

    // Generate PDF without stamp
    const invoiceData = {
      id: invoice.id,
      amount: Number(invoice.amount), // Convert Decimal to number
      createdAt: invoice.createdAt,
      dueDate: invoice.dueDate,
      client: appointment.client,
      appointment: {
        startTime: appointment.startTime,
      },
    };
    const pdfBuffer = generateInvoicePdf(invoiceData);
    const filename = generateInvoiceFilename(invoice.id);

    // Format appointment date for email
    const appointmentDate = appointment.startTime
      ? format(new Date(appointment.startTime), "PPP 'à' HH:mm", {
          locale: fr,
        })
      : "Non spécifié";

    // Format appointment date for subject (DD/MM/YYYY format)
    const appointmentDateForSubject = appointment.startTime
      ? format(new Date(appointment.startTime), "dd/MM/yyyy")
      : format(new Date(invoice.createdAt), "dd/MM/yyyy");

    // Email content - same as manual but automated
    const emailSubject = `${appointment.client.firstName} ${appointment.client.lastName} - Facture de la séance du ${appointmentDateForSubject}`;

    const emailHtml = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <style>
            body { font-family: 'Times New Roman', serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background-color: #f8f9fa; padding: 20px; border-radius: 8px; margin-bottom: 20px; }
            .footer { margin-top: 30px; padding-top: 20px; border-top: 1px solid #dee2e6; font-size: 0.9em; color: #6c757d; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <p>Bonjour ${appointment.client.firstName} ${appointment.client.lastName},</p>
              <p>Veuillez trouver ci-joint votre facture pour le rendez-vous du ${appointmentDate}.</p>
            </div>
            
            <p>Si vous avez des questions concernant cette facture, n'hésitez pas à nous contacter.</p>
            
            <div class="footer">
              <p>Cordialement,<br>
              <strong>Votre Société</strong><br>
              123 Rue de l'Exemple<br>
              20000 Casablanca, Maroc<br>
              Tél: +212 5 22 XX XX XX<br>
              Email: contact@votresociete.ma</p>
            </div>
          </div>
        </body>
      </html>
    `;

    const emailText = `
Bonjour ${appointment.client.firstName} ${appointment.client.lastName},

Veuillez trouver ci-joint votre facture pour le rendez-vous du ${appointmentDate}.

Si vous avez des questions concernant cette facture, n'hésitez pas à nous contacter.

Cordialement,
Votre Société
123 Rue de l'Exemple
20000 Casablanca, Maroc
Tél: +212 5 22 XX XX XX
Email: contact@votresociete.ma
    `;

    // Send email using Resend with PDF attachment
    const { data, error } = await resend.emails.send({
      from: process.env.RESEND_FROM_EMAIL || "onboarding@resend.dev",
      to: [appointment.client.email],
      subject: emailSubject,
      html: emailHtml,
      text: emailText,
      attachments: [
        {
          filename: filename,
          content: pdfBuffer,
        },
      ],
    });

    if (error) {
      console.error("Resend error:", error);
      return NextResponse.json(
        { error: "Erreur lors de l'envoi de l'email" },
        { status: 500 }
      );
    }

    console.log(
      `✅ Automated invoice email sent successfully for appointment ${appointmentId}`
    );

    return NextResponse.json(
      {
        message: "Email de facture automatique envoyé avec succès",
        emailId: data?.id,
        invoiceId: invoice.id,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error sending automated invoice email:", error);
    return NextResponse.json(
      { error: "Erreur interne du serveur" },
      { status: 500 }
    );
  }
}
