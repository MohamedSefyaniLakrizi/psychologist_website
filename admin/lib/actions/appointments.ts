"use server";

import { prisma } from "@/lib/prisma";
import type { IEvent, IUser } from "@/app/components/calendar/interfaces";
import { addDays, format } from "date-fns";
import { fr } from "date-fns/locale";
import { randomUUID } from "crypto";
import { generateJitsiTokensForAppointment } from "@/lib/jitsi";
import { EmailService } from "@/lib/services/email-service";
import { EmailScheduler } from "@/lib/services/email-scheduler";

// Helper function to format appointment description in French
function formatAppointmentDescription(
  format: "ONLINE" | "FACE_TO_FACE"
): string {
  const formatText =
    format === "ONLINE" ? "Séance en ligne" : "Séance en présentiel";
  return formatText;
}

export async function getAppointments(): Promise<IEvent[]> {
  try {
    const appointments: any[] = await (prisma as any).appointment.findMany({
      where: {
        confirmed: true,
      },
      include: {
        client: true,
        notes: true,
      },
      orderBy: {
        startTime: "asc",
      },
    });

    return appointments.map((appointment: any) => ({
      id: appointment.id,
      title: `${appointment.client.firstName} ${appointment.client.lastName}`,
      startDate: appointment.startTime,
      endDate: appointment.endTime,
      description: formatAppointmentDescription(appointment.format),
      user: {
        id: appointment.client.id,
        name: `${appointment.client.firstName} ${appointment.client.lastName}`,
        email: appointment.client.email,
        phoneNumber: appointment.client.phoneNumber,
        preferredContact: appointment.client.preferredContact,
      },
      clientId: appointment.clientId,
      rate: Number(appointment.rate),
      paid: !!appointment.paid,
      format: appointment.format,
      status: appointment.status,
      isCompleted: appointment.isCompleted,
      isRecurring: appointment.isRecurring,
      recurringType: appointment.recurringType,
      recurrentId: appointment.recurrentId,
      // Include Jitsi fields
      hostJwt: appointment.hostJwt,
      clientJwt: appointment.clientJwt,
      hostAttended: appointment.hostAttended,
      clientAttended: appointment.clientAttended,
      notes: appointment.notes,
      createdAt: appointment.createdAt,
      updatedAt: appointment.updatedAt,
    }));
  } catch (error) {
    console.error("Error fetching appointments:", error);
    throw new Error("Failed to fetch appointments");
  }
}

export async function updateAppointmentStatus(
  id: string,
  status: "NOT_YET_ATTENDED" | "ATTENDED" | "ABSENT" | "CANCELLED"
): Promise<IEvent> {
  try {
    const appointment: any = await (prisma as any).appointment.update({
      where: { id },
      data: { status },
      include: {
        client: true,
        notes: true,
      },
    });

    return {
      id: appointment.id,
      title: `${appointment.client.firstName} ${appointment.client.lastName}`,
      startDate: appointment.startTime,
      endDate: appointment.endTime,
      description: formatAppointmentDescription(appointment.format),
      user: {
        id: appointment.client.id,
        name: `${appointment.client.firstName} ${appointment.client.lastName}`,
        email: appointment.client.email,
        phoneNumber: appointment.client.phoneNumber,
        preferredContact: appointment.client.preferredContact,
      },
      clientId: appointment.clientId,
      rate: Number(appointment.rate),
      paid: !!appointment.paid,
      format: appointment.format,
      status: appointment.status,
      isCompleted: appointment.isCompleted,
      isRecurring: appointment.isRecurring,
      recurringType: appointment.recurringType,
      notes: appointment.notes,
      createdAt: appointment.createdAt,
      updatedAt: appointment.updatedAt,
    };
  } catch (error) {
    console.error("Error updating appointment status:", error);
    throw new Error("Failed to update appointment status");
  }
}

