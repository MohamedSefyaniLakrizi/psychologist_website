import { NextResponse } from "next/server";
import { Resend } from "resend";
import { z } from "zod";

const resend = new Resend(process.env.RESEND_API_KEY);

// Validation schema for the contact form
const contactSchema = z.object({
  firstName: z.string().min(1, "Le prénom est requis"),
  lastName: z.string().min(1, "Le nom est requis"),
  email: z.string().email("Email invalide"),
  phone: z.string().optional(),
  subject: z.string().min(1, "Le sujet est requis"),
  message: z
    .string()
    .min(10, "Le message doit contenir au moins 10 caractères"),
});

export async function POST(request: Request) {
  try {
    const body = await request.json();

    // Validate the request body
    const validatedData = contactSchema.parse(body);

    const { firstName, lastName, email, phone, subject, message } =
      validatedData;

    // Create email content
    const emailContent = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f9fafb;">
        <div style="background-color: white; border-radius: 12px; padding: 30px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
          <h2 style="color: #1f2937; margin-bottom: 20px; border-bottom: 3px solid #3b82f6; padding-bottom: 10px;">
            📧 Nouveau message de contact
          </h2>
          
          <div style="background-color: #eff6ff; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
            <h3 style="color: #1e40af; margin-top: 0; margin-bottom: 15px;">👤 Informations du contact :</h3>
            <table style="width: 100%; border-collapse: collapse;">
              <tr>
                <td style="padding: 8px 0; font-weight: bold; color: #374151; width: 120px;">Nom complet :</td>
                <td style="padding: 8px 0; color: #1f2937;">${firstName} ${lastName}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; font-weight: bold; color: #374151;">Email :</td>
                <td style="padding: 8px 0; color: #1f2937;">
                  <a href="mailto:${email}" style="color: #3b82f6; text-decoration: none;">${email}</a>
                </td>
              </tr>
              ${
                phone
                  ? `
              <tr>
                <td style="padding: 8px 0; font-weight: bold; color: #374151;">Téléphone :</td>
                <td style="padding: 8px 0; color: #1f2937;">
                  <a href="tel:${phone}" style="color: #3b82f6; text-decoration: none;">${phone}</a>
                </td>
              </tr>
              `
                  : ""
              }
            </table>
          </div>

          <div style="background-color: #f0fdf4; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
            <h3 style="color: #166534; margin-top: 0; margin-bottom: 10px;">📝 Sujet :</h3>
            <p style="margin: 0; color: #1f2937; font-weight: 500; font-size: 16px;">${subject}</p>
          </div>

          <div style="background-color: #fefce8; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
            <h3 style="color: #ca8a04; margin-top: 0; margin-bottom: 15px;">💬 Message :</h3>
            <div style="background-color: white; padding: 15px; border-radius: 6px; border-left: 4px solid #eab308;">
              <p style="margin: 0; color: #1f2937; line-height: 1.6; white-space: pre-wrap;">${message}</p>
            </div>
          </div>

          <div style="background-color: #f3f4f6; padding: 15px; border-radius: 8px; margin-top: 30px;">
            <h4 style="color: #374151; margin-top: 0; margin-bottom: 10px;">🚀 Actions rapides :</h4>
            <div style="display: flex; gap: 10px; flex-wrap: wrap;">
              <a href="mailto:${email}" 
                 style="background-color: #3b82f6; color: white; padding: 8px 16px; border-radius: 6px; text-decoration: none; font-size: 14px; display: inline-block;">
                📧 Répondre par email
              </a>
              ${
                phone
                  ? `
              <a href="tel:${phone}" 
                 style="background-color: #10b981; color: white; padding: 8px 16px; border-radius: 6px; text-decoration: none; font-size: 14px; display: inline-block;">
                📞 Appeler
              </a>
              `
                  : ""
              }
              <a href="mailto:${email}?subject=Re: ${encodeURIComponent(subject)}" 
                 style="background-color: #8b5cf6; color: white; padding: 8px 16px; border-radius: 6px; text-decoration: none; font-size: 14px; display: inline-block;">
                💬 Répondre avec sujet
              </a>
            </div>
          </div>

          <hr style="margin: 30px 0; border: 0; border-top: 1px solid #e5e7eb;">
          <p style="font-size: 12px; color: #6b7280; margin: 0; text-align: center;">
            <em>Ce message a été envoyé depuis le formulaire de contact du site web.</em><br>
            <strong>Date :</strong> ${new Date().toLocaleDateString("fr-FR", {
              weekday: "long",
              year: "numeric",
              month: "long",
              day: "numeric",
              hour: "2-digit",
              minute: "2-digit",
            })}
          </p>
        </div>
      </div>
    `;

    // Send email using Resend
    const { data, error } = await resend.emails.send({
      from: "Formulaire de Contact <onboarding@resend.dev>",
      to: ["mohamedsefyani@gmail.com"], // Replace with your actual email
      subject: `📧 Nouveau message de contact - ${subject}`,
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
        message: "Message envoyé avec succès",
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
