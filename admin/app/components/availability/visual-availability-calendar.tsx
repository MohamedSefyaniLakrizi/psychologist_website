"use client";

import { useState } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/app/components/ui/card";
import { Button } from "@/app/components/ui/button";
import { Badge } from "@/app/components/ui/badge";
import { ScrollArea } from "@/app/components/ui/scroll-area";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/app/components/ui/dialog";
import { Calendar } from "@/app/components/ui/calendar";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/app/components/ui/select";
import { Label } from "@/app/components/ui/label";
import { Textarea } from "@/app/components/ui/textarea";
import {
  Clock,
  Plus,
  Trash2,
  Edit,
  Copy,
  CalendarDays,
  CheckCircle2,
  XCircle,
  AlertCircle,
} from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { DateRange } from "react-day-picker";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/app/components/ui/popover";
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

const HOURS = Array.from({ length: 24 }, (_, i) => i);

const generateTimeSlots = () => {
  const slots = [];
  for (let hour = 0; hour < 24; hour++) {
    for (let minute = 0; minute < 60; minute += 15) {
      const time = `${hour.toString().padStart(2, "0")}:${minute.toString().padStart(2, "0")}`;
      slots.push(time);
    }
  }
  return slots;
};

const TIME_SLOTS = generateTimeSlots();

interface VisualAvailabilityCalendarProps {
  workingHours: any[];
  exceptions: any[];
  onUpdate: () => void;
  loading: boolean;
}

