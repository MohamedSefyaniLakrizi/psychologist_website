import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/app/lib/prisma";

const availabilitySchema = z.object({
  date: z.string().optional(), // YYYY-MM-DD format
  weekStartDate: z.string().optional(), // For getting a week's worth of data
});

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const date = searchParams.get("date");
    const weekStartDate = searchParams.get("weekStartDate");

    const params = availabilitySchema.parse({
      date: date || undefined,
      weekStartDate: weekStartDate || undefined,
    });

    if (params.date) {
      // Get availability for a specific date
      const availability = await getDateAvailability(params.date);
      return NextResponse.json(availability);
    } else if (params.weekStartDate) {
      // Get availability for a week
      const weekAvailability = await getWeekAvailability(params.weekStartDate);
      return NextResponse.json(weekAvailability);
    } else {
      // Default: Get 3 months of availability data for the calendar
      const monthsAvailability = await getMonthsAvailability(3);
      return NextResponse.json(monthsAvailability);
    }
  } catch (error) {
    console.error("Availability API error:", error);
    return NextResponse.json(
      { error: "Failed to fetch availability" },
      { status: 500 }
    );
  }
}

// Database functions using Prisma
async function getWeeklyTemplate() {
  try {
    const weeklyAvailability = await prisma.weeklyAvailability.findMany({
      orderBy: [{ weekday: "asc" }, { startTime: "asc" }],
    });
    return weeklyAvailability;
  } catch (error) {
    console.error("Error fetching weekly template:", error);
    // Fallback to mock data if database is unavailable - including multiple periods per day
    return [
      { weekday: 1, startTime: "09:00", endTime: "12:00" }, // Tuesday morning
      { weekday: 1, startTime: "14:00", endTime: "17:00" }, // Tuesday afternoon
      { weekday: 2, startTime: "09:00", endTime: "12:00" }, // Wednesday morning
      { weekday: 2, startTime: "14:00", endTime: "17:00" }, // Wednesday afternoon
      { weekday: 3, startTime: "09:00", endTime: "12:00" }, // Thursday morning
      { weekday: 3, startTime: "14:00", endTime: "17:00" }, // Thursday afternoon
      { weekday: 4, startTime: "09:00", endTime: "12:00" }, // Friday morning
      { weekday: 4, startTime: "14:00", endTime: "17:00" }, // Friday afternoon
    ];
  }
}

async function getDateAvailability(dateStr: string) {
  const date = new Date(dateStr);
  const weekday = (date.getDay() + 6) % 7; // Convert Sunday=0 to Monday=0 format

  try {
    // Check for date-specific overrides first (get ALL records for this date)
    const dateOverrides = await prisma.dateAvailability.findMany({
      where: {
        date: {
          equals: new Date(date.getFullYear(), date.getMonth(), date.getDate()),
        },
      },
      orderBy: [{ startTime: "asc" }],
    });

    if (dateOverrides.length > 0) {
      // Check if any override has null startTime/endTime (meaning closed)
      const closedOverride = dateOverrides.find(
        (override: any) => !override.startTime || !override.endTime
      );
      if (closedOverride) {
        return { available: false, timeSlots: [] };
      }

      // Combine all time slots from all availability periods
      const allTimeSlots: string[] = [];
      for (const override of dateOverrides) {
        if (override.startTime && override.endTime) {
          const slots = await generateAvailableTimeSlots(
            override.startTime,
            override.endTime,
            dateStr
          );
          allTimeSlots.push(...slots);
        }
      }

      return {
        available: true,
        timeSlots: allTimeSlots.sort(), // Sort time slots
        availabilityPeriods: dateOverrides.map((override: any) => ({
          startTime: override.startTime,
          endTime: override.endTime,
        })),
      };
    }

    // Fall back to weekly template (get ALL records for this weekday)
    const weeklyTemplates = await prisma.weeklyAvailability.findMany({
      where: { weekday },
      orderBy: [{ startTime: "asc" }],
    });

    if (!weeklyTemplates.length) {
      return { available: false, timeSlots: [] };
    }

    // Combine all time slots from all weekly availability periods
    const allTimeSlots: string[] = [];
    for (const template of weeklyTemplates) {
      const slots = await generateAvailableTimeSlots(
        template.startTime,
        template.endTime,
        dateStr
      );
      allTimeSlots.push(...slots);
    }

    return {
      available: true,
      timeSlots: allTimeSlots.sort(), // Sort time slots
      availabilityPeriods: weeklyTemplates.map((template: any) => ({
        startTime: template.startTime,
        endTime: template.endTime,
      })),
    };
  } catch (error) {
    console.error("Error fetching date availability:", error);
    return { available: false, timeSlots: [] };
  }
}

