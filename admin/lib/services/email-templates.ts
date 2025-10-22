/**
 * Centralized Email Templates
 * All email templates are defined here for easy editing and maintenance
 */

import { format } from "date-fns";
import { fr } from "date-fns/locale";

export interface EmailTemplate {
  html: string;
  subject: string;
}

export interface Appointment {
  id: string;
  startTime: Date;
  endTime: Date;
  format: "ONLINE" | "FACE_TO_FACE";
  clientJwt?: string;
  client: {
    firstName: string;
    lastName: string;
    email: string;
  };
  recurringType?: "WEEKLY" | "BIWEEKLY" | "MONTHLY";
}

/**
 * Helper function to get French text for recurring type
 */
const getFrequencyText = (
  recurringType?: "WEEKLY" | "BIWEEKLY" | "MONTHLY"
): string => {
  switch (recurringType) {
    case "WEEKLY":
      return "hebdomadaire";
    case "BIWEEKLY":
      return "bimensuel";
    case "MONTHLY":
      return "mensuel";
    default:
      return "";
  }
};

/**
 * Configuration constants that can be easily customized
 */
export const EMAIL_CONFIG = {
  FROM_EMAIL: "Malika Lkhabir <onboarding@resend.dev>",
  DOCTOR_NAME: "Malika Lkhabir",
  DOCTOR_TITLE: "Psychologue clinicienne",
  OFFICE_NAME: "Cabinet Malika Lkhabir",
  OFFICE_ADDRESS: "123 Rue de la Santé, 75014 Casablanca",
  WEBSITE_URL: process.env.WEBSITE_URL,
  COLORS: {
    PRIMARY_BLUE: "#2563eb",
    PRIMARY_GREEN: "#16a34a",
    ERROR_RED: "#dc2626",
    WARNING_ORANGE: "#f59e0b",
    INFO_YELLOW: "#fef9e7",
    BORDER_LIGHT: "#e5e7eb",
  },
};

/**
 * Helper function to format appointment date and time
 */
const formatAppointmentDate = (
  date: Date,
  format_string: string = "EEEE dd MMMM yyyy 'à' HH:mm"
) => {
  return format(new Date(date), format_string, { locale: fr });
};

/**
 * Helper function to generate appointment link based on format
 * Only generates a link for ONLINE appointments
 */
const generateAppointmentLink = (appointment: Appointment): string => {
  // Only generate a link for ONLINE appointments
  if (appointment.format !== "ONLINE" || !appointment.clientJwt) {
    return "";
  }

  return `${EMAIL_CONFIG.WEBSITE_URL}/meeting?jwt=${encodeURIComponent(appointment.clientJwt)}&user=${encodeURIComponent(appointment.client.firstName + " " + appointment.client.lastName)}&appointmentId=${encodeURIComponent(appointment.id)}&title=${encodeURIComponent("Consultation")}&room=${encodeURIComponent("Rendez Vous")}`;
};

/**
 * Helper function to generate appointment button HTML
 * Only generates a button for ONLINE appointments - returns empty string for FACE_TO_FACE
 */
const generateAppointmentButton = (
  appointment: Appointment,
  buttonText: string
): string => {
  // Only generate a button for ONLINE appointments
  if (appointment.format !== "ONLINE") {
    return "";
  }

  const link = generateAppointmentLink(appointment);

  return `
    <div style="text-align: center; margin: 20px 0;">
      <a href="${link}" style="background-color: ${EMAIL_CONFIG.COLORS.PRIMARY_BLUE}; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block;">
        ${buttonText}
      </a>
    </div>
  `;
};

/**
 * Email footer that appears in all emails
 */
const generateEmailFooter = (): string => {
  return `
    <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid ${EMAIL_CONFIG.COLORS.BORDER_LIGHT};">
      <p style="margin: 0;">Cordialement,<br><strong>${EMAIL_CONFIG.DOCTOR_NAME}</strong></p>
      <p style="font-size: 12px; color: #6b7280; margin-top: 10px;">
        ${EMAIL_CONFIG.DOCTOR_TITLE}
      </p>
    </div>
  `;
};

// ============================================================================
// EMAIL TEMPLATES
// ============================================================================

/**
 * Confirmation Email - Sent when a single appointment is booked
 */
export const ConfirmationEmailTemplate = {
  generate(appointment: Appointment): EmailTemplate {
    const startTime = formatAppointmentDate(appointment.startTime);
    const subjectDate = format(
      new Date(appointment.startTime),
      "dd/MM/yyyy HH:mm",
      {
        locale: fr,
      }
    );
    const meetingLink =
      appointment.format === "ONLINE"
        ? generateAppointmentButton(appointment, "Rejoindre la consultation")
        : "";

    return {
      subject: `Confirmation de votre rendez-vous - ${subjectDate}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <h2 style="color: ${EMAIL_CONFIG.COLORS.PRIMARY_BLUE}; margin-bottom: 20px;">Confirmation de votre rendez-vous</h2>
          <p>Bonjour ${appointment.client.firstName},</p>
          <p>Votre rendez-vous a été confirmé pour le <strong>${startTime}</strong>.</p>
          
          ${meetingLink}
          
          <div style="min-height: 100px;"></div>
          
          ${generateEmailFooter()}
        </div>
      `,
    };
  },
};

