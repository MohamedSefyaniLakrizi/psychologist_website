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
    const { invoiceId } = await request.json();

    // Validate required fields
    if (!invoiceId) {
      return NextResponse.json(
        { error: "ID de facture manquant" },
        { status: 400 }
      );
    }

    // Fetch invoice data from database
    const invoice = await prisma.invoice.findUnique({
      where: { id: invoiceId },
      include: {
        client: true,
        appointment: true,
      },
    });

    if (!invoice) {
      return NextResponse.json(
        { error: "Facture non trouvée" },
        { status: 404 }
      );
    }

    if (!invoice.client.email) {
      return NextResponse.json(
        { error: "Aucune adresse email disponible pour ce client" },
        { status: 400 }
      );
    }

    // Generate PDF
    const invoiceData = {
      ...invoice,
      amount: Number(invoice.amount), // Convert Decimal to number
    };
    const pdfBuffer = generateInvoicePdf(invoiceData);
    const filename = generateInvoiceFilename(invoice.id);

    // Format appointment date for email
    const appointmentDate = invoice.appointment?.startTime
      ? format(new Date(invoice.appointment.startTime), "PPP 'à' HH:mm", {
          locale: fr,
        })
      : "Non spécifié";

    // Format appointment date for subject (DD/MM/YYYY format)
    const appointmentDateForSubject = invoice.appointment?.startTime
      ? format(new Date(invoice.appointment.startTime), "dd/MM/yyyy")
      : format(new Date(invoice.createdAt), "dd/MM/yyyy");

    // Email content - simplified message
    const emailSubject = `${invoice.client.firstName} ${invoice.client.lastName} - Facture de la séance du ${appointmentDateForSubject}`;

    const emailHtml = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
        </head>
        <body>
          <div class="container">
            <div class="header">
              <p>Bonjour ${invoice.client.firstName} ${invoice.client.lastName},</p>
              <p>Veuillez trouver ci-joint votre facture pour le rendez-vous du ${appointmentDate}.</p>
            </div>
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
Bonjour ${invoice.client.firstName} ${invoice.client.lastName},

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
      to: [invoice.client.email],
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

    return NextResponse.json(
      {
        message: "Email envoyé avec succès",
        emailId: data?.id,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error sending invoice email:", error);
    return NextResponse.json(
      { error: "Erreur interne du serveur" },
      { status: 500 }
    );
  }
}
