import { addDays, format, isSameDay, startOfWeek } from "date-fns";
import { motion } from "framer-motion";
import { ScrollArea } from "@/app/components/ui/scroll-area";
import { fadeIn, staggerContainer } from "@/app/components/calendar/animations";
import { useCalendar } from "@/app/components/calendar/contexts/calendar-context";
import { AddEditAppointmentDialog } from "@/app/components/calendar/dialogs/add-edit-appointment-dialog";
import { DroppableArea } from "@/app/components/calendar/dnd/droppable-area";
import { groupEvents } from "@/app/components/calendar/helpers";
import type { IEvent } from "@/app/components/calendar/interfaces";
import { CalendarTimeline } from "@/app/components/calendar/views/week-and-day-view/calendar-time-line";
import { RenderGroupedEvents } from "@/app/components/calendar/views/week-and-day-view/render-grouped-events";
import { WeekViewMultiDayEventsRow } from "@/app/components/calendar/views/week-and-day-view/week-view-multi-day-events-row";
interface IProps {
  singleDayEvents: IEvent[];
  multiDayEvents: IEvent[];
}

export function CalendarWeekView({ singleDayEvents, multiDayEvents }: IProps) {
  const { selectedDate, use24HourFormat, getAvailabilityForDate } =
    useCalendar();

  const weekStart = startOfWeek(selectedDate);
  const weekDays = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));
  const hours = Array.from({ length: 24 }, (_, i) => i);

  // Helper function to check if a time slot is available
  const isTimeSlotAvailable = (day: Date, hour: number, minute: number) => {
    const timeStr = `${hour.toString().padStart(2, "0")}:${minute.toString().padStart(2, "0")}`;
    const availabilitySlots = getAvailabilityForDate(day);

    return availabilitySlots.some((slot) => {
      return timeStr >= slot.startTime && timeStr < slot.endTime;
    });
  };

  return (
    <motion.div
      initial="initial"
      animate="animate"
      exit="exit"
      variants={fadeIn}
    >
      <motion.div
        className="flex flex-col items-center justify-center border-b p-4 text-sm sm:hidden"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <p>
          La vue hebdomadaire n&apos;est pas recommandée sur les petits
          appareils.
        </p>
        <p>
          Veuillez passer à un appareil de bureau ou utiliser la vue quotidienne
          à la place.
        </p>
      </motion.div>

      <motion.div className="flex-col sm:flex" variants={staggerContainer}>
        <div>
          <WeekViewMultiDayEventsRow
            selectedDate={selectedDate}
            multiDayEvents={multiDayEvents}
          />

          {/* Week header */}
          <motion.div
            className="relative z-20 flex border-b"
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            {/* Time column header - responsive width */}
            <div className="w-18"></div>
            <div className="grid flex-1 grid-cols-7  border-l">
              {weekDays.map((day, index) => (
                <motion.span
                  key={index}
                  className="py-1 sm:py-2 text-center text-xs font-medium text-t-quaternary"
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                >
                  {/* Mobile: Show only day abbreviation and number */}
                  <span className="block sm:hidden">
                    {format(day, "EEE").charAt(0)}
                    <span className="block font-semibold text-t-secondary text-xs">
                      {format(day, "d")}
                    </span>
                  </span>
                  {/* Desktop: Show full format */}
                  <span className="hidden sm:inline">
                    {format(day, "EE")}{" "}
                    <span className="ml-1 font-semibold text-t-secondary">
                      {format(day, "d")}
                    </span>
                  </span>
                </motion.span>
              ))}
            </div>
          </motion.div>
        </div>

        <ScrollArea className="h-[736px]" type="always">
          <div className="flex">
            {/* Hours column */}
            <motion.div className="relative w-18" variants={staggerContainer}>
              {hours.map((hour, index) => (
                <motion.div
                  key={hour}
                  className="relative"
                  style={{ height: "96px" }}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                >
                  <div className="absolute -top-3 right-2 flex h-6 items-center">
                    {index !== 0 && (
                      <span className="text-xs text-t-quaternary">
                        {format(
                          new Date().setHours(hour, 0, 0, 0),
                          use24HourFormat ? "HH:00" : "h a"
                        )}
                      </span>
                    )}
                  </div>
                </motion.div>
              ))}
            </motion.div>

            {/* Week grid */}
            <motion.div
              className="relative flex-1 border-l"
              variants={staggerContainer}
            >
              <div className="grid grid-cols-7 divide-x">
                {weekDays.map((day, dayIndex) => {
                  const dayEvents = singleDayEvents.filter(
                    (event) =>
                      isSameDay(event.startDate, day) ||
                      isSameDay(event.endDate, day)
                  );
                  const groupedEvents = groupEvents(dayEvents);

                  return (
                    <motion.div
                      key={dayIndex}
                      className="relative"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                    >
                      {hours.map((hour, index) => (
                        <motion.div
                          key={hour}
                          className="relative"
                          style={{ height: "96px" }}
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                        >
                          {index !== 0 && (
                            <div className="pointer-events-none absolute inset-x-0 top-0 border-b"></div>
                          )}

                          <DroppableArea
                            date={day}
                            hour={hour}
                            minute={0}
                            className="absolute inset-x-0 top-0  h-[48px]"
                          >
                            <AddEditAppointmentDialog startDate={day}>
                              <div
                                className={`absolute inset-0 cursor-pointer transition-colors hover:bg-secondary ${
                                  isTimeSlotAvailable(day, hour, 0)
                                    ? "bg-green-50/30 dark:bg-green-950/20 hover:bg-green-100/50 dark:hover:bg-green-900/30"
                                    : ""
                                }`}
                              />
                            </AddEditAppointmentDialog>
                          </DroppableArea>

                          <div className="pointer-events-none absolute inset-x-0 top-1/2 border-b border-dashed border-b-tertiary"></div>

                          <DroppableArea
                            date={day}
                            hour={hour}
                            minute={30}
                            className="absolute inset-x-0 bottom-0 h-[48px]"
                          >
                            <AddEditAppointmentDialog startDate={day}>
                              <div
                                className={`absolute inset-0 cursor-pointer transition-colors hover:bg-secondary ${
                                  isTimeSlotAvailable(day, hour, 30)
                                    ? "bg-green-50/30 dark:bg-green-950/20 hover:bg-green-100/50 dark:hover:bg-green-900/30"
                                    : ""
                                }`}
                              />
                            </AddEditAppointmentDialog>
                          </DroppableArea>
                        </motion.div>
                      ))}

                      <RenderGroupedEvents
                        groupedEvents={groupedEvents}
                        day={day}
                      />
                    </motion.div>
                  );
                })}
              </div>

              <CalendarTimeline />
            </motion.div>
          </div>
        </ScrollArea>
      </motion.div>
    </motion.div>
  );
}
