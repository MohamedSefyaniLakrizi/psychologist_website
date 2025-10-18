import { format } from "date-fns";
import { fr } from "date-fns/locale";
import type { ReactNode } from "react";
import {
  Modal,
  ModalContent,
  ModalHeader,
  ModalTitle,
  ModalTrigger,
} from "@/app/components/ui/responsive-modal";
import { cn } from "@/lib/utils";
import { useCalendar } from "@/app/components/calendar/contexts/calendar-context";
import {
  formatTime,
  getAppointmentVariant,
} from "@/app/components/calendar/helpers";
import type { IEvent } from "@/app/components/calendar/interfaces";
import { dayCellVariants } from "@/app/components/calendar/views/month-view/day-cell";
import { EventStatusBadge } from "@/app/components/calendar/views/month-view/event-status-badge";
import { EventDetailsDialog } from "@/app/components/calendar/dialogs/event-details-dialog";

interface EventListDialogProps {
  date: Date;
  events: IEvent[];
  maxVisibleEvents?: number;
  children?: ReactNode;
}

export function EventListDialog({
  date,
  events,
  maxVisibleEvents = 1,
  children,
}: EventListDialogProps) {
  const cellEvents = [...events].sort(
    (a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime()
  );
  const hiddenEventsCount = Math.max(cellEvents.length - maxVisibleEvents, 0);
  const { badgeVariant, use24HourFormat } = useCalendar();

  const defaultTrigger = (
    <span className="cursor-pointer">
      <span className="sm:hidden">+{hiddenEventsCount}</span>
      <span className="hidden sm:inline py-0.5 px-2 my-1 rounded-xl border">
        {hiddenEventsCount}
        <span className="mx-1">autres...</span>
      </span>
    </span>
  );

  return (
    <Modal>
      <ModalTrigger asChild>{children || defaultTrigger}</ModalTrigger>
      <ModalContent className="sm:max-w-[425px]">
        <ModalHeader>
          <ModalTitle className="my-2">
            <div className="flex items-center gap-2">
              <EventStatusBadge
                status={cellEvents[0]?.status}
                paid={cellEvents[0]?.paid}
                color={getAppointmentVariant(
                  cellEvents[0]?.status,
                  cellEvents[0]?.paid
                )}
                size="sm"
                showPayment={false}
              />
              <p className="text-sm font-medium">
                Rendez-vous du{" "}
                {format(date, "EEEE d MMMM yyyy", { locale: fr })}
              </p>
            </div>
          </ModalTitle>
        </ModalHeader>
        <div className="max-h-[60vh] overflow-y-auto space-y-2">
          {cellEvents.length > 0 ? (
            cellEvents.map((event) => (
              <EventDetailsDialog event={event} key={event.id}>
                <div
                  className={cn(
                    "flex items-center gap-2 p-2 border rounded-md hover:bg-muted cursor-pointer",
                    {
                      [dayCellVariants({
                        color: getAppointmentVariant(event.status, event.paid),
                      })]: badgeVariant === "colored",
                    }
                  )}
                >
                  <EventStatusBadge
                    status={event.status}
                    paid={event.paid}
                    color={getAppointmentVariant(event.status, event.paid)}
                    size="sm"
                    showPayment={true}
                  />
                  <div className="flex justify-between items-center w-full">
                    <p className="text-sm font-medium">{event.title}</p>
                    <p className="text-xs">
                      {formatTime(event.startDate, use24HourFormat)} -{" "}
                      {formatTime(event.endDate, use24HourFormat)}
                    </p>
                  </div>
                </div>
              </EventDetailsDialog>
            ))
          ) : (
            <p className="text-sm text-muted-foreground">
              Aucun rendez-vous pour cette date.
            </p>
          )}
        </div>
      </ModalContent>
    </Modal>
  );
}