export async function getClients(): Promise<IUser[]> {
  try {
    const clients: any[] = await (prisma as any).client.findMany({
      where: {
        confirmed: true,
      },
      orderBy: {
        firstName: "asc",
      },
    });

    return clients.map((client: any) => ({
      id: client.id,
      name: `${client.firstName} ${client.lastName}`,
      email: client.email,
      phoneNumber: client.phoneNumber,
      preferredContact: client.preferredContact,
      defaultRate: client.defaultRate,
    }));
  } catch (error) {
    console.error("Error fetching clients:", error);
    throw new Error("Failed to fetch clients");
  }
}

export async function createAppointment(data: {
  clientId: string;
  startTime: Date;
  endTime: Date;
  rate: number;
  format: "ONLINE" | "FACE_TO_FACE";
  isRecurring?: boolean;
  recurringType?: "WEEKLY" | "BIWEEKLY" | "MONTHLY";
  recurringEndDate?: Date;
}): Promise<IEvent> {
  console.log("🚀 createAppointment called with data:", {
    ...data,
    startTime: data.startTime?.toString(),
    endTime: data.endTime?.toString(),
    recurringEndDate: data.recurringEndDate?.toString(),
  });

  try {
    // Validate the data
    if (!data.clientId) {
      throw new Error("Client ID is required");
    }

    if (!data.startTime || !data.endTime) {
      throw new Error("Start time and end time are required");
    }

    if (data.isRecurring && (!data.recurringType || !data.recurringEndDate)) {
      throw new Error("Recurring appointments require type and end date");
    }

    console.log("✅ Data validation passed");

    // If it's a recurring appointment, create multiple appointments
    if (data.isRecurring && data.recurringType && data.recurringEndDate) {
      console.log("📅 Creating recurring appointments");

      const appointments: any[] = [];
      const { recurringType, recurringEndDate, ...appointmentBaseData } = data;

      // Generate a unique recurrentId for all appointments in this series
      const recurrentId = randomUUID();
      console.log("🆔 Generated recurrentId for series:", recurrentId);

      const currentDate = new Date(appointmentBaseData.startTime);
      const endDate = new Date(recurringEndDate);

      let iteration = 0;
      const maxIterations = 100; // Safety limit

      while (currentDate <= endDate && iteration < maxIterations) {
        const appointmentEndTime = new Date(currentDate);
        appointmentEndTime.setTime(
          appointmentEndTime.getTime() +
            (appointmentBaseData.endTime.getTime() -
              appointmentBaseData.startTime.getTime())
        );

        try {
          // Generate Jitsi tokens for online appointments
          let hostJwt: string | undefined;
          let clientJwt: string | undefined;

          if (appointmentBaseData.format === "ONLINE") {
            console.log("🎥 Generating Jitsi tokens for online appointment");

            // First get the client info for the token generation
            const client = await (prisma as any).client.findUnique({
              where: { id: appointmentBaseData.clientId },
              select: {
                firstName: true,
                lastName: true,
                email: true,
                sendInvoiceAutomatically: true,
              },
            });

            if (client) {
              const clientName = `${client.firstName} ${client.lastName}`;
              const tokens = await generateJitsiTokensForAppointment(
                `recurring-${recurrentId}-${iteration + 1}`, // Unique ID for each recurring appointment
                clientName,
                client.email,
                new Date(currentDate),
                appointmentEndTime
              );
              hostJwt = tokens.hostJwt;
              clientJwt = tokens.clientJwt;
              console.log(
                "✅ Generated Jitsi tokens for recurring appointment"
              );
            }
          }

          const appointment = await (prisma as any).appointment.create({
            data: {
              clientId: appointmentBaseData.clientId,
              startTime: new Date(currentDate),
              endTime: appointmentEndTime,
              format: appointmentBaseData.format,
              status: "NOT_YET_ATTENDED",
              isCompleted: false,
              isRecurring: true,
              recurringType: recurringType,
              recurringEndDate: endDate,
              recurrentId: recurrentId, // Add the common recurrentId
              confirmed: true, // Admin-created appointments are automatically confirmed
              // Add Jitsi tokens if this is an online appointment
              hostJwt,
              clientJwt,
            },
            include: {
              client: true,
              notes: true,
            },
          });

          console.log(
            `✅ Created appointment ${iteration + 1}:`,
            appointment.id
          );
          appointments.push(appointment);

          // Create invoice for each recurring appointment
          try {
            console.log(
              `💳 Creating invoice for recurring appointment ${iteration + 1}:`,
              appointment.id
            );
            await (prisma as any).invoice.create({
              data: {
                clientId: appointment.clientId,
                appointmentId: appointment.id,
                amount: appointmentBaseData.rate,
                status: "UNPAID",
                description: `Consultation récurrente - ${format(new Date(appointment.startTime), "PPP", { locale: fr })}`,
                dueDate: new Date(
                  new Date(appointment.startTime).getTime() +
                    30 * 24 * 60 * 60 * 1000
                ), // 30 days from appointment
              },
            });
            console.log(
              `✅ Created invoice for recurring appointment ${iteration + 1}:`,
              appointment.id
            );
          } catch (invoiceError) {
            console.error(
              `❌ Error creating invoice for recurring appointment ${iteration + 1}:`,
              invoiceError
            );
            // Don't fail the appointment creation if invoice creation fails
          }
        } catch (createError) {
          console.error(
            `❌ Error creating appointment ${iteration + 1}:`,
            createError
          );
          throw createError;
        }

        // Increment the date based on recurring type
        switch (recurringType) {
          case "WEEKLY":
            currentDate.setDate(currentDate.getDate() + 7);
            break;
          case "BIWEEKLY":
            currentDate.setDate(currentDate.getDate() + 14);
            break;
          case "MONTHLY":
            currentDate.setMonth(currentDate.getMonth() + 1);
            break;
        }

        iteration++;
      }

      console.log(`🎉 Created ${appointments.length} recurring appointments`);

      // Send ONE confirmation email for the entire series
      try {
        const response =
          await EmailService.sendRecurringSeriesConfirmationEmail(appointments);
        console.log("✅ Series confirmation email sent:", response);
      } catch (emailError) {
        console.error(
          "❌ Error sending series confirmation email:",
          emailError
        );
        // Don't fail the appointment creation if email fails
      }

      // Schedule reminder emails for each appointment (24h + 1h for each)
      for (let i = 0; i < appointments.length; i++) {
        const appointment = appointments[i];

        try {
          // Schedule both 24h and 1h reminder emails for each appointment
          await EmailScheduler.scheduleAppointmentEmails(
            appointment.id,
            appointment.client.email,
            `${appointment.client.firstName} ${appointment.client.lastName}`,
            appointment.startTime,
            appointment.endTime,
            appointment.client.sendInvoiceAutomatically,
            true // Include all reminders for each appointment
          );
        } catch (emailError) {
          console.error(
            `❌ Error scheduling emails for appointment ${appointment.id}:`,
            emailError
          );
          // Don't fail the appointment creation if email fails
        }
      }

      // Return the first appointment as IEvent
      const firstAppointment = appointments[0];
      return {
        id: firstAppointment.id,
        title: `${firstAppointment.client.firstName} ${firstAppointment.client.lastName}`,
        startDate: firstAppointment.startTime,
        endDate: firstAppointment.endTime,
        description: formatAppointmentDescription(firstAppointment.format),
        user: {
          id: firstAppointment.client.id,
          name: `${firstAppointment.client.firstName} ${firstAppointment.client.lastName}`,
          email: firstAppointment.client.email,
          phoneNumber: firstAppointment.client.phoneNumber,
          preferredContact: firstAppointment.client.preferredContact,
        },
        clientId: firstAppointment.clientId,
        // Use the original provided rate from the appointmentBaseData to keep older callers working
        rate: Number(appointmentBaseData.rate),
        paid: false,
        format: firstAppointment.format,
        status: firstAppointment.status,
        isCompleted: firstAppointment.isCompleted,
        isRecurring: firstAppointment.isRecurring,
        recurringType: firstAppointment.recurringType,
        recurrentId: firstAppointment.recurrentId,
        hostJwt: firstAppointment.hostJwt,
        clientJwt: firstAppointment.clientJwt,
        hostAttended: firstAppointment.hostAttended,
        clientAttended: firstAppointment.clientAttended,
        notes: firstAppointment.notes,
        createdAt: firstAppointment.createdAt,
        updatedAt: firstAppointment.updatedAt,
      };
    } else {
      console.log("📝 Creating single appointment");

      // Generate Jitsi tokens for online appointments
      let hostJwt: string | undefined;
      let clientJwt: string | undefined;

      if (data.format === "ONLINE") {
        console.log("🎥 Generating Jitsi tokens for online appointment");

        // Get the client info for the token generation
        const client = await (prisma as any).client.findUnique({
          where: { id: data.clientId },
          select: {
            firstName: true,
            lastName: true,
            email: true,
            sendInvoiceAutomatically: true,
          },
        });

        if (client) {
          const clientName = `${client.firstName} ${client.lastName}`;
          const tokens = await generateJitsiTokensForAppointment(
            "Rendez vous",
            clientName,
            client.email,
            new Date(data.startTime),
            new Date(data.endTime)
          );
          hostJwt = tokens.hostJwt;
          clientJwt = tokens.clientJwt;
          console.log("✅ Generated Jitsi tokens for single appointment");
        }
      }

      const appointmentData = {
        clientId: data.clientId,
        startTime: new Date(data.startTime),
        endTime: new Date(data.endTime),
        format: data.format,
        status: "NOT_YET_ATTENDED" as const,
        isCompleted: false,
        isRecurring: false,
        recurrentId: null, // Explicitly set to null for non-recurring appointments
        confirmed: true, // Admin-created appointments are automatically confirmed
        // Add Jitsi tokens if this is an online appointment
        hostJwt,
        clientJwt,
      };

      console.log("📊 Single appointment data:", appointmentData);

      const appointment = await (prisma as any).appointment.create({
        data: appointmentData,
        include: {
          client: true,
          notes: true,
        },
      });

      console.log("✅ Created single appointment:", appointment.id);

      // Create invoice for the appointment
      try {
        console.log("💳 Creating invoice for appointment:", appointment.id);
        await (prisma as any).invoice.create({
          data: {
            clientId: appointment.clientId,
            appointmentId: appointment.id,
            amount: data.rate,
            status: "UNPAID",
            description: `Consultation - ${format(new Date(appointment.startTime), "PPP", { locale: fr })}`,
            dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
          },
        });
        console.log("✅ Created invoice for appointment:", appointment.id);
      } catch (invoiceError) {
        console.error("❌ Error creating invoice:", invoiceError);
        // Don't fail the appointment creation if invoice creation fails
      }

      // Send confirmation email and schedule reminders
      try {
        console.log("📧 Sending confirmation email for single appointment");
        await EmailService.sendConfirmationEmail(appointment);

        // Schedule reminder emails
        await EmailScheduler.scheduleAppointmentEmails(
          appointment.id,
          appointment.client.email,
          `${appointment.client.firstName} ${appointment.client.lastName}`,
          appointment.startTime,
          appointment.endTime,
          appointment.client.sendInvoiceAutomatically,
          true // First week - include 24h reminder
        );
      } catch (emailError) {
        console.error(
          `❌ Error sending emails for appointment ${appointment.id}:`,
          emailError
        );
        // Don't fail the appointment creation if email fails
      }

      return {
        id: appointment.id,
        title: `${appointment.client.firstName} ${appointment.client.lastName}`,
        startDate: appointment.startTime,
        endDate: appointment.endTime,
        description: formatAppointmentDescription(appointment.format),
        user: {
          id: appointment.client.id,
          name: `${appointment.client.firstName} ${appointment.client.lastName}`,
          email: appointment.client.email,
          phoneNumber: appointment.client.phoneNumber,
          preferredContact: appointment.client.preferredContact,
        },
        clientId: appointment.clientId,
        // return the requested rate so callers still receive it
        rate: Number(data.rate),
        paid: false,
        format: appointment.format,
        status: appointment.status,
        isCompleted: appointment.isCompleted,
        isRecurring: appointment.isRecurring,
        recurringType: appointment.recurringType,
        recurrentId: appointment.recurrentId, // Include recurrentId
        // Include Jitsi fields
        hostJwt: appointment.hostJwt,
        clientJwt: appointment.clientJwt,
        hostAttended: appointment.hostAttended,
        clientAttended: appointment.clientAttended,
        notes: appointment.notes,
        createdAt: appointment.createdAt,
        updatedAt: appointment.updatedAt,
      };
    }
  } catch (error) {
    console.error("❌ Error in createAppointment:", error);
    console.error("❌ Error details:", {
      message: (error as any)?.message,
      code: (error as any)?.code,
      meta: (error as any)?.meta,
    });
    throw new Error(
      `Failed to create appointment: ${
        (error as any)?.message || "Unknown error"
      }`
    );
  }
}