async function getWeekAvailability(weekStartDateStr: string) {
  const weekStart = new Date(weekStartDateStr);
  const weekAvailability = [];

  for (let i = 0; i < 7; i++) {
    const currentDate = new Date(weekStart);
    currentDate.setDate(weekStart.getDate() + i);
    const dateStr = currentDate.toISOString().split("T")[0];
    const availability = await getDateAvailability(dateStr);

    weekAvailability.push({
      date: dateStr,
      weekday: (currentDate.getDay() + 6) % 7, // Convert to Monday=0 format
      ...availability,
    });
  }

  return weekAvailability;
}

async function getMonthsAvailability(monthsAhead: number) {
  const today = new Date();
  const endDate = new Date(today);
  endDate.setMonth(today.getMonth() + monthsAhead);

  try {
    // Get all date-specific overrides in the range
    const dateOverrides = await prisma.dateAvailability.findMany({
      where: {
        date: {
          gte: today,
          lte: endDate,
        },
      },
      orderBy: [{ date: "asc" }, { startTime: "asc" }],
    });

    // Get all weekly templates
    const weeklyTemplates = await prisma.weeklyAvailability.findMany({
      orderBy: [{ weekday: "asc" }, { startTime: "asc" }],
    });

    // Get all existing appointments in the range for filtering booked slots
    const existingAppointments = await prisma.appointment.findMany({
      where: {
        startTime: {
          gte: today,
          lte: endDate,
        },
        OR: [
          { confirmed: true },
          { confirmed: false }, // Include unconfirmed to prevent double booking
        ],
      },
      select: {
        startTime: true,
        endTime: true,
      },
    });

    // Create a map of booked times by date
    const bookedTimesByDate: { [dateStr: string]: Set<string> } = {};
    existingAppointments.forEach((apt: any) => {
      const dateStr = apt.startTime.toISOString().split("T")[0];
      if (!bookedTimesByDate[dateStr]) {
        bookedTimesByDate[dateStr] = new Set();
      }
      bookedTimesByDate[dateStr].add(apt.startTime.toTimeString().slice(0, 5));
    });

    // Create a map of date overrides
    const dateOverrideMap: { [dateStr: string]: any[] } = {};
    dateOverrides.forEach((override: any) => {
      const dateStr = override.date.toISOString().split("T")[0];
      if (!dateOverrideMap[dateStr]) {
        dateOverrideMap[dateStr] = [];
      }
      dateOverrideMap[dateStr].push(override);
    });

    // Generate availability for each day in the range
    const allAvailability = [];
    const currentDate = new Date(today);

    while (currentDate <= endDate) {
      const dateStr = currentDate.toISOString().split("T")[0];
      const weekday = (currentDate.getDay() + 6) % 7; // Convert Sunday=0 to Monday=0 format

      let dayAvailability;

      // Check for date-specific overrides first
      if (dateOverrideMap[dateStr]) {
        const overrides = dateOverrideMap[dateStr];

        // Check if any override has null startTime/endTime (meaning closed)
        const closedOverride = overrides.find(
          (override) => !override.startTime || !override.endTime
        );
        if (closedOverride) {
          dayAvailability = { available: false, timeSlots: [] };
        } else {
          // Combine all time slots from all availability periods
          const allTimeSlots: string[] = [];
          for (const override of overrides) {
            if (override.startTime && override.endTime) {
              const slots = generateTimeSlots(
                override.startTime,
                override.endTime
              );
              allTimeSlots.push(...slots);
            }
          }

          // Filter out booked slots
          const bookedTimes = bookedTimesByDate[dateStr] || new Set();
          const availableSlots = allTimeSlots.filter(
            (slot) => !bookedTimes.has(slot)
          );

          dayAvailability = {
            available: true,
            timeSlots: availableSlots.sort(),
            availabilityPeriods: overrides.map((override) => ({
              startTime: override.startTime,
              endTime: override.endTime,
            })),
          };
        }
      } else {
        // Fall back to weekly template
        const weeklyPeriodsForDay = weeklyTemplates.filter(
          (template: any) => template.weekday === weekday
        );

        if (!weeklyPeriodsForDay.length) {
          dayAvailability = { available: false, timeSlots: [] };
        } else {
          // Combine all time slots from all weekly availability periods
          const allTimeSlots: string[] = [];
          for (const template of weeklyPeriodsForDay) {
            const slots = generateTimeSlots(
              template.startTime,
              template.endTime
            );
            allTimeSlots.push(...slots);
          }

          // Filter out booked slots
          const bookedTimes = bookedTimesByDate[dateStr] || new Set();
          const availableSlots = allTimeSlots.filter(
            (slot) => !bookedTimes.has(slot)
          );

          dayAvailability = {
            available: true,
            timeSlots: availableSlots.sort(),
            availabilityPeriods: weeklyPeriodsForDay.map((template: any) => ({
              startTime: template.startTime,
              endTime: template.endTime,
            })),
          };
        }
      }

      allAvailability.push({
        date: dateStr,
        weekday,
        ...dayAvailability,
      });

      // Move to next day
      currentDate.setDate(currentDate.getDate() + 1);
    }

    return allAvailability;
  } catch (error) {
    console.error("Error fetching months availability:", error);
    return [];
  }
}

