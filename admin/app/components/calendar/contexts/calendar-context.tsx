"use client";

import type React from "react";
import { createContext, useContext, useState } from "react";
import { useLocalStorage } from "@/app/components/calendar/hooks";
import type { IEvent, IUser } from "@/app/components/calendar/interfaces";
import type { TCalendarView } from "@/app/components/calendar/types";
import {
  createAppointment,
  updateAppointment,
  deleteAppointment,
  getAppointments,
} from "@/lib/actions/appointments";

interface ICalendarContext {
  selectedDate: Date;
  view: TCalendarView;
  setView: (view: TCalendarView) => void;
  agendaModeGroupBy: "date" | "color";
  setAgendaModeGroupBy: (groupBy: "date" | "color") => void;
  use24HourFormat: boolean;
  toggleTimeFormat: () => void;
  setSelectedDate: (date: Date | undefined) => void;
  selectedUserId: IUser["id"] | "all";
  setSelectedUserId: (userId: IUser["id"] | "all") => void;
  badgeVariant: "dot" | "colored";
  setBadgeVariant: (variant: "dot" | "colored") => void;
  selectedFormats: ("ONLINE" | "FACE_TO_FACE")[];
  filterEventsBySelectedFormats: (format: "ONLINE" | "FACE_TO_FACE") => void;
  filterEventsBySelectedUser: (userId: IUser["id"] | "all") => void;
  users: IUser[];
  events: IEvent[];
  weeklyAvailability: any[];
  dateAvailability: any[];
  getAvailabilityForDate: (
    date: Date
  ) => { startTime: string; endTime: string }[];
  addEvent: (appointmentData: {
    clientId: string;
    startTime: Date;
    endTime: Date;
    rate: number;
    format: "ONLINE" | "FACE_TO_FACE";
    isRecurring?: boolean;
    recurringType?: "WEEKLY" | "BIWEEKLY" | "MONTHLY";
    recurringEndDate?: Date;
  }) => Promise<void>;
  updateEvent: (
    id: string,
    data: Partial<{
      startTime: Date;
      endTime: Date;
      format: "ONLINE" | "FACE_TO_FACE";
      isCompleted: boolean;
      timeDifferences?: {
        startTimeDiff: number;
        endTimeDiff: number;
      };
      dayDifference?: number;
    }>,
    editMode?: "single" | "series"
  ) => Promise<void>;
  removeEvent: (
    eventId: string,
    deleteMode?: "single" | "series"
  ) => Promise<void>;
  refreshEvents: () => Promise<void>;
  clearFilter: () => void;
  isLoading: boolean;
  error: string | null;
}

interface CalendarSettings {
  badgeVariant: "dot" | "colored";
  view: TCalendarView;
  use24HourFormat: boolean;
  agendaModeGroupBy: "date" | "color";
}

const DEFAULT_SETTINGS: CalendarSettings = {
  badgeVariant: "colored",
  view: "day",
  use24HourFormat: true,
  agendaModeGroupBy: "date",
};

const CalendarContext = createContext({} as ICalendarContext);