export async function updateAppointment(
  id: string,
  data: Partial<{
    startTime: Date;
    endTime: Date;
    format: "ONLINE" | "FACE_TO_FACE";
    isCompleted: boolean;
    timeDifferences?: {
      startTimeDiff: number; // in minutes
      endTimeDiff: number; // in minutes
    };
    dayDifference?: number; // in days
  }>,
  editMode: "single" | "series" = "single"
): Promise<IEvent> {
  console.log("🚀 updateAppointment called with:", { id, data, editMode });

  try {
    if (editMode === "series") {
      // First, get the appointment to check if it's recurring
      const originalAppointment: any = await (
        prisma as any
      ).appointment.findUnique({
        where: { id },
        include: { client: true, notes: true },
      });

      if (!originalAppointment) {
        throw new Error("Appointment not found");
      }

      if (originalAppointment.isRecurring && originalAppointment.recurrentId) {
        console.log(
          "📅 Updating all appointments in recurring series with recurrentId:",
          originalAppointment.recurrentId
        );

        if (data.timeDifferences || data.dayDifference) {
          console.log(
            "⏰ Applying time and/or day differences to all appointments in series"
          );

          // Get all appointments in the series
          const seriesAppointments = await (prisma as any).appointment.findMany(
            {
              where: {
                recurrentId: originalAppointment.recurrentId,
              },
            }
          );

          console.log(
            `📊 Found ${seriesAppointments.length} appointments in series`
          );

          // Apply time and day differences to each appointment
          for (const appointment of seriesAppointments) {
            let newStart = new Date(appointment.startTime);
            let newEnd = new Date(appointment.endTime);

            // Apply day difference first (if any)
            if (data.dayDifference && data.dayDifference !== 0) {
              newStart = addDays(newStart, data.dayDifference);
              newEnd = addDays(newEnd, data.dayDifference);
              console.log(
                `📅 Applied day difference of ${data.dayDifference} days to appointment ${appointment.id}`
              );
            }

            // Apply time differences (if any)
            if (data.timeDifferences) {
              newStart = new Date(
                newStart.getTime() +
                  data.timeDifferences.startTimeDiff * 60 * 1000
              );
              newEnd = new Date(
                newEnd.getTime() + data.timeDifferences.endTimeDiff * 60 * 1000
              );
              console.log(
                `⏰ Applied time differences to appointment ${appointment.id}`
              );
            }

            // Update the appointment with new dates
            await (prisma as any).appointment.update({
              where: { id: appointment.id },
              data: {
                startTime: newStart,
                endTime: newEnd,
                ...(data.format !== undefined && { format: data.format }),
              },
            });

            console.log(
              `✅ Updated appointment ${appointment.id} with new dates:`,
              {
                originalStart: appointment.startTime,
                originalEnd: appointment.endTime,
                newStart: newStart.toString(),
                newEnd: newEnd.toString(),
              }
            );
          }
        } else {
          // Regular series update without time or day differences
          const { ...updateData } = data;
          const updateResult = await (prisma as any).appointment.updateMany({
            where: {
              recurrentId: originalAppointment.recurrentId,
            },
            data: updateData,
          });

          console.log("📊 Updated appointments count:", updateResult.count);
        }

        // Return the original appointment with updated data
        const updatedAppointment = await (prisma as any).appointment.findUnique(
          {
            where: { id },
            include: { client: true, notes: true },
          }
        );

        return {
          id: updatedAppointment.id,
          title: `${updatedAppointment.client.firstName} ${updatedAppointment.client.lastName}`,
          startDate: updatedAppointment.startTime,
          endDate: updatedAppointment.endTime,
          description: formatAppointmentDescription(updatedAppointment.format),
          user: {
            id: updatedAppointment.client.id,
            name: `${updatedAppointment.client.firstName} ${updatedAppointment.client.lastName}`,
            email: updatedAppointment.client.email,
            phoneNumber: updatedAppointment.client.phoneNumber,
            preferredContact: updatedAppointment.client.preferredContact,
          },
          clientId: updatedAppointment.clientId,
          rate: 0, // Rate is now stored in invoice table
          paid: false, // Payment status is now stored in invoice table
          format: updatedAppointment.format,
          status: updatedAppointment.status,
          isCompleted: updatedAppointment.isCompleted,
          isRecurring: updatedAppointment.isRecurring,
          recurringType: updatedAppointment.recurringType,
          recurrentId: updatedAppointment.recurrentId, // Include recurrentId
          notes: updatedAppointment.notes,
          createdAt: updatedAppointment.createdAt,
          updatedAt: updatedAppointment.updatedAt,
        };
      }
    }

    // Update single appointment (default behavior)
    console.log("📝 Updating single appointment");
    const appointment: any = await (prisma as any).appointment.update({
      where: { id },
      data,
      include: {
        client: true,
        notes: true,
      },
    });

    return {
      id: appointment.id,
      title: `${appointment.client.firstName} ${appointment.client.lastName}`,
      startDate: appointment.startTime,
      endDate: appointment.endTime,
      description: formatAppointmentDescription(appointment.format),
      user: {
        id: appointment.client.id,
        name: `${appointment.client.firstName} ${appointment.client.lastName}`,
        email: appointment.client.email,
        phoneNumber: appointment.client.phoneNumber,
        preferredContact: appointment.client.preferredContact,
      },
      clientId: appointment.clientId,
      rate: 0, // Rate is now stored in invoice table
      paid: false, // Payment status is now stored in invoice table
      format: appointment.format,
      status: appointment.status,
      isCompleted: appointment.isCompleted,
      isRecurring: appointment.isRecurring,
      recurringType: appointment.recurringType,
      recurrentId: appointment.recurrentId, // Include recurrentId
      notes: appointment.notes,
      createdAt: appointment.createdAt,
      updatedAt: appointment.updatedAt,
    };
  } catch (error) {
    console.error("❌ Error updating appointment:", error);
    console.error("❌ Error details:", {
      message: (error as any)?.message,
      code: (error as any)?.code,
      meta: (error as any)?.meta,
    });
    throw new Error(
      `Failed to update appointment: ${
        (error as any)?.message || "Unknown error"
      }`
    );
  }
}

