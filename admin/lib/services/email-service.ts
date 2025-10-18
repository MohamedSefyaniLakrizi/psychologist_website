import { Resend } from "resend";
import { format } from "date-fns";
import { fr } from "date-fns/locale";

const resend = new Resend(process.env.RESEND_API_KEY);

export class EmailService {
  private static generateAppointmentLink(appointment: any): string {
    const baseUrl = process.env.WEBSITE_URL;

    if (appointment.format === "ONLINE" && appointment.clientJwt) {
      // For online appointments, link directly to the meeting
      return `${baseUrl}/meeting?jwt=${encodeURIComponent(appointment.clientJwt)}&user=${encodeURIComponent(appointment.client.firstName + " " + appointment.client.lastName)}&appointmentId=${encodeURIComponent(appointment.id)}&title=${encodeURIComponent("Consultation")}&room=${encodeURIComponent("Rendez Vous")}`;
    } else {
      // For in-person appointments, link to appointment details
      return `${baseUrl}/appointment/${appointment.id}`;
    }
  }

  private static generateAppointmentButton(
    appointment: any,
    buttonText: string
  ): string {
    const link = this.generateAppointmentLink(appointment);

    if (appointment.format === "ONLINE") {
      return `
        <div style="text-align: center; margin: 20px 0;">
          <a href="${link}" style="background-color: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block;">
            ${buttonText}
          </a>
        </div>
      `;
    } else {
      return `
        <div style="text-align: center; margin: 20px 0;">
          <a href="${link}" style="background-color: #16a34a; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block;">
            ${buttonText}
          </a>
        </div>
      `;
    }
  }

  static async sendConfirmationEmail(appointment: any) {
    try {
      const startTime = format(
        new Date(appointment.startTime),
        "EEEE dd MMMM yyyy 'à' HH:mm",
        { locale: fr }
      );

      const emailContent = this.generateConfirmationEmail(
        appointment,
        startTime
      );

      return await resend.emails.send({
        from: "Malika Lkhabir <onboarding@resend.dev>",
        to: appointment.client.email,
        subject: "Confirmation de votre rendez-vous",
        html: emailContent.html,
      });
    } catch (error) {
      console.error("Error sending confirmation email:", error);
      throw error;
    }
  }

  static async sendRecurringSeriesConfirmationEmail(appointments: any[]) {
    console.log("📧 Preparing to send recurring series confirmation email");
    try {
      if (appointments.length === 0) return;

      const firstAppointment = appointments[0];
      const emailContent =
        this.generateRecurringSeriesConfirmationEmail(appointments);
      console.log(
        "📧 Sending recurring series confirmation email to:",
        firstAppointment.client.email
      );
      return await resend.emails.send({
        from: "Malika Lkhabir <onboarding@resend.dev>",
        to: firstAppointment.client.email,
        subject: "Confirmation de votre série de rendez-vous",
        html: emailContent.html,
      });
    } catch (error) {
      console.error(
        "Error sending recurring series confirmation email:",
        error
      );
      throw error;
    }
  }

  static async sendScheduledEmail(emailSchedule: any) {
    const { appointment } = emailSchedule;

    let emailContent;

    switch (emailSchedule.emailType) {
      case "REMINDER_24H":
        emailContent = this.generate24HourReminderEmail(appointment);
        break;
      case "REMINDER_1H":
        emailContent = this.generate1HourReminderEmail(appointment);
        break;
      default:
        throw new Error(`Unknown email type: ${emailSchedule.emailType}`);
    }

    return await resend.emails.send({
      from: "Dr. Malika <onboarding@resend.dev>",
      to: emailSchedule.recipientEmail,
      subject: emailSchedule.subject,
      html: emailContent.html,
    });
  }