export function CalendarProvider({
  children,
  users,
  events,
  weeklyAvailability = [],
  dateAvailability = [],
  badge = "colored",
  view = "day",
}: {
  children: React.ReactNode;
  users: IUser[];
  events: IEvent[];
  weeklyAvailability?: any[];
  dateAvailability?: any[];
  view?: TCalendarView;
  badge?: "dot" | "colored";
}) {
  const [settings, setSettings] = useLocalStorage<CalendarSettings>(
    "calendar-settings",
    {
      ...DEFAULT_SETTINGS,
      badgeVariant: badge,
      view: view,
    }
  );

  const [badgeVariant, setBadgeVariantState] = useState<"dot" | "colored">(
    settings.badgeVariant
  );
  const [currentView, setCurrentViewState] = useState<TCalendarView>(
    settings.view
  );
  const [use24HourFormat, setUse24HourFormatState] = useState<boolean>(
    settings.use24HourFormat
  );
  const [agendaModeGroupBy, setAgendaModeGroupByState] = useState<
    "date" | "color"
  >(settings.agendaModeGroupBy);

  const [selectedDate, setSelectedDate] = useState(new Date());
  const [selectedUserId, setSelectedUserId] = useState<IUser["id"] | "all">(
    "all"
  );
  const [selectedFormats, setSelectedFormats] = useState<
    ("ONLINE" | "FACE_TO_FACE")[]
  >([]);

  const [allEvents, setAllEvents] = useState<IEvent[]>(events || []);
  const [filteredEvents, setFilteredEvents] = useState<IEvent[]>(events || []);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const updateSettings = (newPartialSettings: Partial<CalendarSettings>) => {
    setSettings({
      ...settings,
      ...newPartialSettings,
    });
  };

  const setBadgeVariant = (variant: "dot" | "colored") => {
    setBadgeVariantState(variant);
    updateSettings({ badgeVariant: variant });
  };

  const setView = (newView: TCalendarView) => {
    setCurrentViewState(newView);
    updateSettings({ view: newView });
  };

  const toggleTimeFormat = () => {
    const newValue = !use24HourFormat;
    setUse24HourFormatState(newValue);
    updateSettings({ use24HourFormat: newValue });
  };

  const setAgendaModeGroupBy = (groupBy: "date" | "color") => {
    setAgendaModeGroupByState(groupBy);
    updateSettings({ agendaModeGroupBy: groupBy });
  };

  const filterEventsBySelectedFormats = (format: "ONLINE" | "FACE_TO_FACE") => {
    const isFormatSelected = selectedFormats.includes(format);
    const newFormats = isFormatSelected
      ? selectedFormats.filter((f) => f !== format)
      : [...selectedFormats, format];

    if (newFormats.length > 0) {
      const filtered = allEvents.filter((event) => {
        return newFormats.includes(event.format);
      });
      setFilteredEvents(filtered);
    } else {
      setFilteredEvents(allEvents);
    }

    setSelectedFormats(newFormats);
  };

  const filterEventsBySelectedUser = (userId: IUser["id"] | "all") => {
    setSelectedUserId(userId);
    if (userId === "all") {
      setFilteredEvents(allEvents);
    } else {
      const filtered = allEvents.filter((event) => event.user.id === userId);
      setFilteredEvents(filtered);
    }
  };

  const handleSelectDate = (date: Date | undefined) => {
    if (!date) return;
    setSelectedDate(date);
  };

  const addEvent = async (appointmentData: {
    clientId: string;
    startTime: Date;
    endTime: Date;
    rate: number;
    format: "ONLINE" | "FACE_TO_FACE";
    isRecurring?: boolean;
    recurringType?: "WEEKLY" | "BIWEEKLY" | "MONTHLY";
    recurringEndDate?: Date;
  }) => {
    console.log("📝 CalendarContext.addEvent called with:", {
      ...appointmentData,
      startTime: appointmentData.startTime.toString(),
      endTime: appointmentData.endTime.toString(),
      recurringEndDate: appointmentData.recurringEndDate?.toString(),
    });

    setIsLoading(true);
    setError(null);
    try {
      console.log("📞 Calling createAppointment server action...");
      const newEvent = await createAppointment(appointmentData);
      console.log("✅ CreateAppointment server action completed:", {
        id: newEvent.id,
        title: newEvent.title,
        isRecurring: newEvent.isRecurring,
      });

      if (appointmentData.isRecurring) {
        console.log(
          "🔄 Recurring appointment created - refreshing all events from server"
        );
        // For recurring appointments, refresh all events from the server
        // to ensure all newly created recurring appointments appear in the calendar
        const refreshedEvents = await getAppointments();
        console.log("📊 Refreshed events count:", refreshedEvents.length);
        setAllEvents(refreshedEvents);
        setFilteredEvents(refreshedEvents);
      } else {
        console.log("📝 Single appointment - updating local state");
        // For single appointments, just add the new event to the current state
        setAllEvents((prev) => [...prev, newEvent]);
        setFilteredEvents((prev) => [...prev, newEvent]);
      }
      console.log("✅ Event creation completed successfully");
    } catch (err) {
      console.error("❌ Error in CalendarContext.addEvent:", err);
      console.error("❌ Error details:", {
        message: (err as Error).message,
        stack: (err as Error).stack,
      });
      setError("Échec de la création du rendez-vous");
      console.error("Error creating appointment:", err);
    } finally {
      console.log("🏁 Setting loading to false");
      setIsLoading(false);
    }
  };

  const updateEvent = async (
    id: string,
    data: Partial<{
      startTime: Date;
      endTime: Date;
      format: "ONLINE" | "FACE_TO_FACE";
      isCompleted: boolean;
      timeDifferences?: {
        startTimeDiff: number;
        endTimeDiff: number;
      };
      dayDifference?: number;
    }>,
    editMode: "single" | "series" = "single"
  ) => {
    console.log("🔄 CalendarContext.updateEvent called with:", {
      id,
      data: {
        ...data,
        startTime: data.startTime?.toString(),
        endTime: data.endTime?.toString(),
      },
      editMode,
    });

    setIsLoading(true);
    setError(null);
    try {
      console.log("📞 Calling updateAppointment server action...");
      const updatedEvent = await updateAppointment(id, data, editMode);
      console.log("✅ UpdateAppointment server action completed:", {
        id: updatedEvent.id,
        title: updatedEvent.title,
      });

      if (editMode === "series") {
        console.log("🔄 Series update - refreshing all events from server");
        // For series updates, we need to refresh all events from the server
        // This is a simplified approach - in a real app you might want to
        // implement a more efficient way to reload events
        const refreshedEvents = await getAppointments();
        console.log("📊 Refreshed events count:", refreshedEvents.length);
        setAllEvents(refreshedEvents);
        setFilteredEvents(refreshedEvents);
      } else {
        console.log("📝 Single update - updating local state");
        // Update only the single event
        setAllEvents((prev) => {
          const updated = prev.map((e) => (e.id === id ? updatedEvent : e));
          console.log("📊 Updated allEvents count:", updated.length);
          return updated;
        });
        setFilteredEvents((prev) => {
          const updated = prev.map((e) => (e.id === id ? updatedEvent : e));
          console.log("📊 Updated filteredEvents count:", updated.length);
          return updated;
        });
      }
      console.log("✅ Event update completed successfully");
    } catch (err) {
      console.error("❌ Error in CalendarContext.updateEvent:", err);
      console.error("❌ Error details:", {
        message: (err as Error).message,
        stack: (err as Error).stack,
      });
      setError("Échec de la mise à jour du rendez-vous");
      console.error("Error updating appointment:", err);
    } finally {
      console.log("🏁 Setting loading to false");
      setIsLoading(false);
    }
  };

  const removeEvent = async (
    eventId: string,
    deleteMode: "single" | "series" = "single"
  ) => {
    console.log("🗑️ CalendarContext.removeEvent called with:", {
      eventId,
      deleteMode,
    });

    setIsLoading(true);
    setError(null);
    try {
      console.log("📞 Calling deleteAppointment server action...");
      await deleteAppointment(eventId, deleteMode);
      console.log("✅ DeleteAppointment server action completed");

      if (deleteMode === "series") {
        console.log("🔄 Series deletion - refreshing all events from server");
        // For series deletion, refresh all events from the server
        const refreshedEvents = await getAppointments();
        console.log("📊 Refreshed events count:", refreshedEvents.length);
        setAllEvents(refreshedEvents);
        setFilteredEvents(refreshedEvents);
      } else {
        console.log("📝 Single deletion - updating local state");
        // For single appointment deletion, just remove from current state
        setAllEvents((prev) => prev.filter((e) => e.id !== eventId));
        setFilteredEvents((prev) => prev.filter((e) => e.id !== eventId));
      }
      console.log("✅ Event deletion completed successfully");
    } catch (err) {
      console.error("❌ Error in CalendarContext.removeEvent:", err);
      console.error("❌ Error details:", {
        message: (err as Error).message,
        stack: (err as Error).stack,
      });
      setError("Échec de la suppression du rendez-vous");
      console.error("Error deleting appointment:", err);
    } finally {
      console.log("🏁 Setting loading to false");
      setIsLoading(false);
    }
  };

  const refreshEvents = async () => {
    setIsLoading(true);
    try {
      console.log("🔄 Refreshing all events from server");
      const refreshedEvents = await getAppointments();
      console.log("📊 Refreshed events count:", refreshedEvents.length);
      setAllEvents(refreshedEvents);
      setFilteredEvents(refreshedEvents);
    } catch (err) {
      console.error("❌ Error refreshing events:", err);
      setError("Échec du rafraîchissement des rendez-vous");
    } finally {
      setIsLoading(false);
    }
  };

  const clearFilter = () => {
    setFilteredEvents(allEvents);
    setSelectedFormats([]);
    setSelectedUserId("all");
  };

  // Get availability for a specific date
  const getAvailabilityForDate = (date: Date) => {
    const dateStr = new Date(date);
    dateStr.setHours(0, 0, 0, 0);

    // Check for date-specific availability first
    const dateOverrides = dateAvailability.filter((d) => {
      const availDate = new Date(d.date);
      availDate.setHours(0, 0, 0, 0);
      return availDate.getTime() === dateStr.getTime();
    });

    if (dateOverrides.length > 0) {
      // Has specific override
      const hasClosedMarker = dateOverrides.some(
        (slot) => slot.startTime === null && slot.endTime === null
      );

      if (hasClosedMarker) {
        return []; // Closed day
      }

      return dateOverrides
        .filter((slot) => slot.startTime && slot.endTime)
        .map((slot) => ({
          startTime: slot.startTime,
          endTime: slot.endTime,
        }));
    }

    // Fall back to weekly template
    const dayOfWeek = (date.getDay() + 6) % 7; // Convert Sunday=0 to Monday=0
    const weeklySlots = weeklyAvailability.filter(
      (w) => w.weekday === dayOfWeek
    );

    return weeklySlots.map((slot) => ({
      startTime: slot.startTime,
      endTime: slot.endTime,
    }));
  };

  const value = {
    selectedDate,
    setSelectedDate: handleSelectDate,
    selectedUserId,
    setSelectedUserId,
    badgeVariant,
    setBadgeVariant,
    users,
    selectedFormats,
    filterEventsBySelectedFormats,
    filterEventsBySelectedUser,
    events: filteredEvents,
    weeklyAvailability,
    dateAvailability,
    getAvailabilityForDate,
    view: currentView,
    use24HourFormat,
    toggleTimeFormat,
    setView,
    agendaModeGroupBy,
    setAgendaModeGroupBy,
    addEvent,
    updateEvent,
    removeEvent,
    refreshEvents,
    clearFilter,
    isLoading,
    error,
  };

  return (
    <CalendarContext.Provider value={value}>
      {children}
    </CalendarContext.Provider>
  );
}

export function useCalendar(): ICalendarContext {
  const context = useContext(CalendarContext);
  if (!context)
    throw new Error("useCalendar must be used within a CalendarProvider.");
  return context;
}