export async function deleteAppointment(
  id: string,
  deleteMode: "single" | "series" = "single"
): Promise<void> {
  console.log("🗑️ deleteAppointment called with:", { id, deleteMode });

  try {
    if (deleteMode === "series") {
      // First, get the appointment to check if it's recurring
      const appointment: any = await (prisma as any).appointment.findUnique({
        where: { id },
      });

      if (!appointment) {
        throw new Error("Appointment not found");
      }

      if (appointment.isRecurring && appointment.recurrentId) {
        console.log(
          "🗑️ Deleting all appointments in recurring series with recurrentId:",
          appointment.recurrentId
        );

        // Delete all appointments in the series
        const deleteResult = await (prisma as any).appointment.deleteMany({
          where: {
            recurrentId: appointment.recurrentId,
          },
        });

        console.log("📊 Deleted appointments count:", deleteResult.count);
      } else {
        // Not a recurring appointment, just delete the single one
        await (prisma.appointment as any).delete({
          where: { id },
        });
        console.log("✅ Deleted single appointment");
      }
    } else {
      // Single appointment deletion
      console.log("🗑️ Deleting single appointment");
      await (prisma.appointment as any).delete({
        where: { id },
      });
      console.log("✅ Deleted single appointment");
    }
  } catch (error) {
    console.error("❌ Error deleting appointment:", error);
    console.error("❌ Error details:", {
      message: (error as any)?.message,
      code: (error as any)?.code,
      meta: (error as any)?.meta,
    });
    throw new Error(
      `Failed to delete appointment: ${
        (error as any)?.message || "Unknown error"
      }`
    );
  }
}

