import { format } from "date-fns";
import type { FC } from "react";
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@/app/components/ui/avatar";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/app/components/ui/command";
import { cn } from "@/lib/utils";
import { useCalendar } from "@/app/components/calendar/contexts/calendar-context";
import { EventDetailsDialog } from "@/app/components/calendar/dialogs/event-details-dialog";
import {
  formatTime,
  getColorClass,
  getEventsForMonth,
  getFirstLetters,
  toCapitalize,
  getAppointmentVariant,
  getAppointmentBgClasses,
} from "@/app/components/calendar/helpers";
import { EventStatusBadge } from "@/app/components/calendar/views/month-view/event-status-badge";

export const AgendaEvents: FC = () => {
  const {
    events,
    use24HourFormat,
    badgeVariant,
    agendaModeGroupBy,
    selectedDate,
  } = useCalendar();

  const monthEvents = getEventsForMonth(events, selectedDate);

  const agendaEvents = Object.groupBy(monthEvents, (event) => {
    return agendaModeGroupBy === "date"
      ? format(event.startDate, "yyyy-MM-dd")
      : getAppointmentVariant(event.status, event.paid);
  });

  const groupedAndSortedEvents = Object.entries(agendaEvents).sort(
    (a, b) => new Date(a[0]).getTime() - new Date(b[0]).getTime()
  );

  return (
    <Command className="py-4 h-[80vh] bg-transparent">
      <div className="mb-4 mx-4">
        <CommandInput placeholder="Rechercher un rendez-vous..." />
      </div>
      <CommandList className="max-h-max px-3 border-t">
        {groupedAndSortedEvents.map(([date, groupedEvents]) => (
          <CommandGroup
            key={date}
            heading={
              agendaModeGroupBy === "date"
                ? format(new Date(date), "EEEE, MMMM d, yyyy")
                : toCapitalize(
                    getAppointmentVariant(
                      groupedEvents![0].status,
                      groupedEvents![0].paid
                    )
                  )
            }
          >
            {groupedEvents!.map((event) => (
              <CommandItem
                key={event.id}
                className={cn(
                  "mb-2 p-4 border rounded-md data-[selected=true]:bg-bg transition-all data-[selected=true]:text-none hover:cursor-pointer",
                  {
                    [getColorClass(
                      getAppointmentVariant(event.status, event.paid)
                    )]: badgeVariant === "colored",
                    "hover:bg-zinc-200 dark:hover:bg-gray-900":
                      badgeVariant === "dot",
                    "hover:opacity-60": badgeVariant === "colored",
                  }
                )}
              >
                <EventDetailsDialog event={event}>
                  <div className="w-full flex items-center justify-between gap-4">
                    <div className="flex items-center gap-2">
                      {badgeVariant === "dot" ? (
                        <EventStatusBadge
                          status={event.status}
                          paid={event.paid}
                          color={getAppointmentVariant(
                            event.status,
                            event.paid
                          )}
                          size="sm"
                          showPayment={true}
                        />
                      ) : (
                        <Avatar>
                          <AvatarImage src="" alt="@shadcn" />
                          <AvatarFallback
                            className={getAppointmentBgClasses(event.status)}
                          >
                            {getFirstLetters(event.title)}
                          </AvatarFallback>
                        </Avatar>
                      )}
                      <div className="flex flex-col">
                        <p
                          className={cn({
                            "font-medium": badgeVariant === "dot",
                            "text-foreground": badgeVariant === "dot",
                          })}
                        >
                          {event.title}
                        </p>
                        <p className="text-muted-foreground text-sm line-clamp-1 text-ellipsis md:text-clip w-full">
                          {event.description}
                        </p>
                      </div>
                    </div>
                    <div className="w-40 flex justify-center items-center gap-1">
                      {agendaModeGroupBy === "date" ? (
                        <>
                          <p className="text-sm">
                            {formatTime(event.startDate, use24HourFormat)}
                          </p>
                          <span className="text-muted-foreground">-</span>
                          <p className="text-sm">
                            {formatTime(event.endDate, use24HourFormat)}
                          </p>
                        </>
                      ) : (
                        <>
                          <p className="text-sm">
                            {format(event.startDate, "MM/dd/yyyy")}
                          </p>
                          <span className="text-sm">at</span>
                          <p className="text-sm">
                            {formatTime(event.startDate, use24HourFormat)}
                          </p>
                        </>
                      )}
                    </div>
                  </div>
                </EventDetailsDialog>
              </CommandItem>
            ))}
          </CommandGroup>
        ))}
        <CommandEmpty>No results found.</CommandEmpty>
      </CommandList>
    </Command>
  );
};
