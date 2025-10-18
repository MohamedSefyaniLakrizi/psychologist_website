import { getYear, isSameDay, isSameMonth } from "date-fns";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { staggerContainer } from "@/app/components/calendar/animations";
import { useCalendar } from "@/app/components/calendar/contexts/calendar-context";
import { EventListDialog } from "@/app/components/calendar/dialogs/events-list-dialog";
import {
  getCalendarCells,
  getAppointmentVariant,
} from "@/app/components/calendar/helpers";
import type { IEvent } from "@/app/components/calendar/interfaces";
import { EventStatusBadge } from "@/app/components/calendar/views/month-view/event-status-badge";

interface IProps {
  singleDayEvents: IEvent[];
  multiDayEvents: IEvent[];
}

const MONTHS = [
  "Janvier",
  "Février",
  "Mars",
  "Avril",
  "Mai",
  "Juin",
  "Juillet",
  "Août",
  "Septembre",
  "Octobre",
  "Novembre",
  "Décembre",
];

const WEEKDAYS = ["Dim", "Lun", "Mar", "Mer", "Jeu", "Ven", "Sam"];

export function CalendarYearView({ singleDayEvents, multiDayEvents }: IProps) {
  const { selectedDate, setSelectedDate } = useCalendar();
  const currentYear = getYear(selectedDate);
  const allEvents = [...multiDayEvents, ...singleDayEvents];

  return (
    <div className="flex flex-col h-full  overflow-y-auto p-4  sm:p-6">
      {/* Year grid */}
      <motion.div
        initial="initial"
        animate="animate"
        variants={staggerContainer}
        className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 auto-rows-fr"
      >
        {MONTHS.map((month, monthIndex) => {
          const monthDate = new Date(currentYear, monthIndex, 1);
          const cells = getCalendarCells(monthDate);

          return (
            <motion.div
              key={month}
              className="flex flex-col border border-border rounded-lg shadow-sm overflow-hidden"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              role="region"
              aria-label={`${month} ${currentYear} calendar`}
            >
              {/* Month header */}
              <div
                className="px-3 py-2 text-center font-semibold text-sm sm:text-base cursor-pointer hover:bg-primary/20 transition-colors"
                onClick={() =>
                  setSelectedDate(new Date(currentYear, monthIndex, 1))
                }
                role="button"
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    setSelectedDate(new Date(currentYear, monthIndex, 1));
                  }
                }}
                aria-label={`Select ${month}`}
              >
                {month}
              </div>

              <div className="grid grid-cols-7 text-center text-xs font-medium text-muted-foreground py-2">
                {WEEKDAYS.map((day) => (
                  <div key={day} className="p-1">
                    {day}
                  </div>
                ))}
              </div>

              <div className="grid grid-cols-7 gap-0.5 p-1.5 flex-grow text-xs">
                {cells.map((cell) => {
                  const isCurrentMonth = isSameMonth(cell.date, monthDate);
                  const isToday = isSameDay(cell.date, new Date());
                  const dayEvents = allEvents.filter((event) =>
                    isSameDay(new Date(event.startDate), cell.date)
                  );
                  const hasEvents = dayEvents.length > 0;

                  return (
                    <div
                      key={cell.date.toISOString()}
                      className={cn(
                        "flex flex-col items-center justify-start p-1 min-h-[2rem] relative",
                        !isCurrentMonth && "text-muted-foreground/40",
                        hasEvents && isCurrentMonth
                          ? "cursor-pointer hover:bg-accent/20 hover:rounded-md"
                          : "cursor-default"
                      )}
                    >
                      {isCurrentMonth && hasEvents ? (
                        <EventListDialog date={cell.date} events={dayEvents}>
                          <div className="w-full h-full flex flex-col items-center justify-start gap-0.5">
                            <span
                              className={cn(
                                "size-5 flex items-center justify-center font-medium",
                                isToday &&
                                  "rounded-full bg-primary text-primary-foreground"
                              )}
                            >
                              {cell.day}
                            </span>
                            <div className="flex flex-col justify-center items-center gap-0.5">
                              {dayEvents.length <= 2 ? (
                                dayEvents
                                  .slice(0, 2)
                                  .map((event) => (
                                    <EventStatusBadge
                                      key={event.id}
                                      status={event.status}
                                      paid={event.paid}
                                      color={getAppointmentVariant(
                                        event.status,
                                        event.paid
                                      )}
                                      size="xs"
                                      showPayment={false}
                                      className="min-w-0 max-w-full"
                                    />
                                  ))
                              ) : (
                                <div className="flex flex-col justify-center items-center gap-0.5">
                                  <EventStatusBadge
                                    status={dayEvents[0].status}
                                    paid={dayEvents[0].paid}
                                    color={getAppointmentVariant(
                                      dayEvents[0].status,
                                      dayEvents[0].paid
                                    )}
                                    size="xs"
                                    showPayment={false}
                                    className="min-w-0 max-w-full"
                                  />
                                  <span className="text-[0.5rem] text-muted-foreground">
                                    +{dayEvents.length - 1}
                                  </span>
                                </div>
                              )}
                            </div>
                          </div>
                        </EventListDialog>
                      ) : (
                        <div className="w-full h-full flex flex-col items-center justify-start">
                          <span
                            className={cn(
                              "size-5 flex items-center justify-center font-medium"
                            )}
                          >
                            {cell.day}
                          </span>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </motion.div>
          );
        })}
      </motion.div>
    </div>
  );
}
