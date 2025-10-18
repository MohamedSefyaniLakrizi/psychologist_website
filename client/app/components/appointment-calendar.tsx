"use client";

import * as React from "react";
import { Button } from "@/app/components/ui/button";
import { Calendar } from "@/app/components/ui/calendar";
import { Card, CardContent, CardFooter } from "@/app/components/ui/card";
import { Loader2 } from "lucide-react";

interface TimeSlot {
  time: string;
  available: boolean;
}

interface DayAvailability {
  date: string;
  available: boolean;
  timeSlots: string[];
}

interface AppointmentCalendarProps {
  onDateTimeSelect: (date: Date, time: string) => void;
  selectedDate?: Date;
  selectedTime?: string;
}

export default function AppointmentCalendar({
  onDateTimeSelect,
  selectedDate,
  selectedTime,
}: AppointmentCalendarProps) {
  const [date, setDate] = React.useState<Date | undefined>(selectedDate);
  const [selectedTimeSlot, setSelectedTimeSlot] = React.useState<string | null>(
    selectedTime || null
  );
  const [availability, setAvailability] =
    React.useState<DayAvailability | null>(null);
  const [loading, setLoading] = React.useState(false);
  const [bookedSlots, setBookedSlots] = React.useState<Set<string>>(new Set());

  // Fetch availability for the selected date
  const fetchAvailability = React.useCallback(async (selectedDate: Date) => {
    if (!selectedDate) return;

    setLoading(true);
    try {
      const dateStr = selectedDate.toISOString().split("T")[0];
      const response = await fetch(`/api/availability?date=${dateStr}`);

      if (!response.ok) {
        throw new Error("Failed to fetch availability");
      }

      const data = await response.json();
      setAvailability(data);

      // TODO: Fetch booked appointments for this date
      // For now, simulate some booked slots
      const mockBookedSlots = new Set(["14:00", "15:00"]); // Mock booked times
      setBookedSlots(mockBookedSlots);
    } catch (error) {
      console.error("Error fetching availability:", error);
      setAvailability(null);
    } finally {
      setLoading(false);
    }
  }, []);

  // Check if a date should be disabled
  const isDateDisabled = React.useCallback((date: Date) => {
    // Disable past dates
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    if (date < today) return true;

    // Disable weekends (Saturday = 6, Sunday = 0)
    const dayOfWeek = date.getDay();
    if (dayOfWeek === 0 || dayOfWeek === 6) return true;

    // TODO: Check against database availability
    // For now, we'll let the API call determine availability
    return false;
  }, []);

  // Handle date selection
  const handleDateSelect = (newDate: Date | undefined) => {
    setDate(newDate);
    setSelectedTimeSlot(null);
    if (newDate) {
      fetchAvailability(newDate);
    } else {
      setAvailability(null);
    }
  };

  // Handle time selection
  const handleTimeSelect = (time: string) => {
    setSelectedTimeSlot(time);
    if (date) {
      onDateTimeSelect(date, time);
    }
  };

  // Generate available time slots
  const availableTimeSlots: TimeSlot[] = React.useMemo(() => {
    if (!availability || !availability.available) return [];

    return availability.timeSlots.map((time) => ({
      time,
      available: !bookedSlots.has(time),
    }));
  }, [availability, bookedSlots]);

  return (
    <Card className="gap-0 p-0">
      <CardContent className="relative p-0 md:pr-48">
        <div className="p-6">
          <Calendar
            mode="single"
            selected={date}
            onSelect={handleDateSelect}
            disabled={isDateDisabled}
            showOutsideDays={false}
            className="bg-transparent p-0 [--cell-size:--spacing(10)] md:[--cell-size:--spacing(12)]"
            formatters={{
              formatWeekdayName: (date) => {
                return date.toLocaleString("fr-FR", { weekday: "short" });
              },
            }}
          />
        </div>

        <div className="no-scrollbar inset-y-0 right-0 flex max-h-72 w-full scroll-pb-6 flex-col gap-4 overflow-y-auto border-t p-6 md:absolute md:max-h-none md:w-48 md:border-t-0 md:border-l">
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin" />
            </div>
          ) : date && availability ? (
            availability.available ? (
              <div className="grid gap-2">
                <h3 className="text-sm font-medium text-gray-700 mb-2">
                  Créneaux disponibles
                </h3>
                {availableTimeSlots.length > 0 ? (
                  availableTimeSlots.map(({ time, available }) => (
                    <Button
                      key={time}
                      variant={
                        selectedTimeSlot === time ? "default" : "outline"
                      }
                      onClick={() => available && handleTimeSelect(time)}
                      disabled={!available}
                      className={`w-full shadow-none ${
                        !available ? "opacity-50 cursor-not-allowed" : ""
                      }`}
                    >
                      {time}
                      {!available && (
                        <span className="ml-2 text-xs">(Réservé)</span>
                      )}
                    </Button>
                  ))
                ) : (
                  <p className="text-sm text-gray-500 text-center py-4">
                    Aucun créneau disponible
                  </p>
                )}
              </div>
            ) : (
              <p className="text-sm text-gray-500 text-center py-4">
                Pas de consultation ce jour
              </p>
            )
          ) : date ? (
            <p className="text-sm text-gray-500 text-center py-4">
              Chargement des créneaux...
            </p>
          ) : (
            <p className="text-sm text-gray-500 text-center py-4">
              Sélectionnez une date
            </p>
          )}
        </div>
      </CardContent>

      <CardFooter className="flex flex-col gap-4 border-t px-6 !py-5 md:flex-row">
        <div className="text-sm">
          {date && selectedTimeSlot ? (
            <>
              Votre rendez-vous est prévu le{" "}
              <span className="font-medium">
                {date?.toLocaleDateString("fr-FR", {
                  weekday: "long",
                  day: "numeric",
                  month: "long",
                  year: "numeric",
                })}
              </span>{" "}
              à <span className="font-medium">{selectedTimeSlot}</span>.
            </>
          ) : (
            <>Sélectionnez une date et un créneau horaire.</>
          )}
        </div>
      </CardFooter>
    </Card>
  );
}
