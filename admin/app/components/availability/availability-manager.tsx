"use client";

import { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/app/components/ui/card";
import { Button } from "@/app/components/ui/button";
import { Badge } from "@/app/components/ui/badge";
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
import { Label } from "@/app/components/ui/label";
import {
  Clock,
  Plus,
  Trash2,
  Edit,
  ChevronLeft,
  ChevronRight,
  X,
} from "lucide-react";
import { toast } from "sonner";
import {
  format,
  addMonths,
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  isSameMonth,
  isSameDay,
  getDay,
} from "date-fns";
import { fr } from "date-fns/locale";

const WEEKDAYS = [
  { value: 0, label: "Lun", fullLabel: "Lundi" },
  { value: 1, label: "Mar", fullLabel: "Mardi" },
  { value: 2, label: "Mer", fullLabel: "Mercredi" },
  { value: 3, label: "Jeu", fullLabel: "Jeudi" },
  { value: 4, label: "Ven", fullLabel: "Vendredi" },
  { value: 5, label: "Sam", fullLabel: "Samedi" },
  { value: 6, label: "Dim", fullLabel: "Dimanche" },
];

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

interface AvailabilityManagerProps {
  onUpdate: () => void;
}

export function AvailabilityManager({ onUpdate }: AvailabilityManagerProps) {
  const [weeklyAvailability, setWeeklyAvailability] = useState<any[]>([]);
  const [dateAvailability, setDateAvailability] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Weekly template editing
  const [editingDay, setEditingDay] = useState<number | null>(null);
  const [daySlots, setDaySlots] = useState<
    { startTime: string; endTime: string }[]
  >([]);

  // Monthly calendar state
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDates, setSelectedDates] = useState<Date[]>([]);
  const [editingDate, setEditingDate] = useState<Date | null>(null);
  const [dateSlots, setDateSlots] = useState<
    { startTime: string; endTime: string }[]
  >([]);
  const [isDateDialogOpen, setIsDateDialogOpen] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [weeklyRes, dateRes] = await Promise.all([
        fetch("/api/working-hours"),
        fetch(
          `/api/availability-exceptions?startDate=${startOfMonth(currentMonth).toISOString()}&endDate=${endOfMonth(addMonths(currentMonth, 2)).toISOString()}`
        ),
      ]);

      if (weeklyRes.ok) {
        const data = await weeklyRes.json();
        setWeeklyAvailability(data);
      }

      if (dateRes.ok) {
        const data = await dateRes.json();
        setDateAvailability(data);
      }
    } catch (error) {
      console.error("Error fetching data:", error);
      toast.error("Erreur lors du chargement");
    } finally {
      setLoading(false);
    }
  };

  // ========== Weekly Template Functions ==========

  const getWeeklySlots = (weekday: number) => {
    return weeklyAvailability.filter((w) => w.weekday === weekday);
  };

  const openEditDay = (weekday: number) => {
    const slots = getWeeklySlots(weekday);
    setEditingDay(weekday);
    setDaySlots(
      slots.length > 0 ? slots : [{ startTime: "09:00", endTime: "17:00" }]
    );
  };

  const addSlotToDay = () => {
    setDaySlots([...daySlots, { startTime: "09:00", endTime: "17:00" }]);
  };

  const updateDaySlot = (
    index: number,
    field: "startTime" | "endTime",
    value: string
  ) => {
    const newSlots = [...daySlots];
    newSlots[index][field] = value;
    setDaySlots(newSlots);
  };

  const removeDaySlot = (index: number) => {
    setDaySlots(daySlots.filter((_, i) => i !== index));
  };

  const saveWeeklyTemplate = async () => {
    if (editingDay === null) return;

    try {
      setSaving(true);

      // Validate slots
      for (const slot of daySlots) {
        if (slot.startTime >= slot.endTime) {
          toast.error("L'heure de début doit être avant l'heure de fin");
          return;
        }
      }

      const response = await fetch("/api/working-hours", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(
          daySlots.map((slot) => ({
            weekday: editingDay,
            startTime: slot.startTime,
            endTime: slot.endTime,
          }))
        ),
      });

      if (!response.ok) throw new Error("Failed to save");

      toast.success("Modèle hebdomadaire mis à jour");
      setEditingDay(null);
      fetchData();
      onUpdate();
    } catch (error) {
      console.error("Error saving:", error);
      toast.error("Erreur lors de la sauvegarde");
    } finally {
      setSaving(false);
    }
  };

  const clearWeeklyDay = async () => {
    if (editingDay === null) return;
    setDaySlots([]);
  };

  // ========== Monthly Calendar Functions ==========

  const getDaysInMonth = () => {
    const start = startOfMonth(currentMonth);
    const end = endOfMonth(currentMonth);
    return eachDayOfInterval({ start, end });
  };

  const getDateOverride = (date: Date) => {
    return dateAvailability.filter((d) => isSameDay(new Date(d.date), date));
  };

  const hasDateOverride = (date: Date) => {
    return dateAvailability.some((d) => isSameDay(new Date(d.date), date));
  };

  const isDateClosed = (date: Date) => {
    const overrides = getDateOverride(date);
    return overrides.length > 0 && overrides.every((o) => o.startTime === null);
  };

  const toggleDateSelection = (date: Date) => {
    const isSelected = selectedDates.some((d) => isSameDay(d, date));
    if (isSelected) {
      setSelectedDates(selectedDates.filter((d) => !isSameDay(d, date)));
    } else {
      setSelectedDates([...selectedDates, date]);
    }
  };

  const clearSelection = () => {
    setSelectedDates([]);
  };

  const openEditDate = (date: Date) => {
    const overrides = getDateOverride(date);
    setEditingDate(date);
    setDateSlots(
      overrides.length > 0 && overrides[0].startTime
        ? overrides
            .filter((o) => o.startTime)
            .map((o) => ({ startTime: o.startTime!, endTime: o.endTime! }))
        : [{ startTime: "09:00", endTime: "17:00" }]
    );
    setIsDateDialogOpen(true);
  };

  const closeMultipleDates = async () => {
    if (selectedDates.length === 0) return;

    try {
      setSaving(true);
      const response = await fetch("/api/availability-exceptions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          dates: selectedDates.map((d) => d.toISOString()),
          closed: true,
        }),
      });

      if (!response.ok) throw new Error("Failed to close dates");

      toast.success(`${selectedDates.length} jour(s) fermé(s)`);
      clearSelection();
      fetchData();
      onUpdate();
    } catch (error) {
      console.error("Error closing dates:", error);
      toast.error("Erreur lors de la fermeture");
    } finally {
      setSaving(false);
    }
  };

  const resetMultipleDates = async () => {
    if (selectedDates.length === 0) return;

    try {
      setSaving(true);

      for (const date of selectedDates) {
        await fetch(
          `/api/availability-exceptions/${date.toISOString().split("T")[0]}`,
          {
            method: "DELETE",
          }
        );
      }

      toast.success(`${selectedDates.length} jour(s) réinitialisé(s)`);
      clearSelection();
      fetchData();
      onUpdate();
    } catch (error) {
      console.error("Error resetting dates:", error);
      toast.error("Erreur lors de la réinitialisation");
    } finally {
      setSaving(false);
    }
  };

  const saveDateOverride = async () => {
    if (!editingDate) return;

    try {
      setSaving(true);

      // Validate slots
      for (const slot of dateSlots) {
        if (slot.startTime >= slot.endTime) {
          toast.error("L'heure de début doit être avant l'heure de fin");
          return;
        }
      }

      const response = await fetch("/api/availability-exceptions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          date: editingDate.toISOString(),
          slots: dateSlots,
        }),
      });

      if (!response.ok) throw new Error("Failed to save");

      toast.success("Disponibilité mise à jour");
      setIsDateDialogOpen(false);
      setEditingDate(null);
      fetchData();
      onUpdate();
    } catch (error) {
      console.error("Error saving date:", error);
      toast.error("Erreur lors de la sauvegarde");
    } finally {
      setSaving(false);
    }
  };

  const closeDateCompletely = async () => {
    if (!editingDate) return;

    try {
      setSaving(true);

      const response = await fetch("/api/availability-exceptions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          date: editingDate.toISOString(),
          slots: [],
        }),
      });

      if (!response.ok) throw new Error("Failed to close date");

      toast.success("Journée fermée");
      setIsDateDialogOpen(false);
      setEditingDate(null);
      fetchData();
      onUpdate();
    } catch (error) {
      console.error("Error closing date:", error);
      toast.error("Erreur lors de la fermeture");
    } finally {
      setSaving(false);
    }
  };

  const resetToTemplate = async () => {
    if (!editingDate) return;

    try {
      setSaving(true);

      const response = await fetch(
        `/api/availability-exceptions/${editingDate.toISOString().split("T")[0]}`,
        {
          method: "DELETE",
        }
      );

      if (!response.ok) throw new Error("Failed to reset");

      toast.success("Réinitialisé au modèle");
      setIsDateDialogOpen(false);
      setEditingDate(null);
      fetchData();
      onUpdate();
    } catch (error) {
      console.error("Error resetting:", error);
      toast.error("Erreur lors de la réinitialisation");
    } finally {
      setSaving(false);
    }
  };

  // Get the first day of the month (0 = Sunday, 1 = Monday, etc.)
  const getFirstDayOfMonth = () => {
    const firstDay = getDay(startOfMonth(currentMonth));
    // Convert Sunday=0 to Sunday=6 for Monday-first calendar
    return firstDay === 0 ? 6 : firstDay - 1;
  };

  if (loading) {
    return <div className="text-center p-8">Chargement...</div>;
  }

  return (
    <div className="space-y-6">
      {/* Weekly Template */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Modèle hebdomadaire
          </CardTitle>
          <CardDescription>
            Définissez vos horaires récurrents pour chaque jour de la semaine
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3">
            {WEEKDAYS.map((day) => {
              const slots = getWeeklySlots(day.value);
              const hasSlots = slots.length > 0;

              return (
                <div
                  key={day.value}
                  className="border rounded-lg p-3 cursor-pointer hover:bg-accent transition-colors"
                  onClick={() => openEditDay(day.value)}
                >
                  <div className="font-semibold text-sm mb-2">
                    {day.fullLabel}
                  </div>
                  {hasSlots ? (
                    <div className="space-y-1">
                      {slots.map((slot, idx) => (
                        <div
                          key={idx}
                          className="bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-100 text-xs px-2 py-1 rounded"
                        >
                          {slot.startTime} - {slot.endTime}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <Badge variant="secondary" className="text-xs">
                      Fermé
                    </Badge>
                  )}
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Monthly Calendar */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Calendrier mensuel</CardTitle>
              <CardDescription>
                Personnalisez les disponibilités pour des dates spécifiques
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentMonth(addMonths(currentMonth, -1))}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <div className="text-sm font-semibold min-w-[150px] text-center">
                {format(currentMonth, "MMMM yyyy", { locale: fr })}
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {/* Selection actions */}
          {selectedDates.length > 0 && (
            <div className="mb-4 flex items-center gap-2 p-3 bg-blue-50 dark:bg-blue-950 rounded-lg">
              <span className="text-sm font-medium">
                {selectedDates.length} jour(s) sélectionné(s)
              </span>
              <Button
                size="sm"
                variant="destructive"
                onClick={closeMultipleDates}
                disabled={saving}
              >
                Fermer
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={resetMultipleDates}
                disabled={saving}
              >
                Réinitialiser
              </Button>
              <Button size="sm" variant="ghost" onClick={clearSelection}>
                <X className="h-4 w-4" />
              </Button>
            </div>
          )}

          {/* Calendar grid */}
          <div className="grid grid-cols-7 gap-1">
            {/* Day headers */}
            {WEEKDAYS.map((day) => (
              <div
                key={day.value}
                className="text-center text-xs font-semibold p-2 text-muted-foreground"
              >
                {day.label}
              </div>
            ))}

            {/* Empty cells before first day */}
            {Array.from({ length: getFirstDayOfMonth() }).map((_, idx) => (
              <div key={`empty-${idx}`} className="aspect-square" />
            ))}

            {/* Days */}
            {getDaysInMonth().map((date) => {
              const isOverridden = hasDateOverride(date);
              const isClosed = isDateClosed(date);
              const isSelected = selectedDates.some((d) => isSameDay(d, date));
              const isPast = date < new Date() && !isSameDay(date, new Date());

              return (
                <div
                  key={date.toISOString()}
                  className={`
                    aspect-square border rounded-lg p-1 cursor-pointer relative
                    ${isSelected ? "ring-2 ring-blue-500 bg-blue-50 dark:bg-blue-950" : ""}
                    ${isPast ? "opacity-50" : ""}
                    ${isClosed ? "bg-red-50 dark:bg-red-950 border-red-200" : ""}
                    ${isOverridden && !isClosed ? "bg-yellow-50 dark:bg-yellow-950 border-yellow-200" : ""}
                    hover:bg-accent transition-colors
                  `}
                  onClick={(e) => {
                    if (e.shiftKey) {
                      toggleDateSelection(date);
                    } else {
                      openEditDate(date);
                    }
                  }}
                >
                  <div className="text-xs font-medium text-center">
                    {format(date, "d")}
                  </div>
                  {isOverridden && (
                    <div className="absolute bottom-0 left-1/2 -translate-x-1/2">
                      <div
                        className={`w-1 h-1 rounded-full ${isClosed ? "bg-red-500" : "bg-yellow-500"}`}
                      />
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          <div className="mt-4 text-xs text-muted-foreground space-y-1">
            <div>• Cliquez sur un jour pour modifier ses horaires</div>
            <div>• Shift + Clic pour sélectionner plusieurs jours</div>
            <div>
              • Point jaune = horaires personnalisés, Point rouge = jour fermé
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Edit Weekly Day Dialog */}
      <Dialog
        open={editingDay !== null}
        onOpenChange={(open) => !open && setEditingDay(null)}
      >
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>
              Modifier {editingDay !== null && WEEKDAYS[editingDay].fullLabel}
            </DialogTitle>
            <DialogDescription>
              Ajoutez des créneaux horaires pour ce jour
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3">
            {daySlots.map((slot, idx) => (
              <div key={idx} className="flex items-center gap-2">
                <Select
                  value={slot.startTime}
                  onValueChange={(v) => updateDaySlot(idx, "startTime", v)}
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
                  onValueChange={(v) => updateDaySlot(idx, "endTime", v)}
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

                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => removeDaySlot(idx)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            ))}

            <Button
              variant="outline"
              size="sm"
              onClick={addSlotToDay}
              className="w-full"
            >
              <Plus className="h-4 w-4 mr-2" />
              Ajouter un créneau
            </Button>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={clearWeeklyDay}>
              Fermer ce jour
            </Button>
            <Button onClick={saveWeeklyTemplate} disabled={saving}>
              {saving ? "Enregistrement..." : "Enregistrer"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Date Dialog */}
      <Dialog open={isDateDialogOpen} onOpenChange={setIsDateDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>
              {editingDate &&
                format(editingDate, "EEEE d MMMM yyyy", { locale: fr })}
            </DialogTitle>
            <DialogDescription>
              Personnalisez les horaires pour cette date
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3">
            {dateSlots.map((slot, idx) => (
              <div key={idx} className="flex items-center gap-2">
                <Select
                  value={slot.startTime}
                  onValueChange={(v) => {
                    const newSlots = [...dateSlots];
                    newSlots[idx].startTime = v;
                    setDateSlots(newSlots);
                  }}
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
                  onValueChange={(v) => {
                    const newSlots = [...dateSlots];
                    newSlots[idx].endTime = v;
                    setDateSlots(newSlots);
                  }}
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

                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setDateSlots(dateSlots.filter((_, i) => i !== idx));
                  }}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            ))}

            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setDateSlots([
                  ...dateSlots,
                  { startTime: "09:00", endTime: "17:00" },
                ]);
              }}
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
                Réinitialiser
              </Button>
              <Button
                variant="destructive"
                onClick={closeDateCompletely}
                className="flex-1"
              >
                Fermer
              </Button>
            </div>
            <Button
              onClick={saveDateOverride}
              disabled={saving}
              className="w-full"
            >
              {saving ? "Enregistrement..." : "Enregistrer"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