export async function getUpcomingOnlineAppointments(): Promise<IEvent[]> {
  try {
    const now = new Date();
    const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000); // 24 hours ago
    const appointments: any[] = await (prisma as any).appointment.findMany({
      where: {
        format: "ONLINE",
        startTime: {
          gte: oneDayAgo,
        },
      },
      include: {
        client: true,
        notes: true,
      },
      orderBy: {
        startTime: "asc",
      },
    });

    return appointments.map((appointment: any) => ({
      id: appointment.id,
      title: `${appointment.client.firstName} ${appointment.client.lastName}`,
      startDate: appointment.startTime,
      endDate: appointment.endTime,
      description: formatAppointmentDescription(appointment.format),
      user: {
        id: appointment.client.id,
        name: `${appointment.client.firstName} ${appointment.client.lastName}`,
        email: appointment.client.email,
        phoneNumber: appointment.client.phoneNumber,
        preferredContact: appointment.client.preferredContact,
      },
      clientId: appointment.clientId,
      rate: Number(appointment.rate),
      paid: !!appointment.paid,
      format: appointment.format,
      status: appointment.status,
      isCompleted: appointment.isCompleted,
      isRecurring: appointment.isRecurring,
      recurringType: appointment.recurringType,
      recurrentId: appointment.recurrentId,
      // Include Jitsi fields
      hostJwt: appointment.hostJwt,
      clientJwt: appointment.clientJwt,
      hostAttended: appointment.hostAttended,
      clientAttended: appointment.clientAttended,
      notes: appointment.notes,
      createdAt: appointment.createdAt,
      updatedAt: appointment.updatedAt,
    }));
  } catch (error) {
    console.error("Error fetching upcoming online appointments:", error);
    throw new Error("Failed to fetch upcoming online appointments");
  }
}

