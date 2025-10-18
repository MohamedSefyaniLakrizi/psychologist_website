"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

// ============= Weekly Availability Template =============

export async function getWeeklyAvailability() {
  try {
    const availability = await prisma.weeklyAvailability.findMany({
      orderBy: { weekday: "asc" },
    });
    return { success: true, data: availability };
  } catch (error) {
    console.error("Error fetching weekly availability:", error);
    return { success: false, error: "Failed to fetch weekly availability" };
  }
}

export async function createWeeklyAvailability(data: {
  weekday: number;
  startTime: string;
  endTime: string;
}) {
  try {
    const availability = await prisma.weeklyAvailability.create({
      data: {
        weekday: data.weekday,
        startTime: data.startTime,
        endTime: data.endTime,
      },
    });
    revalidatePath("/availability");
    return { success: true, data: availability };
  } catch (error) {
    console.error("Error creating weekly availability:", error);
    return { success: false, error: "Failed to create weekly availability" };
  }
}

export async function updateWeeklyAvailability(
  id: string,
  data: {
    startTime?: string;
    endTime?: string;
  }
) {
  try {
    const availability = await prisma.weeklyAvailability.update({
      where: { id },
      data,
    });
    revalidatePath("/availability");
    return { success: true, data: availability };
  } catch (error) {
    console.error("Error updating weekly availability:", error);
    return { success: false, error: "Failed to update weekly availability" };
  }
}

export async function deleteWeeklyAvailability(id: string) {
  try {
    await prisma.weeklyAvailability.delete({
      where: { id },
    });
    revalidatePath("/availability");
    return { success: true };
  } catch (error) {
    console.error("Error deleting weekly availability:", error);
    return { success: false, error: "Failed to delete weekly availability" };
  }
}

export async function bulkUpdateWeeklyAvailability(
  slots: Array<{
    weekday: number;
    startTime: string;
    endTime: string;
  }>
) {
  try {
    // Delete all existing and recreate
    await prisma.weeklyAvailability.deleteMany({});

    if (slots.length > 0) {
      await prisma.weeklyAvailability.createMany({
        data: slots,
      });
    }

    revalidatePath("/availability");
    return { success: true };
  } catch (error) {
    console.error("Error bulk updating weekly availability:", error);
    return {
      success: false,
      error: "Failed to bulk update weekly availability",
    };
  }
}

// ============= Date-Specific Availability =============

export async function getDateAvailability(startDate: Date, endDate: Date) {
  try {
    const availability = await prisma.dateAvailability.findMany({
      where: {
        date: {
          gte: startDate,
          lte: endDate,
        },
      },
      orderBy: { date: "asc" },
    });
    return { success: true, data: availability };
  } catch (error) {
    console.error("Error fetching date availability:", error);
    return { success: false, error: "Failed to fetch date availability" };
  }
}

export async function setDateAvailability(data: {
  date: Date;
  slots: Array<{ startTime: string; endTime: string }>;
}) {
  try {
    const dateStr = new Date(data.date);
    dateStr.setHours(0, 0, 0, 0);

    // Delete existing slots for this date
    await prisma.dateAvailability.deleteMany({
      where: { date: dateStr },
    });

    // If slots array is empty, it means the day is closed (no availability)
    // If slots has items, create them
    if (data.slots.length > 0) {
      await prisma.dateAvailability.createMany({
        data: data.slots.map((slot) => ({
          date: dateStr,
          startTime: slot.startTime,
          endTime: slot.endTime,
        })),
      });
    } else {
      // Create a "closed" marker with null times
      await prisma.dateAvailability.create({
        data: {
          date: dateStr,
          startTime: null,
          endTime: null,
        },
      });
    }

    revalidatePath("/availability");
    return { success: true };
  } catch (error) {
    console.error("Error setting date availability:", error);
    return { success: false, error: "Failed to set date availability" };
  }
}

