import { NextResponse } from "next/server";
import { Resend } from "resend";
import { z } from "zod";

const resend = new Resend(process.env.RESEND_API_KEY);

// Validation schema for the request body
const emailSchema = z.object({
  firstName: z.string().min(1),
  lastName: z.string().min(1),
  email: z.string().email(),
  phone: z.string().min(1),
  date: z.string(),
  time: z.string(),
  preferred_method: z.string(),
});

export async function POST(request: Request) {
  try {
    const body = await request.json();

    // Validate the request body
    const validatedData = emailSchema.parse(body);

    const { firstName, lastName, email, phone, date, time, preferred_method } =
      validatedData;

    // Format the date for better readability
    const formattedDate = new Date(date).toLocaleDateString("fr-FR", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    });

    // Create email content
    const emailContent = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <h2>Nouvelle demande de rendez-vous</h2>
        
        <h3>Informations du client :</h3>
        <ul>
          <li><strong>Nom complet :</strong> ${firstName} ${lastName}</li>
          <li><strong>Email :</strong> ${email}</li>
          <li><strong>Téléphone :</strong> ${phone}</li>
        </ul>

        <h3>Détails du rendez-vous :</h3>
        <ul>
          <li><strong>Date souhaitée :</strong> ${formattedDate}</li>
          <li><strong>Heure souhaitée :</strong> ${time}</li>
          <li><strong>Méthode de contact préférée :</strong> ${preferred_method}</li>
        </ul>

        <hr style="margin: 30px 0;">
        <a href="https://dashboard-appointment-website.vercel.app/approvals">
          <button style="background-color: #2563eb; color: white; padding: 12px 24px; border: none; border-radius: 6px; font-weight: bold; cursor: pointer;">
            Confirmer le rendez-vous
          </button>
        </a>
        <hr style="margin: 20px 0;">
        <p style="font-size: 14px; color: #6b7280;"><em>Cette demande a été soumise depuis le formulaire de prise de rendez-vous du site web.</em></p>
      </div>
    `;

    // Send email using Resend
    const { data, error } = await resend.emails.send({
      from: "Système de Réservation <onboarding@resend.dev>", // Using Resend's test domain
      to: ["mohamedsefyani@gmail.com"], // Replace with your actual email
      subject: `🗓️ Nouvelle demande de rendez-vous - ${firstName} ${lastName}`,
      html: emailContent,
      replyTo: email, // Allow you to reply directly to the client
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
    console.error("API error:", error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Données invalides", details: error.issues },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: "Erreur interne du serveur" },
      { status: 500 }
    );
  }
}
