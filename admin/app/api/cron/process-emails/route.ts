import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { EmailService } from "@/lib/services/email-service";
import { EmailStatus } from "@prisma/client";

export async function POST(request: NextRequest) {
  return processEmails(request);
}

export async function GET(request: NextRequest) {
  return processEmails(request);
}

async function processEmails(request: NextRequest) {
  try {
    // Verify cron secret (for security)
    const authHeader = request.headers.get("authorization");
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const now = new Date();
    // Get emails that should be sent now (with 5-minute buffer)
    const emailsToSend = await (prisma.emailSchedule as any).findMany({
      where: {
        status: EmailStatus.PENDING,
        scheduledFor: {
          lte: new Date(now.getTime() + 5 * 60 * 1000),
        },
      },
      include: {
        appointment: {
          include: {
            client: true,
          },
        },
      },
      take: 50, // Process in batches
    });

    console.log(`📧 Found ${emailsToSend.length} emails to send`);

    const results = [];

    for (const emailSchedule of emailsToSend) {
      try {
        console.log(
          `📤 Sending ${emailSchedule.emailType} email to ${emailSchedule.recipientEmail}`
        );

        await EmailService.sendScheduledEmail(emailSchedule);

        // Mark as sent
        await prisma.emailSchedule.update({
          where: { id: emailSchedule.id },
          data: {
            status: EmailStatus.SENT,
            sentAt: new Date(),
          },
        });

        console.log(
          `✅ Successfully sent ${emailSchedule.emailType} email for appointment ${emailSchedule.appointmentId}`
        );
        results.push({
          id: emailSchedule.id,
          status: "sent",
          type: emailSchedule.emailType,
        });
      } catch (error) {
        console.error(`❌ Failed to send email ${emailSchedule.id}:`, error);

        // Mark as failed
        await prisma.emailSchedule.update({
          where: { id: emailSchedule.id },
          data: {
            status: EmailStatus.FAILED,
            errorMessage:
              error instanceof Error ? error.message : "Unknown error",
          },
        });

        results.push({
          id: emailSchedule.id,
          status: "failed",
          type: emailSchedule.emailType,
          error: error instanceof Error ? error.message : "Unknown error",
        });
      }
    }

    console.log(
      `🏁 Email processing completed. Processed ${results.length} emails`
    );

    return NextResponse.json({
      processed: results.length,
      results,
      timestamp: now.toISOString(),
    });
  } catch (error) {
    console.error("❌ Error processing emails:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
