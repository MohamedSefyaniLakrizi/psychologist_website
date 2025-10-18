import { NextResponse } from "next/server";
import { Resend } from "resend";
import { z } from "zod";

const resend = new Resend(process.env.RESEND_API_KEY);

// Email templates
const EMAIL_TEMPLATES = {
  confirmation: {
    subject: "✅ Confirmation de votre rendez-vous",
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <h2 style="color: #2563eb;">✅ Votre rendez-vous est confirmé</h2>
        
        <p>Bonjour <strong>{{firstName}} {{lastName}}</strong>,</p>
        
        <p>Nous avons le plaisir de confirmer votre rendez-vous :</p>
        
        <div style="background-color: #f3f4f6; padding: 15px; border-radius: 8px; margin: 20px 0;">
          <h3 style="margin-top: 0; color: #374151;">📅 Détails du rendez-vous</h3>
          <ul style="list-style: none; padding: 0;">
            <li><strong>Date :</strong> {{date}}</li>
            <li><strong>Heure :</strong> {{time}}</li>
            <li><strong>Type :</strong> Consultation en cabinet</li>
          </ul>
        </div>
        
        <p>📍 <strong>Adresse du cabinet :</strong><br>
        [Votre adresse ici]<br>
        [Ville, Code postal]</p>
        
        <p>📞 En cas d'imprévu, n'hésitez pas à nous contacter au [votre numéro].</p>
        
        <p>Nous nous réjouissons de vous rencontrer.</p>
        
        <p>Cordialement,<br>
        <strong>[Votre nom]</strong></p>
      </div>
    `,
  },

  reschedule: {
    subject: "📅 Reprogrammation de votre rendez-vous",
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <h2 style="color: #f59e0b;">📅 Reprogrammation de votre rendez-vous</h2>
        
        <p>Bonjour <strong>{{firstName}} {{lastName}}</strong>,</p>
        
        <p>Nous vous contactons concernant votre rendez-vous initialement prévu le <strong>{{originalDate}}</strong> à <strong>{{originalTime}}</strong>.</p>
        
        <p>En raison d'un imprévu, nous devons reprogrammer votre rendez-vous. Nous vous proposons les créneaux suivants :</p>
        
        <div style="background-color: #fef3c7; padding: 15px; border-radius: 8px; margin: 20px 0;">
          <h3 style="margin-top: 0; color: #92400e;">🗓️ Nouveaux créneaux disponibles</h3>
          <ul>
            <li>[Date 1] à [Heure 1]</li>
            <li>[Date 2] à [Heure 2]</li>
            <li>[Date 3] à [Heure 3]</li>
          </ul>
        </div>
        
        <p>Merci de nous confirmer votre disponibilité en répondant à ce message ou en nous appelant au [votre numéro].</p>
        
        <p>Nous nous excusons pour ce désagrément et vous remercions de votre compréhension.</p>
        
        <p>Cordialement,<br>
        <strong>[Votre nom]</strong></p>
      </div>
    `,
  },

  reminder: {
    subject: "🔔 Rappel de votre rendez-vous",
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <h2 style="color: #059669;">🔔 Rappel de votre rendez-vous</h2>
        
        <p>Bonjour <strong>{{firstName}} {{lastName}}</strong>,</p>
        
        <p>Nous vous rappelons que vous avez un rendez-vous :</p>
        
        <div style="background-color: #ecfdf5; padding: 15px; border-radius: 8px; margin: 20px 0;">
          <h3 style="margin-top: 0; color: #065f46;">📅 Votre rendez-vous</h3>
          <ul style="list-style: none; padding: 0;">
            <li><strong>Date :</strong> {{date}}</li>
            <li><strong>Heure :</strong> {{time}}</li>
            <li><strong>Adresse :</strong> [Votre adresse]</li>
          </ul>
        </div>
        
        <p>📋 <strong>Préparation :</strong></p>
        <ul>
          <li>Veuillez arriver 10 minutes avant l'heure prévue</li>
          <li>Apportez une pièce d'identité</li>
          <li>N'hésitez pas à préparer vos questions</li>
        </ul>
        
        <p>📞 En cas d'empêchement, merci de nous prévenir au moins 24h à l'avance.</p>
        
        <p>À bientôt !</p>
        
        <p>Cordialement,<br>
        <strong>[Votre nom]</strong></p>
      </div>
    `,
  },

  cancellation: {
    subject: "❌ Annulation de votre rendez-vous",
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <h2 style="color: #dc2626;">❌ Annulation de votre rendez-vous</h2>
        
        <p>Bonjour <strong>{{firstName}} {{lastName}}</strong>,</p>
        
        <p>Nous vous informons que votre rendez-vous du <strong>{{date}}</strong> à <strong>{{time}}</strong> a été annulé.</p>
        
        <div style="background-color: #fef2f2; padding: 15px; border-radius: 8px; margin: 20px 0;">
          <h3 style="margin-top: 0; color: #991b1b;">📋 Détails de l'annulation</h3>
          <p>Motif : [Préciser le motif si nécessaire]</p>
        </div>
        
        <p>Si vous souhaitez reprendre un nouveau rendez-vous, n'hésitez pas à :</p>
        <ul>
          <li>📞 Nous appeler au [votre numéro]</li>
          <li>📧 Répondre à ce message</li>
          <li>🌐 Utiliser notre formulaire en ligne</li>
        </ul>
        
        <p>Nous nous excusons pour ce désagrément et restons à votre disposition.</p>
        
        <p>Cordialement,<br>
        <strong>[Votre nom]</strong></p>
      </div>
    `,
  },
} as const;

