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
      // Get general weekly template
      const weeklyTemplate = await getWeeklyTemplate();
      return NextResponse.json(weeklyTemplate);
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
    // Fallback to mock data if database is unavailable
    return [
      { weekday: 1, startTime: "09:00", endTime: "17:00" }, // Tuesday
      { weekday: 2, startTime: "09:00", endTime: "17:00" }, // Wednesday
      { weekday: 3, startTime: "09:00", endTime: "17:00" }, // Thursday
      { weekday: 4, startTime: "09:00", endTime: "17:00" }, // Friday
    ];
  }
}

async function getDateAvailability(dateStr: string) {
  const date = new Date(dateStr);
  const weekday = (date.getDay() + 6) % 7; // Convert Sunday=0 to Monday=0 format

  try {
    // Check for date-specific overrides first
    const dateOverride = await prisma.dateAvailability.findFirst({
      where: {
        date: {
          equals: new Date(date.getFullYear(), date.getMonth(), date.getDate()),
        },
      },
    });

    if (dateOverride) {
      return dateOverride.startTime && dateOverride.endTime
        ? {
            available: true,
            startTime: dateOverride.startTime,
            endTime: dateOverride.endTime,
            timeSlots: await generateAvailableTimeSlots(
              dateOverride.startTime,
              dateOverride.endTime,
              dateStr
            ),
          }
        : { available: false, timeSlots: [] };
    }

    // Fall back to weekly template
    const weeklyTemplate = await prisma.weeklyAvailability.findFirst({
      where: { weekday },
    });

    if (!weeklyTemplate) {
      return { available: false, timeSlots: [] };
    }

    return {
      available: true,
      startTime: weeklyTemplate.startTime,
      endTime: weeklyTemplate.endTime,
      timeSlots: await generateAvailableTimeSlots(
        weeklyTemplate.startTime,
        weeklyTemplate.endTime,
        dateStr
      ),
    };
  } catch (error) {
    console.error("Error fetching date availability:", error);

    // Fallback to mock data based on weekday
    const mockWeeklyTemplate = {
      1: { startTime: "09:00", endTime: "17:00" }, // Tuesday
      2: { startTime: "09:00", endTime: "17:00" }, // Wednesday
      3: { startTime: "09:00", endTime: "17:00" }, // Thursday
      4: { startTime: "09:00", endTime: "17:00" }, // Friday
    }[weekday];

    if (!mockWeeklyTemplate) {
      return { available: false, timeSlots: [] };
    }

    return {
      available: true,
      startTime: mockWeeklyTemplate.startTime,
      endTime: mockWeeklyTemplate.endTime,
      timeSlots: generateTimeSlots(
        mockWeeklyTemplate.startTime,
        mockWeeklyTemplate.endTime
      ),
    };
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