// Generate time slots and filter out booked ones
async function generateAvailableTimeSlots(
  startTime: string,
  endTime: string,
  dateStr: string
): Promise<string[]> {
  try {
    // Get all possible time slots
    const allSlots = generateTimeSlots(startTime, endTime);

    // Get existing appointments for this date
    const appointmentDate = new Date(dateStr);
    const startOfDay = new Date(
      appointmentDate.getFullYear(),
      appointmentDate.getMonth(),
      appointmentDate.getDate()
    );
    const endOfDay = new Date(startOfDay.getTime() + 24 * 60 * 60 * 1000);

    const existingAppointments = await prisma.appointment.findMany({
      where: {
        startTime: {
          gte: startOfDay,
          lt: endOfDay,
        },
        OR: [
          { confirmed: true },
          { confirmed: false }, // Include unconfirmed appointments to prevent double booking
        ],
      },
      select: {
        startTime: true,
        endTime: true,
      },
    });

    // Filter out booked slots
    const bookedTimes = new Set(
      existingAppointments.map(
        (apt: { startTime: Date; endTime: Date }) =>
          apt.startTime.toTimeString().slice(0, 5) // Extract HH:MM format
      )
    );

    return allSlots.filter((slot) => !bookedTimes.has(slot));
  } catch (error) {
    console.error("Error generating available time slots:", error);
    // Fallback to all slots if database query fails
    return generateTimeSlots(startTime, endTime);
  }
}

function generateTimeSlots(startTime: string, endTime: string): string[] {
  const slots = [];
  const [startHour, startMinute] = startTime.split(":").map(Number);
  const [endHour, endMinute] = endTime.split(":").map(Number);

  const startMinutes = startHour * 60 + startMinute;
  const endMinutes = endHour * 60 + endMinute;

  // Generate 1-hour slots
  for (let minutes = startMinutes; minutes < endMinutes; minutes += 60) {
    const hour = Math.floor(minutes / 60);
    const minute = minutes % 60;
    const timeSlot = `${hour.toString().padStart(2, "0")}:${minute.toString().padStart(2, "0")}`;
    slots.push(timeSlot);
  }

  return slots;
}
