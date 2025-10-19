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

interface AvailabilityPeriod {
  startTime: string | null;
  endTime: string | null;
}

interface DayAvailability {
  date: string;
  available: boolean;
  timeSlots: string[];
  availabilityPeriods?: AvailabilityPeriod[];
}

interface WeekAvailability {
  [dateStr: string]: DayAvailability;
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
  const [weekAvailability, setWeekAvailability] =
    React.useState<WeekAvailability>({});
  const [prefetchLoading, setPrefetchLoading] = React.useState(true);
  const [bookedSlots, setBookedSlots] = React.useState<Set<string>>(new Set());

  // Helper function to format date to local date string (YYYY-MM-DD) without timezone issues
  const formatDateToLocal = (date: Date): string => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  };

  // Fetch 3 months of availability data in a single API call (default behavior)
  const prefetchAvailability = React.useCallback(async () => {
    setPrefetchLoading(true);
    try {
      console.log(
        "Fetching 3 months of availability data in a single API call..."
      );

      const response = await fetch("/api/availability");

      if (!response.ok) {
        throw new Error(`Failed to fetch availability: ${response.status}`);
      }

      const allAvailabilityData = await response.json();

      // Process the response into our WeekAvailability format
      const weekAvailabilityData: WeekAvailability = {};

      if (Array.isArray(allAvailabilityData)) {
        allAvailabilityData.forEach(
          (dayData: DayAvailability & { weekday: number }) => {
            weekAvailabilityData[dayData.date] = dayData;
          }
        );
      }

      setWeekAvailability(weekAvailabilityData);
      console.log(
        `Successfully prefetched availability for ${Object.keys(weekAvailabilityData).length} days with a single API call`
      );
    } catch (error) {
      console.error("Error prefetching availability:", error);
      // Set empty availability if API fails
      setWeekAvailability({});
    } finally {
      setPrefetchLoading(false);
    }
  }, []);

  // Get availability for the selected date from prefetched data only
  const getAvailability = React.useCallback(
    (selectedDate: Date) => {
      if (!selectedDate) {
        setAvailability(null);
        return;
      }

      const dateStr = formatDateToLocal(selectedDate);
      const dayAvailability = weekAvailability[dateStr];

      if (dayAvailability) {
        setAvailability(dayAvailability);
      } else {
        // If date is not in prefetched data, assume not available
        setAvailability({
          date: dateStr,
          available: false,
          timeSlots: [],
        });
      }
    },
    [weekAvailability]
  );

  // Check if a date should be disabled
  const isDateDisabled = React.useCallback(
    (date: Date) => {
      // Disable past dates
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      if (date < today) return true;

      // If still loading prefetch data, don't disable any dates
      if (prefetchLoading) return false;

      // Check against prefetched availability data
      const dateStr = formatDateToLocal(date);
      const dayAvailability = weekAvailability[dateStr];

      // If we have prefetched data and the day is not available, disable it
      if (dayAvailability && !dayAvailability.available) return true;

      // If we have prefetched data and the day is available, don't disable
      if (dayAvailability && dayAvailability.available) return false;

      // If we don't have data for this date in our prefetched range, disable it
      // This prevents users from selecting dates too far in the future
      return true;
    },
    [weekAvailability, prefetchLoading]
  );

  // Handle date selection
  const handleDateSelect = (newDate: Date | undefined) => {
    setDate(newDate);
    setSelectedTimeSlot(null);
    if (newDate) {
      getAvailability(newDate);
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

  // Effect to prefetch availability data on component mount
  React.useEffect(() => {
    prefetchAvailability();
  }, [prefetchAvailability]);

  // Effect to update availability when prefetch completes and a date is selected
  React.useEffect(() => {
    if (!prefetchLoading && date) {
      getAvailability(date);
    }
  }, [prefetchLoading, date, getAvailability]);

  // Generate available time slots
  const availableTimeSlots: TimeSlot[] = React.useMemo(() => {
    if (!availability || !availability.available) return [];

    return availability.timeSlots.map((time) => ({
      time,
      available: !bookedSlots.has(time),
    }));
  }, [availability, bookedSlots]);

  return (
    <Card className="gap-0 p-0 w-max">
      <CardContent className="relative p-0 lg:pr-48">
        <div className="p-6">
          <Calendar
            mode="single"
            selected={date}
            onSelect={handleDateSelect}
            disabled={isDateDisabled}
            showOutsideDays={false}
            weekStartsOn={1} // Monday = 1, Sunday = 0
            numberOfMonths={2}
            className="bg-transparent p-0 [--cell-size:--spacing(10)] md:[--cell-size:--spacing(12)]"
            formatters={{
              formatWeekdayName: (date) => {
                return date.toLocaleString("fr-FR", { weekday: "short" });
              },
            }}
          />
        </div>

        <div className="no-scrollbar inset-y-0 right-0 flex max-h-72 w-full scroll-pb-6 flex-col gap-4 overflow-y-auto border-t p-6 lg:absolute lg:max-h-none lg:w-48 lg:border-t-0 lg:border-l">
          {prefetchLoading ? (
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <Loader2 className="h-6 w-6 animate-spin mb-2" />
              <p className="text-sm text-gray-500">
                Chargement des disponibilités...
              </p>
            </div>
          ) : date && availability ? (
            availability.available ? (
              <div className="grid gap-2">
                <div className="mb-3">
                  <h3 className="text-sm font-medium text-gray-700 mb-1">
                    Créneaux disponibles
                  </h3>
                </div>
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
                      {(() => {
                        const [hours, minutes] = time.split(":").map(Number);
                        const endHours = hours + 1;
                        const endTime = `${endHours.toString().padStart(2, "0")}:${minutes.toString().padStart(2, "0")}`;
                        return `${time} - ${endTime}`;
                      })()}
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
              de{" "}
              <span className="font-medium">
                {(() => {
                  const [hours, minutes] = selectedTimeSlot
                    .split(":")
                    .map(Number);
                  const endHours = hours + 1;
                  const endTime = `${endHours.toString().padStart(2, "0")}:${minutes.toString().padStart(2, "0")}`;
                  return `${selectedTimeSlot} à ${endTime}`;
                })()}
              </span>
              .
            </>
          ) : (
            <>Sélectionnez une date et un créneau horaire.</>
          )}
        </div>
      </CardFooter>
    </Card>
  );
}