export async function updateAppointmentStatusAndPayment(
  id: string,
  data: {
    status?: "NOT_YET_ATTENDED" | "ATTENDED" | "ABSENT" | "CANCELLED";
    paid?: boolean;
  }
): Promise<IEvent> {
  try {
    const appointment: any = await (prisma as any).appointment.update({
      where: { id },
      data,
      include: {
        client: true,
        notes: true,
      },
    });

    return {
      id: appointment.id,
      title: `${appointment.client.firstName} ${appointment.client.lastName}`,
      startDate: appointment.startTime,
      endDate: appointment.endTime,
      description: formatAppointmentDescription(appointment.format),
      user: {
        id: appointment.client.id,
        name: `${appointment.client.firstName} ${appointment.client.lastName}`,
        email: appointment.client.email,
        phoneNumber: appointment.client.phoneNumber,
        preferredContact: appointment.client.preferredContact,
      },
      clientId: appointment.clientId,
      rate: Number(appointment.rate),
      paid: !!appointment.paid,
      format: appointment.format,
      status: appointment.status,
      isCompleted: appointment.isCompleted,
      isRecurring: appointment.isRecurring,
      recurringType: appointment.recurringType,
      recurrentId: appointment.recurrentId,
      // Include Jitsi fields
      hostJwt: appointment.hostJwt,
      clientJwt: appointment.clientJwt,
      hostAttended: appointment.hostAttended,
      clientAttended: appointment.clientAttended,
      notes: appointment.notes,
      createdAt: appointment.createdAt,
      updatedAt: appointment.updatedAt,
    };
  } catch (error) {
    console.error("Error updating appointment status and payment:", error);
    throw new Error("Failed to update appointment status and payment");
  }
}