// Validation schema
const templateEmailSchema = z.object({
  templateType: z.enum([
    "confirmation",
    "reschedule",
    "reminder",
    "cancellation",
  ]),
  clientEmail: z.string().email(),
  firstName: z.string().min(1),
  lastName: z.string().min(1),
  date: z.string(),
  time: z.string(),
  originalDate: z.string().optional(),
  originalTime: z.string().optional(),
});

export async function POST(request: Request) {
  try {
    const body = await request.json();

    // Validate the request body
    const validatedData = templateEmailSchema.parse(body);

    const {
      templateType,
      clientEmail,
      firstName,
      lastName,
      date,
      time,
      originalDate,
      originalTime,
    } = validatedData;

    // Get the selected template
    const template = EMAIL_TEMPLATES[templateType];

    // Format the date for better readability
    const formattedDate = new Date(date).toLocaleDateString("fr-FR", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    });

    const formattedOriginalDate = originalDate
      ? new Date(originalDate).toLocaleDateString("fr-FR", {
          weekday: "long",
          year: "numeric",
          month: "long",
          day: "numeric",
        })
      : "";

    // Replace template variables
    const emailContent = template.html
      .replace(/{{firstName}}/g, firstName)
      .replace(/{{lastName}}/g, lastName)
      .replace(/{{date}}/g, formattedDate)
      .replace(/{{time}}/g, time)
      .replace(/{{originalDate}}/g, formattedOriginalDate)
      .replace(/{{originalTime}}/g, originalTime || "");

    // Send email using Resend
    const { data, error } = await resend.emails.send({
      from: "Cabinet Médical <onboarding@resend.dev>",
      to: [clientEmail],
      subject: template.subject,
      html: emailContent,
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
        message: "Email de template envoyé avec succès",
        emailId: data?.id,
        templateType,
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

// GET endpoint to retrieve available templates
export async function GET() {
  const templates = Object.keys(EMAIL_TEMPLATES).map((key) => ({
    id: key,
    name: getTemplateName(key as keyof typeof EMAIL_TEMPLATES),
    description: getTemplateDescription(key as keyof typeof EMAIL_TEMPLATES),
  }));

  return NextResponse.json({ templates });
}

function getTemplateName(templateType: keyof typeof EMAIL_TEMPLATES): string {
  const names = {
    confirmation: "Confirmation de rendez-vous",
    reschedule: "Reprogrammation",
    reminder: "Rappel de rendez-vous",
    cancellation: "Annulation",
  };
  return names[templateType];
}

function getTemplateDescription(
  templateType: keyof typeof EMAIL_TEMPLATES
): string {
  const descriptions = {
    confirmation:
      "Email de confirmation envoyé après acceptation du rendez-vous",
    reschedule: "Email pour reprogrammer un rendez-vous existant",
    reminder: "Email de rappel envoyé avant le rendez-vous",
    cancellation: "Email d'annulation d'un rendez-vous",
  };
  return descriptions[templateType];
}
