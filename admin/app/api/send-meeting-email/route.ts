import { NextRequest, NextResponse } from "next/server";
import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(request: NextRequest) {
  try {
    const { clientEmail, clientName, meetingUrl } = await request.json();
    console.log(
      "------------------ASAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA-------------"
    );
    console.log("SENDING EMAIL FROM API:", {
      clientEmail,
      clientName,
      meetingUrl,
    });
    console.log(
      "----------------AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAaa--------------"
    );
    // Validate required fields
    if (!clientEmail || !clientName || !meetingUrl) {
      return NextResponse.json(
        { error: "Tous les champs sont requis" },
        { status: 400 }
      );
    }

    const emailSubject = `Votre séance instantanée est prête`;

    const emailHtml = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <style>
            body { font-family: 'Times New Roman', serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background-color: #f8f9fa; padding: 20px; border-radius: 8px; margin-bottom: 20px; }
            .meeting-button { 
              display: inline-block; 
              padding: 12px 24px; 
              background-color: #007bff; 
              color: white; 
              text-decoration: none; 
              border-radius: 6px; 
              font-weight: bold;
              margin: 20px 0;
            }
            .footer { margin-top: 30px; padding-top: 20px; border-top: 1px solid #dee2e6; font-size: 0.9em; color: #6c757d; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h2>Votre séance est prête !</h2>
              <p>Bonjour ${clientName},</p>
              <p>Votre séance instantanée a été créée et est maintenant disponible.</p>
            </div>
            
            <p>Cliquez sur le bouton ci-dessous pour rejoindre votre séance :</p>
            
            <div style="text-align: center;">
              <a href="${meetingUrl}" class="meeting-button">Rejoindre la séance</a>
            </div>
            
            <p><strong>Lien direct :</strong><br>
            <a href="${meetingUrl}">${meetingUrl}</a></p>
            
            <p>Si vous avez des difficultés à vous connecter, n'hésitez pas à nous contacter.</p>
            
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
Bonjour ${clientName},

Votre séance instantanée a été créée et est maintenant disponible.

Rejoignez votre séance en utilisant ce lien :
${meetingUrl}

Si vous avez des difficultés à vous connecter, n'hésitez pas à nous contacter.

Cordialement,
Votre Société
123 Rue de l'Exemple
20000 Casablanca, Maroc
Tél: +212 5 22 XX XX XX
Email: contact@votresociete.ma
    `;

    // Send email using Resend
    console.log("------------------------------------------------");
    console.log("Sending meeting email to:", clientEmail);
    console.log("------------------------------------------------");
    const { data, error } = await resend.emails.send({
      from: process.env.RESEND_FROM_EMAIL || "onboarding@resend.dev",
      to: [clientEmail],
      subject: emailSubject,
      html: emailHtml,
      text: emailText,
    });

    if (error) {
      console.error("Resend error:", error);
      return NextResponse.json(
        { error: "Erreur lors de l'envoi de l'email" },
        { status: 500 }
      );
    }

    console.log(`✅ Meeting email sent successfully to ${clientEmail}`);

    return NextResponse.json(
      {
        message: "Email de réunion envoyé avec succès",
        emailId: data?.id,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error sending meeting email:", error);
    return NextResponse.json(
      { error: "Erreur interne du serveur" },
      { status: 500 }
    );
  }
}