/**
 * Recurring Series Confirmation Email - Sent when multiple recurring appointments are booked
 */
export const RecurringSeriesConfirmationEmailTemplate = {
  generate(appointments: Appointment[]): EmailTemplate {
    const firstAppointment = appointments[0];
    const formatText =
      firstAppointment.format === "ONLINE" ? "en ligne" : "en présentiel";

    // Get frequency text
    const frequencyText = getFrequencyText(firstAppointment.recurringType);

    // Get day of week in French
    const dayOfWeek = format(new Date(firstAppointment.startTime), "EEEE", {
      locale: fr,
    });
    const time = format(new Date(firstAppointment.startTime), "HH:mm", {
      locale: fr,
    });
    const subjectDate = format(
      new Date(firstAppointment.startTime),
      "dd/MM/yyyy HH:mm",
      { locale: fr }
    );

    // Build frequency description
    let frequencyDescription = "";
    switch (firstAppointment.recurringType) {
      case "WEEKLY":
        frequencyDescription = `chaque semaine le ${dayOfWeek} à ${time}`;
        break;
      case "BIWEEKLY":
        frequencyDescription = `toutes les deux semaines le ${dayOfWeek} à ${time}`;
        break;
      case "MONTHLY":
        frequencyDescription = `1 fois par mois le ${dayOfWeek} à ${time}`;
        break;
      default:
        frequencyDescription = `régulièrement le ${dayOfWeek} à ${time}`;
    }

    // Generate meeting button only for ONLINE appointments
    const meetingButton =
      firstAppointment.format === "ONLINE"
        ? generateAppointmentButton(
            firstAppointment,
            "Rejoindre la consultation"
          )
        : "";

    return {
      subject: `Confirmation de Rendez-vous ${frequencyText} - ${subjectDate}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <h2 style="color: ${EMAIL_CONFIG.COLORS.PRIMARY_BLUE}; margin-bottom: 20px;">Confirmation de votre série de rendez-vous</h2>
          <p>Bonjour ${firstAppointment.client.firstName},</p>
          <p>Votre rendez-vous <strong>${frequencyDescription}</strong> ${formatText} a été confirmé pour une durée de ${appointments.length} séances.</p>

          ${meetingButton}

          <p style="margin-top: 20px; color: #475569;">Vous recevrez des rappels par email 24 heures avant et 1 heure avant chaque rendez-vous${firstAppointment.format === "ONLINE" ? " avec le lien de connexion" : ""}.</p>
          
          <div style="min-height: 100px;"></div>
          
          ${generateEmailFooter()}
        </div>
      `,
    };
  },
};

/**
 * 24-Hour Reminder Email - Sent 24 hours before an appointment
 */
export const TwentyFourHourReminderEmailTemplate = {
  generate(appointment: Appointment): EmailTemplate {
    const startTime = formatAppointmentDate(appointment.startTime);
    const subjectDate = format(
      new Date(appointment.startTime),
      "dd/MM/yyyy HH:mm",
      {
        locale: fr,
      }
    );

    return {
      subject: `Rappel: Rendez-vous demain - ${subjectDate}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <h2 style="color: ${EMAIL_CONFIG.COLORS.ERROR_RED}; margin-bottom: 20px;">Rappel: Rendez-vous demain</h2>
          <p>Bonjour ${appointment.client.firstName},</p>
          <p>Nous vous rappelons votre rendez-vous prévu demain le <strong>${startTime}</strong>.</p>
          
          
          ${generateEmailFooter()}
        </div>
      `,
    };
  },
};

/**
 * 1-Hour Reminder Email - Sent 1 hour before an appointment
 */
export const OneHourReminderEmailTemplate = {
  generate(appointment: Appointment): EmailTemplate {
    const startTime = format(new Date(appointment.startTime), "HH:mm", {
      locale: fr,
    });
    const fullDateTime = formatAppointmentDate(appointment.startTime);
    const subjectDate = format(
      new Date(appointment.startTime),
      "dd/MM/yyyy HH:mm",
      {
        locale: fr,
      }
    );

    let appointmentContent: string;
    if (appointment.format === "ONLINE") {
      appointmentContent = generateAppointmentButton(
        appointment,
        "Rejoindre la consultation"
      );
    } else {
      appointmentContent = `
        <div style="background-color: #f0fdf4; border: 1px solid #16a34a; border-radius: 8px; padding: 15px; margin: 20px 0;">
          <p style="margin: 0; color: #16a34a;">
            <strong>Consultation en personne</strong><br>
            <strong>Date:</strong> ${fullDateTime}<br>
            <strong>Adresse:</strong> ${EMAIL_CONFIG.OFFICE_NAME}<br>
            ${EMAIL_CONFIG.OFFICE_ADDRESS}
          </p>
        </div>
      `;
    }

    return {
      subject: `Rappel: Rendez-vous dans 1 heure - ${subjectDate}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <h2 style="color: ${EMAIL_CONFIG.COLORS.ERROR_RED}; margin-bottom: 20px;">🚨 Rappel: Rendez-vous dans 1 heure</h2>
          <p>Bonjour ${appointment.client.firstName},</p>
          <p>Votre rendez-vous commence dans <strong>1 heure à ${startTime}</strong>.</p>
          
          ${appointmentContent}
          
          <div style="min-height: 100px;"></div>
          
          ${generateEmailFooter()}
        </div>
      `,
    };
  },
};