  private static generateConfirmationEmail(
    appointment: any,
    startTime: string
  ) {
    const buttonHtml =
      appointment.format === "ONLINE"
        ? this.generateAppointmentButton(
            appointment,
            "Accéder à la consultation"
          )
        : `
        <div style="background-color: #f0fdf4; border: 1px solid #16a34a; border-radius: 8px; padding: 15px; margin: 20px 0;">
          <p style="margin: 0; color: #16a34a;">
            <strong>🏥 Consultation en personne</strong><br>
            <strong>Date:</strong> ${startTime}<br>
            <strong>Adresse:</strong> Cabinet Dr. Malika Lkhabir<br>
            123 Rue de la Santé, 75014 Paris
          </p>
        </div>
      `;

    return {
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <h2 style="color: #2563eb; margin-bottom: 20px;">Confirmation de votre rendez-vous</h2>
          <p>Bonjour ${appointment.client.firstName},</p>
          <p>Votre rendez-vous a été confirmé pour le <strong>${startTime}</strong>.</p>
          
          ${buttonHtml}
          
          <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb;">
            <p style="margin: 0;">Cordialement,<br><strong>Dr. Malika Lkhabir</strong></p>
            <p style="font-size: 12px; color: #6b7280; margin-top: 10px;">
              Psychologue clinicienne
            </p>
          </div>
        </div>
      `,
    };
  }

  private static generateRecurringSeriesConfirmationEmail(appointments: any[]) {
    const firstAppointment = appointments[0];
    const formatText =
      firstAppointment.format === "ONLINE" ? "en ligne" : "en présentiel";

    // Determine frequency based on recurringType
    let frequencyText = "réguliers";
    if (firstAppointment.recurringType) {
      switch (firstAppointment.recurringType) {
        case "WEEKLY":
          frequencyText = "hebdomadaires";
          break;
        case "BIWEEKLY":
          frequencyText = "bimensuels";
          break;
        case "MONTHLY":
          frequencyText = "mensuels";
          break;
      }
    }

    const appointmentsList = appointments
      .slice(0, 5)
      .map((apt) => {
        const date = format(
          new Date(apt.startTime),
          "EEEE dd MMMM yyyy 'à' HH:mm",
          { locale: fr }
        );
        return `<li style="margin-bottom: 8px;">${date}</li>`;
      })
      .join("");

    const hasMore = appointments.length > 5;

    return {
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <h2 style="color: #2563eb; margin-bottom: 20px;">Confirmation de votre série de rendez-vous</h2>
          <p>Bonjour ${firstAppointment.client.firstName},</p>
          <p>Votre série de <strong>${appointments.length} rendez-vous ${frequencyText} ${formatText}</strong> a été confirmée.</p>
          
          <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 15px; margin: 20px 0;">
            <h3 style="margin: 0 0 15px 0; color: #1e293b; font-size: 16px;">📅 Vos prochains rendez-vous:</h3>
            <ul style="margin: 0; padding-left: 20px; color: #475569;">
              ${appointmentsList}
              ${hasMore ? `<li style="margin-bottom: 8px; font-style: italic; color: #64748b;">... et ${appointments.length - 5} autres rendez-vous</li>` : ""}
            </ul>
          </div>

          ${
            firstAppointment.format === "ONLINE"
              ? `
            <div style="background-color: #f0f9ff; border: 1px solid #0284c7; border-radius: 8px; padding: 15px; margin: 20px 0;">
              <p style="margin: 0; color: #0284c7;">
                <strong>📹 Consultations en ligne</strong><br>
                Pour chaque séance, vous recevrez un email avec le lien de connexion 1 heure avant le rendez-vous.
              </p>
            </div>
          `
              : `
            <div style="background-color: #f0fdf4; border: 1px solid #16a34a; border-radius: 8px; padding: 15px; margin: 20px 0;">
              <p style="margin: 0; color: #16a34a;">
                <strong>🏥 Consultations en personne</strong><br>
                <strong>Adresse:</strong> Cabinet Dr. Malika Lkhabir<br>
                123 Rue de la Santé, 75014 Paris<br>
                Vous recevrez des rappels avant chaque rendez-vous.
              </p>
            </div>
          `
          }

          <div style="background-color: #fef9e7; border: 1px solid #f59e0b; border-radius: 8px; padding: 15px; margin: 20px 0;">
            <p style="margin: 0; color: #92400e;">
              <strong>ℹ️ Rappels automatiques</strong><br>
              Vérifiez vos emails régulièrement ! Vous recevrez un rappel 24 heures avant et 1 heure avant chaque rendez-vous individuel avec ${firstAppointment.format === "ONLINE" ? "le lien de connexion" : "les détails de votre consultation"}.
            </p>
          </div>
          
          <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb;">
            <p style="margin: 0;">Cordialement,<br><strong>Dr. Malika Lkhabir</strong></p>
            <p style="font-size: 12px; color: #6b7280; margin-top: 10px;">
              Psychologue clinicienne
            </p>
          </div>
        </div>
      `,
    };
  }