export async function bulkSetDateAvailability(dates: Date[], closed: boolean) {
  try {
    for (const date of dates) {
      const dateStr = new Date(date);
      dateStr.setHours(0, 0, 0, 0);

      // Delete existing slots for this date
      await prisma.dateAvailability.deleteMany({
        where: { date: dateStr },
      });

      if (closed) {
        // Mark as closed
        await prisma.dateAvailability.create({
          data: {
            date: dateStr,
            startTime: null,
            endTime: null,
          },
        });
      }
      // If not closed and no specific slots, it will fall back to weekly template
    }

    revalidatePath("/availability");
    return { success: true };
  } catch (error) {
    console.error("Error bulk setting date availability:", error);
    return { success: false, error: "Failed to bulk set date availability" };
  }
}

export async function deleteDateAvailability(date: Date) {
  try {
    const dateStr = new Date(date);
    dateStr.setHours(0, 0, 0, 0);

    await prisma.dateAvailability.deleteMany({
      where: { date: dateStr },
    });

    revalidatePath("/availability");
    return { success: true };
  } catch (error) {
    console.error("Error deleting date availability:", error);
    return { success: false, error: "Failed to delete date availability" };
  }
}

// ============= Combined Availability Check =============

export async function getAvailabilityForDate(date: Date) {
  try {
    const dateStr = new Date(date);
    dateStr.setHours(0, 0, 0, 0);

    // Check for date-specific availability first
    const dateAvailability = await prisma.dateAvailability.findMany({
      where: { date: dateStr },
    });

    if (dateAvailability.length > 0) {
      // Has specific override
      const hasClosedMarker = dateAvailability.some(
        (slot) => slot.startTime === null && slot.endTime === null
      );

      if (hasClosedMarker) {
        return { success: true, slots: [], source: "date-override-closed" };
      }

      return {
        success: true,
        slots: dateAvailability
          .filter((slot) => slot.startTime && slot.endTime)
          .map((slot) => ({
            startTime: slot.startTime!,
            endTime: slot.endTime!,
          })),
        source: "date-override",
      };
    }

    // Fall back to weekly template
    const dayOfWeek = (date.getDay() + 6) % 7; // Convert Sunday=0 to Monday=0
    const weeklyAvailability = await prisma.weeklyAvailability.findMany({
      where: { weekday: dayOfWeek },
      orderBy: { startTime: "asc" },
    });

    return {
      success: true,
      slots: weeklyAvailability.map((slot) => ({
        startTime: slot.startTime,
        endTime: slot.endTime,
      })),
      source: "weekly-template",
    };
  } catch (error) {
    console.error("Error getting availability for date:", error);
    return { success: false, error: "Failed to get availability", slots: [] };
  }
}

export async function checkAvailability(
  startTime: Date,
  endTime: Date,
  excludeAppointmentId?: string
) {
  try {
    const startDate = new Date(startTime);

    // Get availability for this date
    const availabilityResult = await getAvailabilityForDate(startDate);

    if (!availabilityResult.success || availabilityResult.slots.length === 0) {
      return {
        success: true,
        available: false,
        reason: "No availability defined for this date",
      };
    }

    // Extract time strings
    const startTimeStr = `${startDate.getHours().toString().padStart(2, "0")}:${startDate.getMinutes().toString().padStart(2, "0")}`;
    const endTimeStr = `${endTime.getHours().toString().padStart(2, "0")}:${endTime.getMinutes().toString().padStart(2, "0")}`;

    // Check if requested time falls within any available slot
    const isWithinAvailableSlot = availabilityResult.slots.some((slot) => {
      return startTimeStr >= slot.startTime && endTimeStr <= slot.endTime;
    });

    if (!isWithinAvailableSlot) {
      return {
        success: true,
        available: false,
        reason: "Time slot not within available hours",
      };
    }

    // Check for conflicting appointments
    const appointmentWhere: any = {
      startTime: { lt: endTime },
      endTime: { gt: startTime },
      status: { not: "CANCELLED" },
    };

    if (excludeAppointmentId) {
      appointmentWhere.id = { not: excludeAppointmentId };
    }

    const conflictingAppointments = await prisma.appointment.findMany({
      where: appointmentWhere,
      include: { client: true },
    });

    if (conflictingAppointments.length > 0) {
      return {
        success: true,
        available: false,
        reason: "Time slot already booked",
        conflicts: conflictingAppointments,
      };
    }

    return {
      success: true,
      available: true,
    };
  } catch (error) {
    console.error("Error checking availability:", error);
    return {
      success: false,
      error: "Failed to check availability",
      available: false,
    };
  }
}