/**
 * Invoice Email - Sent after an appointment to deliver invoice
 */
export const InvoiceEmailTemplate = {
  generate(appointment: Appointment, invoiceHtml: string): EmailTemplate {
    const appointmentDate = formatAppointmentDate(
      appointment.startTime,
      "dd MMMM yyyy"
    );

    return {
      subject: `${appointment.client.firstName} ${appointment.client.lastName} - Facture de la séance du ${appointmentDate}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <h2 style="color: ${EMAIL_CONFIG.COLORS.PRIMARY_BLUE}; margin-bottom: 20px;">Facture de votre consultation</h2>
          <p>Bonjour ${appointment.client.firstName},</p>
          <p>Veuillez trouver ci-joint la facture de votre consultation du <strong>${appointmentDate}</strong>.</p>
          
          <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 20px; margin: 20px 0;">
            ${invoiceHtml}
          </div>

          <div style="background-color: #fef3c7; border: 1px solid ${EMAIL_CONFIG.COLORS.WARNING_ORANGE}; border-radius: 8px; padding: 15px; margin: 20px 0;">
            <p style="margin: 0; color: #92400e;">
              <strong>💳 Paiement</strong><br>
              Merci de régler cette facture dans les 30 jours.
            </p>
          </div>
          
          ${generateEmailFooter()}
        </div>
      `,
    };
  },
};

/**
 * Appointment Reschedule Notification Email
 */
export const RescheduleNotificationEmailTemplate = {
  generate(appointment: Appointment, oldStartTime: Date): EmailTemplate {
    const newTime = formatAppointmentDate(appointment.startTime);
    const oldTime = formatAppointmentDate(oldStartTime);
    const subjectDate = format(
      new Date(appointment.startTime),
      "dd/MM/yyyy HH:mm",
      {
        locale: fr,
      }
    );

    // Generate meeting link/button only for ONLINE appointments
    const meetingLinkSection =
      appointment.format === "ONLINE"
        ? generateAppointmentButton(
            appointment,
            "Rejoindre la nouvelle consultation"
          )
        : "";

    return {
      subject: `Modification de votre rendez-vous - ${subjectDate}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <h2 style="color: ${EMAIL_CONFIG.COLORS.PRIMARY_BLUE}; margin-bottom: 20px;">Modification de votre rendez-vous</h2>
          <p>Bonjour ${appointment.client.firstName},</p>
          <p>Votre rendez-vous a été modifié.</p>

          <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 15px; margin: 20px 0;">
            <p style="margin: 0;">
              <strong>Ancien créneau:</strong> ${oldTime}<br>
              <strong>Nouveau créneau:</strong> ${newTime}
            </p>
          </div>

          ${meetingLinkSection}

          ${generateEmailFooter()}
        </div>
      `,
    };
  },
};

/**
 * Appointment Cancellation Email
 */
export const CancellationEmailTemplate = {
  generate(appointment: Appointment): EmailTemplate {
    const cancelledTime = formatAppointmentDate(appointment.startTime);
    const subjectDate = format(
      new Date(appointment.startTime),
      "dd/MM/yyyy HH:mm",
      {
        locale: fr,
      }
    );

    return {
      subject: `Annulation de votre rendez-vous - ${subjectDate}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <h2 style="color: ${EMAIL_CONFIG.COLORS.ERROR_RED}; margin-bottom: 20px;">Annulation de votre rendez-vous</h2>
          <p>Bonjour ${appointment.client.firstName},</p>
          <p>Votre rendez-vous prévu le <strong>${cancelledTime}</strong> a été annulé.</p>
          
          <div style="background-color: #fef2f2; border: 1px solid #fecaca; border-radius: 8px; padding: 15px; margin: 20px 0;">
            <p style="margin: 0; color: #991b1b;">
              <strong>ℹ️ Information</strong><br>
              Si vous avez des questions, n'hésitez pas à nous contacter.
            </p>
          </div>
          
          ${generateEmailFooter()}
        </div>
      `,
    };
  },
};

/**
 * Generic Notification Email Template
 */
export const GenericNotificationEmailTemplate = {
  generate(clientName: string, title: string, message: string): EmailTemplate {
    return {
      subject: title,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <h2 style="color: ${EMAIL_CONFIG.COLORS.PRIMARY_BLUE}; margin-bottom: 20px;">${title}</h2>
          <p>Bonjour ${clientName},</p>
          <p>${message}</p>
          
          ${generateEmailFooter()}
        </div>
      `,
    };
  },
};