  private static generate24HourReminderEmail(appointment: any) {
    const startTime = format(
      new Date(appointment.startTime),
      "EEEE dd MMMM yyyy 'à' HH:mm",
      { locale: fr }
    );

    const buttonOrInfoHtml =
      appointment.format === "ONLINE"
        ? `
        <div style="background-color: #fef3c7; border: 1px solid #f59e0b; border-radius: 8px; padding: 15px; margin: 20px 0;">
          <p style="margin: 0; color: #92400e;">
            <strong>📹 Consultation en ligne</strong><br>
            Vous recevrez le lien de connexion 1 heure avant le rendez-vous.
          </p>
        </div>
      `
        : `
        <div style="background-color: #f0fdf4; border: 1px solid #16a34a; border-radius: 8px; padding: 15px; margin: 20px 0;">
          <p style="margin: 0; color: #16a34a;">
            <strong>🏥 Consultation en personne</strong><br>
            <strong>Date:</strong> ${startTime}<br>
            <strong>Adresse:</strong> Cabinet Dr. Malika Lkhabir<br>
            123 Rue de la Santé, 75014 Paris
          </p>
        </div>
      `;

    return {
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <h2 style="color: #dc2626; margin-bottom: 20px;">⏰ Rappel: Rendez-vous demain</h2>
          <p>Bonjour ${appointment.client.firstName},</p>
          <p>Nous vous rappelons votre rendez-vous prévu demain le <strong>${startTime}</strong>.</p>
          
          ${buttonOrInfoHtml}
          
          <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb;">
            <p style="margin: 0;">Cordialement,<br><strong>Dr. Malika Lkhabir</strong></p>
            <p style="font-size: 12px; color: #6b7280; margin-top: 10px;">
              Psychologue clinicienne
            </p>
          </div>
        </div>
      `,
    };
  }

  private static generate1HourReminderEmail(appointment: any) {
    const startTime = format(new Date(appointment.startTime), "HH:mm", {
      locale: fr,
    });
    const fullDateTime = format(
      new Date(appointment.startTime),
      "EEEE dd MMMM yyyy 'à' HH:mm",
      { locale: fr }
    );

    const buttonOrInfoHtml =
      appointment.format === "ONLINE"
        ? this.generateAppointmentButton(
            appointment,
            "Rejoindre la consultation"
          )
        : `
        <div style="background-color: #f0fdf4; border: 1px solid #16a34a; border-radius: 8px; padding: 15px; margin: 20px 0;">
          <p style="margin: 0; color: #16a34a;">
            <strong>🏥 Consultation en personne</strong><br>
            <strong>Date:</strong> ${fullDateTime}<br>
            <strong>Adresse:</strong> Cabinet Dr. Malika Lkhabir<br>
            123 Rue de la Santé, 75014 Paris
          </p>
        </div>
      `;

    return {
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <h2 style="color: #dc2626; margin-bottom: 20px;">🚨 Rappel: Rendez-vous dans 1 heure</h2>
          <p>Bonjour ${appointment.client.firstName},</p>
          <p>Votre rendez-vous commence dans <strong>1 heure à ${startTime}</strong>.</p>
          
          ${buttonOrInfoHtml}
          
          <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb;">
            <p style="margin: 0;">Cordialement,<br><strong>Dr. Malika Lkhabir</strong></p>
            <p style="font-size: 12px; color: #6b7280; margin-top: 10px;">
              Psychologue clinicienne
            </p>
          </div>
        </div>
      `,
    };
  }
}
