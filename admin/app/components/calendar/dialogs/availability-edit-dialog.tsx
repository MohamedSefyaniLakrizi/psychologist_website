"use client";

import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/app/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/app/components/ui/select";
import { Button } from "@/app/components/ui/button";
import { Plus, Trash2, Calendar, CalendarRange, Clock } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { useCalendar } from "@/app/components/calendar/contexts/calendar-context";

const generateTimeSlots = () => {
  const slots = [];
  for (let hour = 0; hour < 24; hour++) {
    for (let minute = 0; minute < 60; minute += 30) {
      const time = `${hour.toString().padStart(2, "0")}:${minute.toString().padStart(2, "0")}`;
      slots.push(time);
    }
  }
  return slots;
};

const TIME_SLOTS = generateTimeSlots();

interface AvailabilityEditDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  date: Date;
  selectedDates?: Date[];
  isRange?: boolean;
}

export function AvailabilityEditDialog({
  open,
  onOpenChange,
  date,
  selectedDates = [],
  isRange = false,
}: AvailabilityEditDialogProps) {
  const { getAvailabilityForDate } = useCalendar();
  const [saving, setSaving] = useState(false);
  const [dateSlots, setDateSlots] = useState<
    { startTime: string; endTime: string }[]
  >([]);

  useEffect(() => {
    if (open && !isRange) {
      // Load existing availability for single date
      const existingSlots = getAvailabilityForDate(date);
      setDateSlots(
        existingSlots.length > 0
          ? existingSlots
          : [{ startTime: "09:00", endTime: "17:00" }]
      );
    } else if (open && isRange) {
      // For range, start with default slots
      setDateSlots([{ startTime: "09:00", endTime: "17:00" }]);
    }
  }, [open, date, isRange, getAvailabilityForDate]);

  const addSlot = () => {
    setDateSlots([...dateSlots, { startTime: "09:00", endTime: "17:00" }]);
  };

  const updateSlot = (
    index: number,
    field: "startTime" | "endTime",
    value: string
  ) => {
    const newSlots = [...dateSlots];
    newSlots[index][field] = value;
    setDateSlots(newSlots);
  };

  const removeSlot = (index: number) => {
    setDateSlots(dateSlots.filter((_, i) => i !== index));
  };

  const saveAvailability = async () => {
    try {
      setSaving(true);

      // Validate slots
      for (const slot of dateSlots) {
        if (slot.startTime >= slot.endTime) {
          toast.error("L'heure de début doit être avant l'heure de fin");
          return;
        }
      }

      const datesToUpdate = isRange ? selectedDates : [date];

      if (isRange) {
        // For range update, use bulk API
        const response = await fetch("/api/availability-exceptions", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            dates: datesToUpdate.map((d) => d.toISOString()),
            slots: dateSlots,
          }),
        });

        if (!response.ok) throw new Error("Failed to save");
        toast.success(
          `Disponibilité mise à jour pour ${datesToUpdate.length} jour(s)`
        );
      } else {
        // Single date update
        const response = await fetch("/api/availability-exceptions", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            date: date.toISOString(),
            slots: dateSlots,
          }),
        });

        if (!response.ok) throw new Error("Failed to save");
        toast.success("Disponibilité mise à jour");
      }

      onOpenChange(false);
      // Trigger calendar refresh
      window.location.reload();
    } catch (error) {
      console.error("Error saving availability:", error);
      toast.error("Erreur lors de la sauvegarde");
    } finally {
      setSaving(false);
    }
  };

  const closeDay = async () => {
    try {
      setSaving(true);
      const datesToUpdate = isRange ? selectedDates : [date];

      if (isRange) {
        const response = await fetch("/api/availability-exceptions", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            dates: datesToUpdate.map((d) => d.toISOString()),
            closed: true,
          }),
        });

        if (!response.ok) throw new Error("Failed to close");
        toast.success(
          `${datesToUpdate.length} jour(s) fermé(s) - aucune disponibilité`
        );
      } else {
        const response = await fetch("/api/availability-exceptions", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            date: date.toISOString(),
            slots: [],
          }),
        });

        if (!response.ok) throw new Error("Failed to close");
        toast.success("Jour fermé - aucune disponibilité");
      }

      onOpenChange(false);
      window.location.reload();
    } catch (error) {
      console.error("Error blocking day:", error);
      toast.error("Erreur lors du blocage");
    } finally {
      setSaving(false);
    }
  };

  const resetToTemplate = async () => {
    try {
      setSaving(true);
      const datesToUpdate = isRange ? selectedDates : [date];

      // First delete any existing exceptions for these dates
      for (const dateToReset of datesToUpdate) {
        const deleteResponse = await fetch(
          `/api/availability-exceptions/${dateToReset.toISOString().split("T")[0]}`,
          {
            method: "DELETE",
          }
        );
        // Don't throw error if deletion fails (record might not exist)
      }

      // Then get the weekly template for each date and apply it
      for (const dateToReset of datesToUpdate) {
        const dayOfWeek = (dateToReset.getDay() + 6) % 7; // Convert to Monday=0 format

        // Fetch weekly availability for this day of week
        const weeklyResponse = await fetch("/api/working-hours");
        if (weeklyResponse.ok) {
          const weeklyData = await weeklyResponse.json();
          const daySlots = weeklyData.filter(
            (w: any) => w.weekday === dayOfWeek
          );

          if (daySlots.length > 0) {
            // Apply weekly template slots to this specific date
            const slotsToApply = daySlots.map((slot: any) => ({
              startTime: slot.startTime,
              endTime: slot.endTime,
            }));

            await fetch("/api/availability-exceptions", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                date: dateToReset.toISOString(),
                slots: slotsToApply,
              }),
            });
          }
          // If no weekly slots for this day, leave it unset (will fall back to weekly template)
        }
      }

      toast.success(
        isRange
          ? `Horaires par défaut appliqués à ${datesToUpdate.length} jour(s)`
          : "Horaires par défaut appliqués"
      );
      onOpenChange(false);
      window.location.reload();
    } catch (error) {
      console.error("Error resetting to template:", error);
      toast.error("Erreur lors de l'application des horaires par défaut");
    } finally {
      setSaving(false);
    }
  };

  const getDialogTitle = () => {
    if (isRange) {
      return `Modifier la disponibilité (${selectedDates.length} jours)`;
    }
    return format(date, "EEEE d MMMM yyyy", { locale: fr });
  };

  const getDialogDescription = () => {
    if (isRange) {
      return `Appliquer les mêmes horaires à ${selectedDates.length} jours sélectionnés`;
    }
    return "Personnalisez les horaires pour cette date";
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {isRange ? (
              <CalendarRange className="h-4 w-4" />
            ) : (
              <Calendar className="h-4 w-4" />
            )}
            {getDialogTitle()}
          </DialogTitle>
          <DialogDescription>{getDialogDescription()}</DialogDescription>
        </DialogHeader>

        <div className="space-y-3">
          {dateSlots.map((slot, idx) => (
            <div key={idx} className="flex items-center gap-2">
              <Select
                value={slot.startTime}
                onValueChange={(v) => updateSlot(idx, "startTime", v)}
              >
                <SelectTrigger className="flex-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {TIME_SLOTS.map((time) => (
                    <SelectItem key={time} value={time}>
                      {time}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <span>à</span>

              <Select
                value={slot.endTime}
                onValueChange={(v) => updateSlot(idx, "endTime", v)}
              >
                <SelectTrigger className="flex-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {TIME_SLOTS.map((time) => (
                    <SelectItem key={time} value={time}>
                      {time}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Button variant="ghost" size="sm" onClick={() => removeSlot(idx)}>
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          ))}

          <Button
            variant="outline"
            size="sm"
            onClick={addSlot}
            className="w-full"
          >
            <Plus className="h-4 w-4 mr-2" />
            Ajouter un créneau
          </Button>
        </div>

        <DialogFooter className="flex-col sm:flex-col gap-2">
          <div className="flex gap-2 w-full">
            <Button
              variant="outline"
              onClick={resetToTemplate}
              className="flex-1"
            >
              <Clock className="h-4 w-4 mr-1" />
              Horaires par défaut
            </Button>
            <Button
              variant="outline"
              onClick={closeDay}
              className="flex-1 border-red-200 text-red-700 hover:bg-red-50 hover:text-red-800"
            >
              Fermé le jour
            </Button>
          </div>
          <Button
            onClick={saveAvailability}
            disabled={saving}
            className="w-full"
          >
            {saving ? "Enregistrement..." : "Enregistrer"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
