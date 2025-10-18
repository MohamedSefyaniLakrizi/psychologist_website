"use client";

import { useState, useEffect } from "react";
import { type DateRange } from "react-day-picker";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
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
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/app/components/ui/popover";
import { Calendar } from "@/app/components/ui/calendar";
import { Clock, Plus, Trash2, CalendarIcon } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

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
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Weekly template editing
  const [editingDay, setEditingDay] = useState<number | null>(null);
  const [daySlots, setDaySlots] = useState<
    { startTime: string; endTime: string }[]
  >([]);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const weeklyRes = await fetch("/api/working-hours");

      if (weeklyRes.ok) {
        const data = await weeklyRes.json();
        setWeeklyAvailability(data);
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

      // First, delete existing slots for this weekday only
      const existingSlotsForDay = getWeeklySlots(editingDay);
      for (const slot of existingSlotsForDay) {
        await fetch(`/api/working-hours/${slot.id}`, {
          method: "DELETE",
        });
      }

      // Then create new slots for this weekday
      if (daySlots.length > 0) {
        for (const slot of daySlots) {
          await fetch("/api/working-hours", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              weekday: editingDay,
              startTime: slot.startTime,
              endTime: slot.endTime,
            }),
          });
        }
      }

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

  // ========== New: Step-by-step availability editing ==========
  const [editMode, setEditMode] = useState<
    "single" | "multiple" | "vacation" | null
  >(null);
  const [multipleMode, setMultipleMode] = useState<
    "range" | "individual" | null
  >(null);

  // Popover control states
  const [singleDatePopoverOpen, setSingleDatePopoverOpen] = useState(false);
  const [rangePopoverOpen, setRangePopoverOpen] = useState(false);
  const [multiDatesPopoverOpen, setMultiDatesPopoverOpen] = useState(false);
  const [vacationPopoverOpen, setVacationPopoverOpen] = useState(false);

  const [singleDate, setSingleDate] = useState<Date | undefined>();
  const [singleDateSlots, setSingleDateSlots] = useState<
    { startTime: string; endTime: string }[]
  >([]);

  const [dateRange, setDateRange] = useState<DateRange | undefined>();
  const [rangeSlots, setRangeSlots] = useState<
    { startTime: string; endTime: string }[]
  >([]);

  const [multiDates, setMultiDates] = useState<Date[]>([]);

  const [vacationRange, setVacationRange] = useState<DateRange | undefined>();

  // Reset function
  const resetAllStates = () => {
    setEditMode(null);
    setMultipleMode(null);
    setSingleDatePopoverOpen(false);
    setRangePopoverOpen(false);
    setMultiDatesPopoverOpen(false);
    setVacationPopoverOpen(false);
    setSingleDate(undefined);
    setSingleDateSlots([]);
    setDateRange(undefined);
    setRangeSlots([]);
    setMultiDates([]);
    setVacationRange(undefined);
  };

  const fetchDateAvailability = async (date: Date) => {
    const dateIso = format(date, "yyyy-MM-dd");
    try {
      console.log("Fetching availability for date:", dateIso);
      const res = await fetch(
        `/api/availability-exceptions?startDate=${dateIso}&endDate=${dateIso}`
      );

      console.log("API response status:", res.status);

      if (!res.ok) {
        console.error("API response not ok:", res.status, res.statusText);
        // If API fails, fallback to weekly template
        setDefaultAvailabilityForDate(date);
        return;
      }

      const data = await res.json();
      // data expected to be an array of date availability objects
      if (data && Array.isArray(data) && data.length > 0) {
        // map to slots, filtering out null startTime/endTime (closed days)
        const slots = data
          .filter((d: any) => d.startTime && d.endTime)
          .map((d: any) => ({ startTime: d.startTime, endTime: d.endTime }));

        console.log("Filtered slots:", slots);

        if (slots.length > 0) {
          setSingleDateSlots(slots);
          console.log("Set single date slots:", slots);
        } else {
          // If no open slots found, check if day is marked as closed
          const hasClosedRecords = data.some(
            (d: any) => !d.startTime || !d.endTime
          );
          if (hasClosedRecords) {
            setSingleDateSlots([]); // Day is explicitly closed
            console.log("Day is explicitly closed");
          } else {
            // Fallback to weekly template
            setDefaultAvailabilityForDate(date);
          }
        }
      } else {
        // If no specific availability found, fallback to weekly template
        console.log(
          "No availability data found, falling back to weekly template"
        );
        setDefaultAvailabilityForDate(date);
      }
    } catch (err) {
      console.error("Error fetching date availability:", err);
      // Set default slot even on error
      setDefaultAvailabilityForDate(date);
      toast.error("Impossible de charger les disponibilités pour la date");
    }
  };

  const setDefaultAvailabilityForDate = (date: Date) => {
    // Get day of week (0 = Monday, 6 = Sunday in our WEEKDAYS array)
    const dayOfWeek = (date.getDay() + 6) % 7; // Convert Sunday=0 to Monday=0
    const weeklySlots = getWeeklySlots(dayOfWeek);

    console.log(
      "Setting default availability for day",
      dayOfWeek,
      "slots:",
      weeklySlots
    );

    if (weeklySlots.length > 0) {
      const slots = weeklySlots.map((slot) => ({
        startTime: slot.startTime,
        endTime: slot.endTime,
      }));
      setSingleDateSlots(slots);
      console.log("Set slots from weekly template:", slots);
    } else {
      // Day is closed in weekly template
      setSingleDateSlots([]);
      console.log("Day is closed in weekly template");
    }
  };

  const saveSingleDateAvailability = async () => {
    if (!singleDate) return;
    try {
      setSaving(true);
      // validate
      for (const s of singleDateSlots)
        if (s.startTime >= s.endTime) throw new Error("Invalid slot");

      const dateIso = format(singleDate, "yyyy-MM-dd");
      await fetch(`/api/availability-exceptions`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ date: dateIso, slots: singleDateSlots }),
      });

      toast.success("Disponibilités enregistrées pour la date");
      fetchData();
      resetAllStates();
    } catch (err) {
      console.error(err);
      toast.error("Erreur lors de l'enregistrement");
    } finally {
      setSaving(false);
    }
  };

  const applyRangeAvailability = async () => {
    if (!dateRange?.from || !dateRange?.to) return;
    try {
      setSaving(true);
      for (const s of rangeSlots)
        if (s.startTime >= s.endTime) throw new Error("Invalid slot");

      // Build dates array between start and end (inclusive)
      const dates: string[] = [];
      for (
        let d = new Date(dateRange.from);
        d <= dateRange.to;
        d.setDate(d.getDate() + 1)
      ) {
        dates.push(format(d, "yyyy-MM-dd"));
      }

      await fetch(`/api/availability-exceptions`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ dates, slots: rangeSlots }),
      });

      toast.success("Disponibilités appliquées à la plage");
      fetchData();
      resetAllStates();
    } catch (err) {
      console.error(err);
      toast.error("Erreur lors de l'application");
    } finally {
      setSaving(false);
    }
  };

  const applyMultiDatesAvailability = async () => {
    if (multiDates.length === 0) return;
    try {
      setSaving(true);
      for (const s of rangeSlots)
        if (s.startTime >= s.endTime) throw new Error("Invalid slot");

      const dates = multiDates.map((date) => format(date, "yyyy-MM-dd"));

      await fetch(`/api/availability-exceptions`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ dates, slots: rangeSlots }),
      });

      toast.success("Disponibilités appliquées aux dates sélectionnées");
      fetchData();
      resetAllStates();
    } catch (err) {
      console.error(err);
      toast.error("Erreur lors de l'application");
    } finally {
      setSaving(false);
    }
  };

  const applyVacation = async () => {
    if (!vacationRange?.from || !vacationRange?.to) return;
    try {
      setSaving(true);
      const dates: string[] = [];
      for (
        let d = new Date(vacationRange.from);
        d <= vacationRange.to;
        d.setDate(d.getDate() + 1)
      ) {
        dates.push(format(d, "yyyy-MM-dd"));
      }

      await fetch(`/api/availability-exceptions`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ dates, closed: true }),
      });

      toast.success("Vacances enregistrées");
      fetchData();
      resetAllStates();
    } catch (err) {
      console.error(err);
      toast.error("Erreur lors de l'enregistrement des vacances");
    } finally {
      setSaving(false);
    }
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

      {/* Step 1: Choose Edit Mode */}
      {editMode === null && (
        <Card>
          <CardHeader>
            <CardTitle>Modifier les disponibilités</CardTitle>
            <CardDescription>
              Choisissez ce que vous souhaitez modifier
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Button
                variant="outline"
                className="h-24 flex-col gap-2"
                onClick={() => setEditMode("single")}
              >
                <CalendarIcon className="h-6 w-6" />
                <div className="text-center">
                  <div className="font-medium">Un jour spécifique</div>
                  <div className="text-xs text-muted-foreground">
                    Modifier les horaires d&apos;une date précise
                  </div>
                </div>
              </Button>

              <Button
                variant="outline"
                className="h-24 flex-col gap-2"
                onClick={() => setEditMode("multiple")}
              >
                <CalendarIcon className="h-6 w-6" />
                <div className="text-center">
                  <div className="font-medium">Plusieurs jours</div>
                  <div className="text-xs text-muted-foreground">
                    Appliquer des horaires à plusieurs dates
                  </div>
                </div>
              </Button>

              <Button
                variant="outline"
                className="h-24 flex-col gap-2"
                onClick={() => setEditMode("vacation")}
              >
                <CalendarIcon className="h-6 w-6" />
                <div className="text-center">
                  <div className="font-medium">Vacances</div>
                  <div className="text-xs text-muted-foreground">
                    Fermer des dates pour les vacances
                  </div>
                </div>
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Step 2: Multiple Days Mode Selection */}
      {editMode === "multiple" && multipleMode === null && (
        <Card>
          <CardHeader>
            <CardTitle>Type de sélection multiple</CardTitle>
            <CardDescription>
              Comment souhaitez-vous sélectionner les dates ?
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Button
                variant="outline"
                className="h-24 flex-col gap-2"
                onClick={() => setMultipleMode("range")}
              >
                <CalendarIcon className="h-6 w-6" />
                <div className="text-center">
                  <div className="font-medium">Plage de dates</div>
                  <div className="text-xs text-muted-foreground">
                    Jours consécutifs (du 1er au 15 janvier)
                  </div>
                </div>
              </Button>

              <Button
                variant="outline"
                className="h-24 flex-col gap-2"
                onClick={() => setMultipleMode("individual")}
              >
                <CalendarIcon className="h-6 w-6" />
                <div className="text-center">
                  <div className="font-medium">Dates individuelles</div>
                  <div className="text-xs text-muted-foreground">
                    Jours non-consécutifs (lundi, mercredi, vendredi)
                  </div>
                </div>
              </Button>
            </div>
            <div className="mt-4">
              <Button variant="ghost" onClick={resetAllStates}>
                ← Retour
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Single Day Editor */}
      {editMode === "single" && (
        <Card>
          <CardHeader>
            <CardTitle>Éditer un jour spécifique</CardTitle>
            <CardDescription>
              Choisissez une date et modifiez ses disponibilités
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 gap-3">
              <Popover
                open={singleDatePopoverOpen}
                onOpenChange={setSingleDatePopoverOpen}
              >
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "justify-start text-left font-normal",
                      !singleDate && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {singleDate
                      ? format(singleDate, "PPP", { locale: fr })
                      : "Choisissez une date"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={singleDate}
                    onSelect={(date) => {
                      console.log("Date selected:", date);
                      setSingleDate(date);
                      if (date) {
                        // Close the popover first
                        setSingleDatePopoverOpen(false);
                        // Then fetch availability with a small delay to ensure state is updated
                        setTimeout(() => {
                          fetchDateAvailability(date);
                        }, 100);
                      }
                    }}
                    locale={fr}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>

              <div className="space-y-2">
                {singleDateSlots.map((slot, idx) => (
                  <div key={idx} className="flex items-center gap-2">
                    <Select
                      value={slot.startTime}
                      onValueChange={(v) => {
                        const s = [...singleDateSlots];
                        s[idx].startTime = v;
                        setSingleDateSlots(s);
                      }}
                    >
                      <SelectTrigger className="flex-1">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {TIME_SLOTS.map((t) => (
                          <SelectItem key={t} value={t}>
                            {t}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <span>à</span>
                    <Select
                      value={slot.endTime}
                      onValueChange={(v) => {
                        const s = [...singleDateSlots];
                        s[idx].endTime = v;
                        setSingleDateSlots(s);
                      }}
                    >
                      <SelectTrigger className="flex-1">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {TIME_SLOTS.map((t) => (
                          <SelectItem key={t} value={t}>
                            {t}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() =>
                        setSingleDateSlots(
                          singleDateSlots.filter((_, i) => i !== idx)
                        )
                      }
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ))}

                <Button
                  variant="outline"
                  size="sm"
                  onClick={() =>
                    setSingleDateSlots([
                      ...singleDateSlots,
                      { startTime: "09:00", endTime: "17:00" },
                    ])
                  }
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Ajouter un créneau
                </Button>
              </div>

              <div className="flex gap-2">
                <Button
                  onClick={saveSingleDateAvailability}
                  disabled={saving || !singleDate}
                >
                  Enregistrer
                </Button>
                <Button variant="ghost" onClick={resetAllStates}>
                  ← Retour
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Range Selection for Multiple Days */}
      {editMode === "multiple" && multipleMode === "range" && (
        <Card>
          <CardHeader>
            <CardTitle>Modifier une plage de dates</CardTitle>
            <CardDescription>
              Sélectionnez une plage de dates consécutives
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 gap-3">
              <Popover
                open={rangePopoverOpen}
                onOpenChange={setRangePopoverOpen}
              >
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "justify-start text-left font-normal w-full",
                      !dateRange && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {dateRange?.from ? (
                      dateRange.to ? (
                        <>
                          {format(dateRange.from, "LLL dd, y", { locale: fr })}{" "}
                          - {format(dateRange.to, "LLL dd, y", { locale: fr })}
                        </>
                      ) : (
                        format(dateRange.from, "LLL dd, y", { locale: fr })
                      )
                    ) : (
                      "Sélectionnez une plage de dates"
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <div className="p-0">
                    <Calendar
                      mode="range"
                      defaultMonth={dateRange?.from}
                      selected={dateRange}
                      onSelect={setDateRange}
                      numberOfMonths={2}
                      locale={fr}
                    />
                    {(dateRange?.from || dateRange?.to) && (
                      <div className="border-t p-3">
                        <Button
                          onClick={() => setRangePopoverOpen(false)}
                          className="w-full"
                          size="sm"
                        >
                          Confirmer la sélection
                        </Button>
                      </div>
                    )}
                  </div>
                </PopoverContent>
              </Popover>

              <div className="space-y-2">
                {rangeSlots.map((slot, idx) => (
                  <div key={idx} className="flex items-center gap-2">
                    <Select
                      value={slot.startTime}
                      onValueChange={(v) => {
                        const s = [...rangeSlots];
                        s[idx].startTime = v;
                        setRangeSlots(s);
                      }}
                    >
                      <SelectTrigger className="flex-1">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {TIME_SLOTS.map((t) => (
                          <SelectItem key={t} value={t}>
                            {t}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <span>à</span>
                    <Select
                      value={slot.endTime}
                      onValueChange={(v) => {
                        const s = [...rangeSlots];
                        s[idx].endTime = v;
                        setRangeSlots(s);
                      }}
                    >
                      <SelectTrigger className="flex-1">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {TIME_SLOTS.map((t) => (
                          <SelectItem key={t} value={t}>
                            {t}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() =>
                        setRangeSlots(rangeSlots.filter((_, i) => i !== idx))
                      }
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ))}

                <Button
                  variant="outline"
                  size="sm"
                  onClick={() =>
                    setRangeSlots([
                      ...rangeSlots,
                      { startTime: "09:00", endTime: "17:00" },
                    ])
                  }
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Ajouter un créneau
                </Button>
              </div>

              <div className="flex gap-2">
                <Button
                  onClick={applyRangeAvailability}
                  disabled={saving || !dateRange?.from || !dateRange?.to}
                >
                  Appliquer à la plage
                </Button>
                <Button variant="ghost" onClick={resetAllStates}>
                  ← Retour
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Individual Dates Selection */}
      {editMode === "multiple" && multipleMode === "individual" && (
        <Card>
          <CardHeader>
            <CardTitle>Modifier des dates individuelles</CardTitle>
            <CardDescription>
              Sélectionnez plusieurs dates non-consécutives
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 gap-3">
              <Popover
                open={multiDatesPopoverOpen}
                onOpenChange={setMultiDatesPopoverOpen}
              >
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "justify-start text-left font-normal w-full",
                      multiDates.length === 0 && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {multiDates.length > 0
                      ? `${multiDates.length} dates sélectionnées`
                      : "Sélectionnez des dates"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <div className="p-0">
                    <Calendar
                      mode="multiple"
                      selected={multiDates}
                      onSelect={setMultiDates}
                      numberOfMonths={2}
                      locale={fr}
                    />
                    {multiDates.length > 0 && (
                      <div className="border-t p-3">
                        <Button
                          onClick={() => setMultiDatesPopoverOpen(false)}
                          className="w-full"
                          size="sm"
                        >
                          Confirmer la sélection
                        </Button>
                      </div>
                    )}
                  </div>
                </PopoverContent>
              </Popover>
              {multiDates.length > 0 && (
                <div className="mt-2 text-xs text-muted-foreground">
                  Dates:{" "}
                  {multiDates
                    .map((d) => format(d, "dd/MM", { locale: fr }))
                    .join(", ")}
                </div>
              )}

              <div className="space-y-2">
                {rangeSlots.map((slot, idx) => (
                  <div key={idx} className="flex items-center gap-2">
                    <Select
                      value={slot.startTime}
                      onValueChange={(v) => {
                        const s = [...rangeSlots];
                        s[idx].startTime = v;
                        setRangeSlots(s);
                      }}
                    >
                      <SelectTrigger className="flex-1">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {TIME_SLOTS.map((t) => (
                          <SelectItem key={t} value={t}>
                            {t}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <span>à</span>
                    <Select
                      value={slot.endTime}
                      onValueChange={(v) => {
                        const s = [...rangeSlots];
                        s[idx].endTime = v;
                        setRangeSlots(s);
                      }}
                    >
                      <SelectTrigger className="flex-1">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {TIME_SLOTS.map((t) => (
                          <SelectItem key={t} value={t}>
                            {t}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() =>
                        setRangeSlots(rangeSlots.filter((_, i) => i !== idx))
                      }
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ))}

                <Button
                  variant="outline"
                  size="sm"
                  onClick={() =>
                    setRangeSlots([
                      ...rangeSlots,
                      { startTime: "09:00", endTime: "17:00" },
                    ])
                  }
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Ajouter un créneau
                </Button>
              </div>

              <div className="flex gap-2">
                <Button
                  onClick={applyMultiDatesAvailability}
                  disabled={saving || multiDates.length === 0}
                >
                  Appliquer aux dates sélectionnées
                </Button>
                <Button variant="ghost" onClick={resetAllStates}>
                  ← Retour
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Vacation Mode */}
      {editMode === "vacation" && (
        <Card>
          <CardHeader>
            <CardTitle>Ajouter des vacances</CardTitle>
            <CardDescription>
              Marquez une période comme fermée pour vacances
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 gap-3">
              <Popover
                open={vacationPopoverOpen}
                onOpenChange={setVacationPopoverOpen}
              >
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "justify-start text-left font-normal w-full",
                      !vacationRange && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {vacationRange?.from ? (
                      vacationRange.to ? (
                        <>
                          {format(vacationRange.from, "LLL dd, y", {
                            locale: fr,
                          })}{" "}
                          -{" "}
                          {format(vacationRange.to, "LLL dd, y", {
                            locale: fr,
                          })}
                        </>
                      ) : (
                        format(vacationRange.from, "LLL dd, y", { locale: fr })
                      )
                    ) : (
                      "Sélectionnez une période de vacances"
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <div className="p-0">
                    <Calendar
                      mode="range"
                      defaultMonth={vacationRange?.from}
                      selected={vacationRange}
                      onSelect={setVacationRange}
                      numberOfMonths={2}
                      locale={fr}
                    />
                    {(vacationRange?.from || vacationRange?.to) && (
                      <div className="border-t p-3">
                        <Button
                          onClick={() => setVacationPopoverOpen(false)}
                          className="w-full"
                          size="sm"
                        >
                          Confirmer la sélection
                        </Button>
                      </div>
                    )}
                  </div>
                </PopoverContent>
              </Popover>

              <div className="flex gap-2">
                <Button
                  onClick={applyVacation}
                  disabled={
                    saving || !vacationRange?.from || !vacationRange?.to
                  }
                >
                  Enregistrer vacances
                </Button>
                <Button variant="ghost" onClick={resetAllStates}>
                  ← Retour
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

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
    </div>
  );
}
