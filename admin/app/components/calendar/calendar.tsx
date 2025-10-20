import React from "react";
import { CalendarBody } from "@/app/components/calendar/calendar-body";
import { CalendarProvider } from "@/app/components/calendar/contexts/calendar-context";
import { DndProvider } from "@/app/components/calendar/contexts/dnd-context";
import { CalendarHeader } from "@/app/components/calendar/header/calendar-header";
import { getAppointments, getClients } from "@/lib/actions/appointments";
import {
  getWeeklyAvailability,
  getDateAvailability,
} from "@/lib/actions/availability";
import { startOfMonth, endOfMonth, addMonths } from "date-fns";

async function getCalendarData() {
  const currentDate = new Date();
  const startDate = startOfMonth(addMonths(currentDate, -1));
  const endDate = endOfMonth(addMonths(currentDate, 12));

  // Always fetch fresh data - timestamp ensures cache busting
  const timestamp = Date.now();
  console.log(
    `📅 Fetching calendar data at ${new Date(timestamp).toISOString()}`
  );

  const [eventsResult, usersResult, weeklyResult, dateResult] =
    await Promise.all([
      getAppointments(),
      getClients(),
      getWeeklyAvailability(),
      getDateAvailability(startDate, endDate),
    ]);

  return {
    events: eventsResult,
    users: usersResult,
    weeklyAvailability: weeklyResult.success ? weeklyResult.data : [],
    dateAvailability: dateResult.success ? dateResult.data : [],
    timestamp, // Always unique
  };
}

export async function Calendar() {
  const { events, users, weeklyAvailability, dateAvailability, timestamp } =
    await getCalendarData();

  return (
    <CalendarProvider
      events={events}
      users={users}
      view="month"
      weeklyAvailability={weeklyAvailability}
      dateAvailability={dateAvailability}
      key={timestamp}
    >
      <DndProvider showConfirmation={false}>
        <div className="h-full w-full border rounded-xl">
          <CalendarHeader />
          <CalendarBody />
        </div>
      </DndProvider>
    </CalendarProvider>
  );
}