export function VisualAvailabilityCalendar({
  workingHours,
  exceptions,
  onUpdate,
  loading,
}: VisualAvailabilityCalendarProps) {
  const [selectedDay, setSelectedDay] = useState<number | null>(null);
  const [isAddingBlock, setIsAddingBlock] = useState(false);
  const [isAddingException, setIsAddingException] = useState(false);
  const [editingBlock, setEditingBlock] = useState<any>(null);
  const [saving, setSaving] = useState(false);

  // Block form state
  const [blockForm, setBlockForm] = useState({
    startTime: "09:00",
    endTime: "17:00",
  });

  // Exception form state
  const [exceptionForm, setExceptionForm] = useState<{
    type: "FULL_DAY" | "PARTIAL_DAY" | "DATE_RANGE";
    startDate: Date;
    endDate?: Date;
    startTime?: string;
    endTime?: string;
    reason?: string;
  }>({
    type: "FULL_DAY",
    startDate: new Date(),
  });
  const [dateRange, setDateRange] = useState<DateRange | undefined>();

  // Get working hours for a specific day
  const getWorkingHoursForDay = (day: number) => {
    return workingHours.filter((wh) => wh.weekday === day && wh.isActive);
  };

  // Check if a time slot is available
  const isTimeSlotAvailable = (
    day: number,
    hour: number,
    minute: number = 0
  ) => {
    const timeStr = `${hour.toString().padStart(2, "0")}:${minute.toString().padStart(2, "0")}`;
    const dayHours = getWorkingHoursForDay(day);

    return dayHours.some((wh) => {
      return timeStr >= wh.startTime && timeStr < wh.endTime;
    });
  };

  // Add or update working hours block
  const handleSaveBlock = async () => {
    if (selectedDay === null) return;

    try {
      setSaving(true);

      if (blockForm.startTime >= blockForm.endTime) {
        toast.error("L'heure de début doit être avant l'heure de fin");
        return;
      }

      if (editingBlock) {
        // Update existing block
        const response = await fetch(`/api/working-hours/${editingBlock.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            startTime: blockForm.startTime,
            endTime: blockForm.endTime,
          }),
        });

        if (!response.ok) throw new Error("Failed to update");
        toast.success("Créneau mis à jour");
      } else {
        // Create new block
        const response = await fetch("/api/working-hours", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            weekday: selectedDay,
            startTime: blockForm.startTime,
            endTime: blockForm.endTime,
            isActive: true,
          }),
        });

        if (!response.ok) throw new Error("Failed to create");
        toast.success("Créneau ajouté");
      }

      setIsAddingBlock(false);
      setEditingBlock(null);
      setBlockForm({ startTime: "09:00", endTime: "17:00" });
      onUpdate();
    } catch (error) {
      console.error("Error saving block:", error);
      toast.error("Erreur lors de la sauvegarde");
    } finally {
      setSaving(false);
    }
  };

  // Delete working hours block
  const handleDeleteBlock = async (id: string) => {
    if (!confirm("Supprimer ce créneau ?")) return;

    try {
      const response = await fetch(`/api/working-hours/${id}`, {
        method: "DELETE",
      });

      if (!response.ok) throw new Error("Failed to delete");
      toast.success("Créneau supprimé");
      onUpdate();
    } catch (error) {
      console.error("Error deleting block:", error);
      toast.error("Erreur lors de la suppression");
    }
  };

  // Quick presets
  const applyPreset = async (
    preset: "weekdays" | "weekend" | "allweek" | "clear"
  ) => {
    try {
      setSaving(true);
      let hours: any[] = [];

      if (preset === "weekdays") {
        hours = [0, 1, 2, 3, 4].map((weekday) => ({
          weekday,
          startTime: "09:00",
          endTime: "17:00",
          isActive: true,
        }));
      } else if (preset === "weekend") {
        hours = [5, 6].map((weekday) => ({
          weekday,
          startTime: "10:00",
          endTime: "16:00",
          isActive: true,
        }));
      } else if (preset === "allweek") {
        hours = [0, 1, 2, 3, 4, 5, 6].map((weekday) => ({
          weekday,
          startTime: "09:00",
          endTime: "17:00",
          isActive: true,
        }));
      }

      const response = await fetch("/api/working-hours", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(hours),
      });

      if (!response.ok) throw new Error("Failed to apply preset");
      toast.success("Préréglage appliqué");
      onUpdate();
    } catch (error) {
      console.error("Error applying preset:", error);
      toast.error("Erreur lors de l'application du préréglage");
    } finally {
      setSaving(false);
    }
  };

  // Save exception
  const handleSaveException = async () => {
    try {
      setSaving(true);

      if (exceptionForm.type === "PARTIAL_DAY") {
        if (!exceptionForm.startTime || !exceptionForm.endTime) {
          toast.error("Les heures sont requises pour une exception partielle");
          return;
        }
        if (exceptionForm.startTime >= exceptionForm.endTime) {
          toast.error("L'heure de début doit être avant l'heure de fin");
          return;
        }
      }

      if (exceptionForm.type === "DATE_RANGE") {
        if (!dateRange?.from || !dateRange?.to) {
          toast.error("Une plage de dates est requise");
          return;
        }
        exceptionForm.startDate = dateRange.from;
        exceptionForm.endDate = dateRange.to;
      }

      const response = await fetch("/api/availability-exceptions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: exceptionForm.type,
          startDate: exceptionForm.startDate.toISOString(),
          endDate: exceptionForm.endDate?.toISOString(),
          startTime: exceptionForm.startTime,
          endTime: exceptionForm.endTime,
          reason: exceptionForm.reason,
        }),
      });

      if (!response.ok) throw new Error("Failed to save");

      toast.success("Indisponibilité ajoutée");
      setIsAddingException(false);
      setExceptionForm({
        type: "FULL_DAY",
        startDate: new Date(),
      });
      setDateRange(undefined);
      onUpdate();
    } catch (error) {
      console.error("Error saving exception:", error);
      toast.error("Erreur lors de la sauvegarde");
    } finally {
      setSaving(false);
    }
  };

  // Delete exception
  const handleDeleteException = async (id: string) => {
    if (!confirm("Supprimer cette indisponibilité ?")) return;

    try {
      const response = await fetch(`/api/availability-exceptions/${id}`, {
        method: "DELETE",
      });

      if (!response.ok) throw new Error("Failed to delete");
      toast.success("Indisponibilité supprimée");
      onUpdate();
    } catch (error) {
      console.error("Error deleting exception:", error);
      toast.error("Erreur lors de la suppression");
    }
  };

  return (
    <div className="space-y-6">
      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Actions rapides
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => applyPreset("weekdays")}
              disabled={saving}
            >
              <CheckCircle2 className="h-4 w-4 mr-2" />
              Lun-Ven 9h-17h
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => applyPreset("allweek")}
              disabled={saving}
            >
              <CheckCircle2 className="h-4 w-4 mr-2" />
              Toute la semaine 9h-17h
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsAddingException(true)}
            >
              <XCircle className="h-4 w-4 mr-2" />
              Bloquer des dates
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Visual Weekly Calendar */}
      <Card>
        <CardHeader>
          <CardTitle>Disponibilités hebdomadaires</CardTitle>
          <p className="text-sm text-muted-foreground">
            Les créneaux en vert sont disponibles pour les clients. Cliquez sur
            un jour pour ajouter/modifier.
          </p>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-7 gap-2">
            {WEEKDAYS.map((day) => {
              const dayHours = getWorkingHoursForDay(day.value);
              const hasHours = dayHours.length > 0;

              return (
                <div key={day.value} className="space-y-2">
                  <div className="text-center">
                    <div className="font-semibold text-sm">{day.label}</div>
                    <Badge
                      variant={hasHours ? "default" : "secondary"}
                      className="text-xs mt-1"
                    >
                      {hasHours
                        ? `${dayHours.length} créneau${dayHours.length > 1 ? "x" : ""}`
                        : "Fermé"}
                    </Badge>
                  </div>

                  <div className="border rounded-lg p-2 min-h-[200px] bg-muted/30">
                    <ScrollArea className="h-[180px]">
                      {dayHours.length === 0 ? (
                        <div className="text-center text-sm text-muted-foreground py-4">
                          Aucun créneau
                        </div>
                      ) : (
                        <div className="space-y-1">
                          {dayHours.map((block) => (
                            <div
                              key={block.id}
                              className="bg-green-100 dark:bg-green-900/30 border border-green-300 dark:border-green-700 rounded p-2 text-xs group relative"
                            >
                              <div className="font-medium text-green-900 dark:text-green-100">
                                {block.startTime}
                              </div>
                              <div className="text-green-700 dark:text-green-300">
                                {block.endTime}
                              </div>
                              <div className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 transition-opacity flex gap-1">
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  className="h-5 w-5 p-0"
                                  onClick={() => {
                                    setEditingBlock(block);
                                    setSelectedDay(day.value);
                                    setBlockForm({
                                      startTime: block.startTime,
                                      endTime: block.endTime,
                                    });
                                    setIsAddingBlock(true);
                                  }}
                                >
                                  <Edit className="h-3 w-3" />
                                </Button>
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  className="h-5 w-5 p-0"
                                  onClick={() => handleDeleteBlock(block.id)}
                                >
                                  <Trash2 className="h-3 w-3 text-destructive" />
                                </Button>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </ScrollArea>
                  </div>

                  <Button
                    size="sm"
                    variant="outline"
                    className="w-full"
                    onClick={() => {
                      setSelectedDay(day.value);
                      setEditingBlock(null);
                      setBlockForm({ startTime: "09:00", endTime: "17:00" });
                      setIsAddingBlock(true);
                    }}
                  >
                    <Plus className="h-3 w-3 mr-1" />
                    Ajouter
                  </Button>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Exceptions/Blocked Dates */}
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <div>
              <CardTitle className="flex items-center gap-2">
                <CalendarDays className="h-5 w-5" />
                Dates fermées
              </CardTitle>
              <p className="text-sm text-muted-foreground mt-1">
                Jours ou créneaux où les clients ne peuvent PAS réserver
              </p>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {exceptions.length === 0 ? (
            <div className="text-center text-muted-foreground py-8">
              <AlertCircle className="h-12 w-12 mx-auto mb-2 opacity-50" />
              <p>Aucune date fermée</p>
              <p className="text-sm">
                Les clients peuvent réserver selon vos disponibilités
                hebdomadaires
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {exceptions.map((exception) => (
                <div
                  key={exception.id}
                  className="border rounded-lg p-3 bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800 group relative"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="font-medium text-sm">
                        {exception.type === "DATE_RANGE" && exception.endDate
                          ? `${format(new Date(exception.startDate), "dd MMM", { locale: fr })} - ${format(new Date(exception.endDate), "dd MMM yyyy", { locale: fr })}`
                          : format(
                              new Date(exception.startDate),
                              "dd MMM yyyy",
                              { locale: fr }
                            )}
                      </div>
                      <div className="text-xs text-muted-foreground mt-1">
                        {exception.type === "PARTIAL_DAY" &&
                        exception.startTime &&
                        exception.endTime
                          ? `${exception.startTime} - ${exception.endTime}`
                          : "Toute la journée"}
                      </div>
                      {exception.reason && (
                        <div className="text-xs text-muted-foreground mt-1 italic">
                          {exception.reason}
                        </div>
                      )}
                    </div>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                      onClick={() => handleDeleteException(exception.id)}
                    >
                      <Trash2 className="h-3 w-3 text-destructive" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Add/Edit Block Dialog */}
      <Dialog open={isAddingBlock} onOpenChange={setIsAddingBlock}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingBlock ? "Modifier le créneau" : "Ajouter un créneau"}
            </DialogTitle>
            <DialogDescription>
              {selectedDay !== null && `${WEEKDAYS[selectedDay].fullLabel}`}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Heure de début</Label>
                <Select
                  value={blockForm.startTime}
                  onValueChange={(value) =>
                    setBlockForm({ ...blockForm, startTime: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <ScrollArea className="h-60">
                      {TIME_SLOTS.map((time) => (
                        <SelectItem key={time} value={time}>
                          {time}
                        </SelectItem>
                      ))}
                    </ScrollArea>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Heure de fin</Label>
                <Select
                  value={blockForm.endTime}
                  onValueChange={(value) =>
                    setBlockForm({ ...blockForm, endTime: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <ScrollArea className="h-60">
                      {TIME_SLOTS.map((time) => (
                        <SelectItem key={time} value={time}>
                          {time}
                        </SelectItem>
                      ))}
                    </ScrollArea>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAddingBlock(false)}>
              Annuler
            </Button>
            <Button onClick={handleSaveBlock} disabled={saving}>
              {saving ? "Enregistrement..." : "Enregistrer"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add Exception Dialog */}
      <Dialog open={isAddingException} onOpenChange={setIsAddingException}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Bloquer des dates</DialogTitle>
            <DialogDescription>
              Empêchez les clients de réserver pendant certaines périodes
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <Label>Type de blocage</Label>
              <Select
                value={exceptionForm.type}
                onValueChange={(value: any) =>
                  setExceptionForm({ ...exceptionForm, type: value })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="FULL_DAY">
                    Journée(s) complète(s)
                  </SelectItem>
                  <SelectItem value="PARTIAL_DAY">
                    Créneaux horaires spécifiques
                  </SelectItem>
                  <SelectItem value="DATE_RANGE">
                    Plage de dates (vacances)
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            {exceptionForm.type === "DATE_RANGE" ? (
              <div>
                <Label>Plage de dates</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-full justify-start text-left font-normal",
                        !dateRange && "text-muted-foreground"
                      )}
                    >
                      <CalendarDays className="mr-2 h-4 w-4" />
                      {dateRange?.from ? (
                        dateRange.to ? (
                          <>
                            {format(dateRange.from, "dd MMM yyyy", {
                              locale: fr,
                            })}{" "}
                            -{" "}
                            {format(dateRange.to, "dd MMM yyyy", {
                              locale: fr,
                            })}
                          </>
                        ) : (
                          format(dateRange.from, "dd MMM yyyy", { locale: fr })
                        )
                      ) : (
                        "Sélectionner une plage"
                      )}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="range"
                      selected={dateRange}
                      onSelect={setDateRange}
                      numberOfMonths={2}
                      locale={fr}
                    />
                  </PopoverContent>
                </Popover>
              </div>
            ) : (
              <div>
                <Label>Date</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className="w-full justify-start text-left font-normal"
                    >
                      <CalendarDays className="mr-2 h-4 w-4" />
                      {format(exceptionForm.startDate, "dd MMMM yyyy", {
                        locale: fr,
                      })}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar
                      mode="single"
                      selected={exceptionForm.startDate}
                      onSelect={(date) =>
                        date &&
                        setExceptionForm({ ...exceptionForm, startDate: date })
                      }
                      locale={fr}
                    />
                  </PopoverContent>
                </Popover>
              </div>
            )}

            {exceptionForm.type === "PARTIAL_DAY" && (
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Heure de début</Label>
                  <Select
                    value={exceptionForm.startTime}
                    onValueChange={(value) =>
                      setExceptionForm({ ...exceptionForm, startTime: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Sélectionner" />
                    </SelectTrigger>
                    <SelectContent>
                      <ScrollArea className="h-60">
                        {TIME_SLOTS.map((time) => (
                          <SelectItem key={time} value={time}>
                            {time}
                          </SelectItem>
                        ))}
                      </ScrollArea>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Heure de fin</Label>
                  <Select
                    value={exceptionForm.endTime}
                    onValueChange={(value) =>
                      setExceptionForm({ ...exceptionForm, endTime: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Sélectionner" />
                    </SelectTrigger>
                    <SelectContent>
                      <ScrollArea className="h-60">
                        {TIME_SLOTS.map((time) => (
                          <SelectItem key={time} value={time}>
                            {time}
                          </SelectItem>
                        ))}
                      </ScrollArea>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            )}

            <div>
              <Label>Raison (optionnel)</Label>
              <Textarea
                placeholder="Ex: Vacances, formation, rendez-vous..."
                value={exceptionForm.reason}
                onChange={(e) =>
                  setExceptionForm({ ...exceptionForm, reason: e.target.value })
                }
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsAddingException(false)}
            >
              Annuler
            </Button>
            <Button onClick={handleSaveException} disabled={saving}>
              {saving ? "Enregistrement..." : "Bloquer"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
