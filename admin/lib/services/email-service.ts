import { Resend } from "resend";
import {
  ConfirmationEmailTemplate,
  RecurringSeriesConfirmationEmailTemplate,
  TwentyFourHourReminderEmailTemplate,
  OneHourReminderEmailTemplate,
  EMAIL_CONFIG,
  type Appointment,
  type EmailTemplate,
} from "./email-templates";

const resend = new Resend(process.env.RESEND_API_KEY);

export class EmailService {
  static async sendConfirmationEmail(appointment: any) {
    try {
      const template = ConfirmationEmailTemplate.generate(appointment);

      return await resend.emails.send({
        from: EMAIL_CONFIG.FROM_EMAIL,
        to: appointment.client.email,
        subject: template.subject,
        html: template.html,
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
      const template =
        RecurringSeriesConfirmationEmailTemplate.generate(appointments);

      console.log(
        "📧 Sending recurring series confirmation email to:",
        firstAppointment.client.email
      );
      return await resend.emails.send({
        from: EMAIL_CONFIG.FROM_EMAIL,
        to: firstAppointment.client.email,
        subject: template.subject,
        html: template.html,
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

    let template: EmailTemplate;

    switch (emailSchedule.emailType) {
      case "REMINDER_24H":
        template = TwentyFourHourReminderEmailTemplate.generate(appointment);
        break;
      case "REMINDER_1H":
        template = OneHourReminderEmailTemplate.generate(appointment);
        break;
      default:
        throw new Error(`Unknown email type: ${emailSchedule.emailType}`);
    }

    return await resend.emails.send({
      from: EMAIL_CONFIG.FROM_EMAIL,
      to: emailSchedule.recipientEmail,
      subject: template.subject,
      html: template.html,
    });
  }
}
