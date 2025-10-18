import { prisma } from "@/lib/prisma";
import { subHours, addHours } from "date-fns";
import { EmailType, EmailStatus } from "@prisma/client";

export class EmailScheduler {
  static async scheduleAppointmentEmails(
    appointmentId: string,
    clientEmail: string,
    clientName: string,
    startTime: Date,
    endTime: Date,
    sendInvoiceAutomatically: boolean = true,
    includeAllReminders = true // true for single appointments, controlled for recurring
  ) {
    const emailsToSchedule = [];

    // 1. 24h reminder
    if (includeAllReminders) {
      const reminder24h = subHours(startTime, 24);
      if (reminder24h > new Date()) {
        emailsToSchedule.push({
          appointmentId,
          emailType: EmailType.REMINDER_24H,
          scheduledFor: reminder24h,
          recipientEmail: clientEmail,
          recipientName: clientName,
          subject: "Rappel: Rendez-vous demain",
        });
      }
    }

    // 2. 1h reminder (always scheduled for both single and recurring)
    const reminder1h = subHours(startTime, 1);
    if (reminder1h > new Date()) {
      emailsToSchedule.push({
        appointmentId,
        emailType: EmailType.REMINDER_1H,
        scheduledFor: reminder1h,
        recipientEmail: clientEmail,
        recipientName: clientName,
        subject: "Rappel: Rendez-vous dans 1 heure",
      });
    }

    // 3. Invoice delivery (1 hour after session ends)
    if (sendInvoiceAutomatically) {
      const invoiceDelivery = addHours(endTime, 1);
      if (invoiceDelivery > new Date()) {
        emailsToSchedule.push({
          appointmentId,
          emailType: EmailType.INVOICE_DELIVERY,
          scheduledFor: invoiceDelivery,
          recipientEmail: clientEmail,
          recipientName: clientName,
          subject: `${clientName} - Facture de la séance du ${startTime.toLocaleDateString("fr-FR")}`,
        });
      }
    }

    // Insert all scheduled emails
    if (emailsToSchedule.length > 0) {
      await prisma.emailSchedule.createMany({
        data: emailsToSchedule,
      });

      console.log(
        `📧 Scheduled ${emailsToSchedule.length} emails for appointment ${appointmentId} (${sendInvoiceAutomatically ? "with" : "without"} invoice delivery)`
      );
    }

    return emailsToSchedule;
  }

  static async cancelAppointmentEmails(appointmentId: string) {
    const result = await prisma.emailSchedule.updateMany({
      where: {
        appointmentId,
        status: EmailStatus.PENDING,
      },
      data: {
        status: EmailStatus.CANCELLED,
      },
    });

    console.log(
      `📧 Cancelled ${result.count} scheduled emails for appointment ${appointmentId}`
    );
    return result;
  }

  static async rescheduleAppointmentEmails(
    appointmentId: string,
    newStartTime: Date,
    newEndTime: Date,
    clientEmail: string,
    clientName: string,
    sendInvoiceAutomatically: boolean = true
  ) {
    // Cancel existing emails
    await this.cancelAppointmentEmails(appointmentId);

    // Schedule new ones (include all reminders for rescheduled appointments)
    await this.scheduleAppointmentEmails(
      appointmentId,
      clientEmail,
      clientName,
      newStartTime,
      newEndTime,
      sendInvoiceAutomatically,
      true
    );

    console.log(`📧 Rescheduled emails for appointment ${appointmentId}`);
  }

  static async cancelSeriesAppointmentEmails(appointmentIds: string[]) {
    const result = await prisma.emailSchedule.updateMany({
      where: {
        appointmentId: {
          in: appointmentIds,
        },
        status: EmailStatus.PENDING,
      },
      data: {
        status: EmailStatus.CANCELLED,
      },
    });

    console.log(
      `📧 Cancelled ${result.count} scheduled emails for ${appointmentIds.length} appointments in series`
    );
    return result;
  }
}
