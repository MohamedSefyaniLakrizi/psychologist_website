import { Resend } from "resend";
import {
  ConfirmationEmailTemplate,
  RecurringSeriesConfirmationEmailTemplate,
  TwentyFourHourReminderEmailTemplate,
  OneHourReminderEmailTemplate,
  RescheduleNotificationEmailTemplate,
  CancellationEmailTemplate,
  InvoiceEmailTemplate,
  EMAIL_CONFIG,
  getEmailFromInfo,
  type Appointment,
  type EmailTemplate,
} from "./email-templates";
import { getTenant, getTenantById } from "@/lib/actions/tenant";

/**
 * Helper function to generate invoice HTML for email
 */
function generateInvoiceHtml(invoice: any): string {
  const total = Number(invoice.amount);
  const totalHT = +(total / 1.2).toFixed(2);
  const totalTVA = +(total - totalHT).toFixed(2);

  return `
    <table style="width: 100%; border-collapse: collapse; margin: 0;">
      <tr style="background-color: #f3f4f6; border: 1px solid #e5e7eb;">
        <td style="padding: 12px; border: 1px solid #e5e7eb; font-weight: bold;">Consultation/Prestation</td>
        <td style="padding: 12px; border: 1px solid #e5e7eb; text-align: right; font-weight: bold;">Montant TTC</td>
      </tr>
      <tr style="border: 1px solid #e5e7eb;">
        <td style="padding: 12px; border: 1px solid #e5e7eb;">Séance de consultation</td>
        <td style="padding: 12px; border: 1px solid #e5e7eb; text-align: right;">${total.toFixed(2)} Dh</td>
      </tr>
      <tr style="background-color: #f9fafb; border: 1px solid #e5e7eb;">
        <td style="padding: 12px; border: 1px solid #e5e7eb; font-weight: bold; text-align: right;">Total HT:</td>
        <td style="padding: 12px; border: 1px solid #e5e7eb; text-align: right;">${totalHT.toFixed(2)} Dh</td>
      </tr>
      <tr style="background-color: #f9fafb; border: 1px solid #e5e7eb;">
        <td style="padding: 12px; border: 1px solid #e5e7eb; font-weight: bold; text-align: right;">TVA (20%):</td>
        <td style="padding: 12px; border: 1px solid #e5e7eb; text-align: right;">${totalTVA.toFixed(2)} Dh</td>
      </tr>
      <tr style="background-color: #f0f9ff; border: 1px solid #bfdbfe;">
        <td style="padding: 12px; border: 1px solid #bfdbfe; font-weight: bold; text-align: right; color: #1e40af;">Total TTC:</td>
        <td style="padding: 12px; border: 1px solid #bfdbfe; text-align: right; font-weight: bold; color: #1e40af; font-size: 16px;">${total.toFixed(2)} Dh</td>
      </tr>
    </table>
  `;
}

const resend = new Resend(process.env.RESEND_API_KEY!);

export class EmailService {
  static async sendConfirmationEmail(appointment: any) {
    try {
      const tenant = await getTenant();
      const template = await ConfirmationEmailTemplate.generate(appointment);

      return await resend.emails.send({
        from: getEmailFromInfo(tenant),
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

      const tenant = await getTenant();
      const firstAppointment = appointments[0];
      const template =
        await RecurringSeriesConfirmationEmailTemplate.generate(appointments);

      console.log(
        "📧 Sending recurring series confirmation email to:",
        firstAppointment.client.email
      );
      return await resend.emails.send({
        from: getEmailFromInfo(tenant),
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

  static async sendRescheduleEmail(appointment: any, oldStartTime: Date) {
    try {
      const tenant = await getTenant();
      const template = await RescheduleNotificationEmailTemplate.generate(
        appointment,
        oldStartTime
      );
      console.log("📧 Sending reschedule email to:", appointment.client.email);
      return await resend.emails.send({
        from: getEmailFromInfo(tenant),
        to: appointment.client.email,
        subject: template.subject,
        html: template.html,
      });
    } catch (error) {
      console.error("Error sending reschedule email:", error);
      throw error;
    }
  }

  static async sendCancellationEmail(appointment: any) {
    try {
      const tenant = await getTenant();
      const template = await CancellationEmailTemplate.generate(appointment);
      console.log(
        "📧 Sending cancellation email to:",
        appointment.client.email
      );
      return await resend.emails.send({
        from: getEmailFromInfo(tenant),
        to: appointment.client.email,
        subject: template.subject,
        html: template.html,
      });
    } catch (error) {
      console.error("Error sending cancellation email:", error);
      throw error;
    }
  }

  static async sendInvoiceEmail(invoice: any, clientEmail: string) {
    try {
      const tenant = await getTenant();
      const invoiceHtml = generateInvoiceHtml(invoice);

      // Create appointment-like object for template
      const appointmentData = {
        id: invoice.appointmentId || invoice.id,
        startTime: invoice.appointment?.startTime || new Date(),
        endTime: invoice.appointment?.endTime || new Date(),
        format: invoice.appointment?.format || "FACE_TO_FACE",
        client: {
          firstName: invoice.client.firstName,
          lastName: invoice.client.lastName,
          email: clientEmail,
        },
      };

      const template = await InvoiceEmailTemplate.generate(
        appointmentData,
        invoiceHtml
      );

      console.log("📧 Sending invoice email to:", clientEmail);
      return await resend.emails.send({
        from: getEmailFromInfo(tenant),
        to: clientEmail,
        subject: template.subject,
        html: template.html,
      });
    } catch (error) {
      console.error("Error sending invoice email:", error);
      throw error;
    }
  }

  static async sendScheduledEmail(emailSchedule: any, tenantId?: string) {
    // Get tenant info - either from provided tenantId (cron job) or session
    const tenant = tenantId ? await getTenantById(tenantId) : await getTenant();

    const { appointment } = emailSchedule;

    let template: EmailTemplate;

    switch (emailSchedule.emailType) {
      case "REMINDER_24H":
        template = await TwentyFourHourReminderEmailTemplate.generate(
          appointment,
          tenant
        );
        break;
      case "REMINDER_1H":
        template = await OneHourReminderEmailTemplate.generate(
          appointment,
          tenant
        );
        break;
      case "INVOICE_DELIVERY":
        if (!appointment.invoice) {
          throw new Error(`No invoice found for appointment ${appointment.id}`);
        }
        const invoiceHtml = generateInvoiceHtml(appointment.invoice);
        template = await InvoiceEmailTemplate.generate(
          appointment,
          invoiceHtml,
          tenant
        );
        break;
      default:
        throw new Error(`Unknown email type: ${emailSchedule.emailType}`);
    }

    return await resend.emails.send({
      from: getEmailFromInfo(tenant),
      to: emailSchedule.recipientEmail,
      subject: template.subject,
      html: template.html,
    });
  }
}
