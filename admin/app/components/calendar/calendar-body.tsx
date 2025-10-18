"use client";

import { isSameDay } from "date-fns";
import { motion } from "framer-motion";
import React from "react";
import { fadeIn } from "@/app/components/calendar/animations";
import { useCalendar } from "@/app/components/calendar/contexts/calendar-context";
import { AgendaEvents } from "@/app/components/calendar/views/agenda-view/agenda-events";
import { CalendarMonthView } from "@/app/components/calendar/views/month-view/calendar-month-view";
import { CalendarDayView } from "@/app/components/calendar/views/week-and-day-view/calendar-day-view";
import { CalendarWeekView } from "@/app/components/calendar/views/week-and-day-view/calendar-week-view";
import { CalendarYearView } from "@/app/components/calendar/views/year-view/calendar-year-view";

export function CalendarBody() {
  const { view, events } = useCalendar();

  const singleDayEvents = events.filter((event) => {
    const startDate = event.startDate;
    const endDate = event.endDate;
    return isSameDay(startDate, endDate);
  });

  const multiDayEvents = events.filter((event) => {
    const startDate = event.startDate;
    const endDate = event.endDate;
    return !isSameDay(startDate, endDate);
  });

  return (
    <div className="w-full overflow-scroll relative">
      <motion.div
        key={view}
        initial="initial"
        animate="animate"
        exit="exit"
        variants={fadeIn}
      >
        {view === "month" && (
          <CalendarMonthView
            singleDayEvents={singleDayEvents}
            multiDayEvents={multiDayEvents}
          />
        )}
        {view === "week" && (
          <CalendarWeekView
            singleDayEvents={singleDayEvents}
            multiDayEvents={multiDayEvents}
          />
        )}
        {view === "day" && (
          <CalendarDayView
            singleDayEvents={singleDayEvents}
            multiDayEvents={multiDayEvents}
          />
        )}
        {view === "year" && (
          <CalendarYearView
            singleDayEvents={singleDayEvents}
            multiDayEvents={multiDayEvents}
          />
        )}
        {view === "agenda" && (
          <motion.div
            key="agenda"
            initial="initial"
            animate="animate"
            exit="exit"
            variants={fadeIn}
          >
            <AgendaEvents />
          </motion.div>
        )}
      </motion.div>
    </div>
  );
}
