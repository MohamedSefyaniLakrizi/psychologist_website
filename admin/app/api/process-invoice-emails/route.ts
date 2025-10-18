import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function POST() {
  try {
    // Get all pending INVOICE_DELIVERY emails that are scheduled for now or earlier
    const pendingEmails = await (prisma.emailSchedule as any).findMany({
      where: {
        emailType: "INVOICE_DELIVERY",
        status: "PENDING",
        scheduledFor: {
          lte: new Date(),
        },
      },
      include: {
        appointment: {
          include: {
            client: true,
            invoice: true,
          },
        },
      },
    });

    console.log(
      `📧 Found ${pendingEmails.length} pending invoice delivery emails`
    );

    let processedCount = 0;
    let successCount = 0;
    let errorCount = 0;

    for (const emailSchedule of pendingEmails) {
      processedCount++;

      try {
        // Mark as processing to prevent duplicate sends
        await prisma.emailSchedule.update({
          where: { id: emailSchedule.id },
          data: { status: "SENT" }, // Mark as sent first to prevent duplicates
        });

        // Send the automated invoice email
        const response = await fetch(
          `${process.env.WEBSITE_URL}/api/send-automated-invoice-email`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              appointmentId: emailSchedule.appointmentId,
            }),
          }
        );

        if (response.ok) {
          console.log(
            `✅ Successfully sent invoice email for appointment ${emailSchedule.appointmentId}`
          );

          // Update email schedule with sent timestamp
          await prisma.emailSchedule.update({
            where: { id: emailSchedule.id },
            data: {
              status: "SENT",
              sentAt: new Date(),
            },
          });

          successCount++;
        } else {
          const errorData = await response.json();
          console.error(
            `❌ Failed to send invoice email for appointment ${emailSchedule.appointmentId}:`,
            errorData.error
          );

          // Mark as failed
          await prisma.emailSchedule.update({
            where: { id: emailSchedule.id },
            data: {
              status: "FAILED",
              errorMessage: errorData.error || "Unknown error",
            },
          });

          errorCount++;
        }
      } catch (error) {
        console.error(
          `❌ Error processing email schedule ${emailSchedule.id}:`,
          error
        );

        // Mark as failed
        try {
          await prisma.emailSchedule.update({
            where: { id: emailSchedule.id },
            data: {
              status: "FAILED",
              errorMessage: (error as Error).message || "Unknown error",
            },
          });
        } catch (updateError) {
          console.error(
            `❌ Failed to update email schedule status:`,
            updateError
          );
        }

        errorCount++;
      }
    }

    console.log(
      `📧 Processed ${processedCount} invoice delivery emails: ${successCount} successful, ${errorCount} failed`
    );

    return NextResponse.json(
      {
        message: "Invoice delivery emails processed",
        processed: processedCount,
        successful: successCount,
        failed: errorCount,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error processing invoice delivery emails:", error);
    return NextResponse.json(
      { error: "Erreur interne du serveur" },
      { status: 500 }
    );
  }
}
