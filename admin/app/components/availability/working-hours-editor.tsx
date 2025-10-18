"use client";

import { useState } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/app/components/ui/card";
import { Button } from "@/app/components/ui/button";
import { ScrollArea } from "@/app/components/ui/scroll-area";
import { Switch } from "@/app/components/ui/switch";
import { Label } from "@/app/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/app/components/ui/select";
import { Plus, Trash2, Copy, Clock } from "lucide-react";
import { toast } from "sonner";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/app/components/ui/alert-dialog";

const WEEKDAYS = [
  { value: 0, label: "Lundi" },
  { value: 1, label: "Mardi" },
  { value: 2, label: "Mercredi" },
  { value: 3, label: "Jeudi" },
  { value: 4, label: "Vendredi" },
  { value: 5, label: "Samedi" },
  { value: 6, label: "Dimanche" },
];

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

interface WorkingHour {
  id?: string;
  weekday: number;
  startTime: string;
  endTime: string;
  isActive: boolean;
}

interface WorkingHoursEditorProps {
  workingHours: any[];
  onUpdate: () => void;
  loading: boolean;
}

export function WorkingHoursEditor({
  workingHours,
  onUpdate,
  loading,
}: WorkingHoursEditorProps) {
  const [editMode, setEditMode] = useState(false);
  const [localHours, setLocalHours] = useState<WorkingHour[]>([]);
  const [showPresets, setShowPresets] = useState(false);
  const [saving, setSaving] = useState(false);

  const startEdit = () => {
    setLocalHours(
      workingHours.map((h) => ({
        id: h.id,
        weekday: h.weekday,
        startTime: h.startTime,
        endTime: h.endTime,
        isActive: h.isActive,
      }))
    );
    setEditMode(true);
  };

  const cancelEdit = () => {
    setEditMode(false);
    setLocalHours([]);
  };

  const saveChanges = async () => {
    try {
      setSaving(true);

      // Validate
      for (const hour of localHours) {
        if (hour.startTime >= hour.endTime) {
          toast.error("L'heure de début doit être avant l'heure de fin");
          return;
        }
      }

      const response = await fetch("/api/working-hours", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(localHours),
      });

      if (!response.ok) throw new Error("Failed to save");

      toast.success("Horaires de travail mis à jour");
      setEditMode(false);
      onUpdate();
    } catch (error) {
      console.error("Error saving:", error);
      toast.error("Erreur lors de la sauvegarde");
    } finally {
      setSaving(false);
    }
  };

  const addBlock = (weekday: number) => {
    setLocalHours([
      ...localHours,
      {
        weekday,
        startTime: "09:00",
        endTime: "17:00",
        isActive: true,
      },
    ]);
  };

  const removeBlock = (index: number) => {
    setLocalHours(localHours.filter((_, i) => i !== index));
  };

  const updateBlock = (index: number, updates: Partial<WorkingHour>) => {
    setLocalHours(
      localHours.map((h, i) => (i === index ? { ...h, ...updates } : h))
    );
  };

  const applyPreset = (preset: "weekdays" | "copy-monday" | "clear") => {
    if (preset === "weekdays") {
      // Mon-Fri 9-17
      setLocalHours(
        [0, 1, 2, 3, 4].map((weekday) => ({
          weekday,
          startTime: "09:00",
          endTime: "17:00",
          isActive: true,
        }))
      );
    } else if (preset === "copy-monday") {
      const mondayBlocks = localHours.filter((h) => h.weekday === 0);
      if (mondayBlocks.length === 0) {
        toast.error("Aucun horaire défini pour lundi");
        return;
      }
      const newHours = [];
      for (let day = 0; day < 7; day++) {
        for (const block of mondayBlocks) {
          newHours.push({ ...block, weekday: day });
        }
      }
      setLocalHours(newHours);
    } else if (preset === "clear") {
      setLocalHours([]);
    }
    setShowPresets(false);
  };

  const groupedHours = WEEKDAYS.map((day) => ({
    ...day,
    blocks: editMode
      ? localHours.filter((h) => h.weekday === day.value)
      : workingHours.filter((h) => h.weekday === day.value),
  }));

  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-center">
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Horaires de travail
          </CardTitle>
          <div className="flex gap-2">
            {editMode ? (
              <>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowPresets(true)}
                >
                  Préréglages
                </Button>
                <Button variant="outline" size="sm" onClick={cancelEdit}>
                  Annuler
                </Button>
                <Button size="sm" onClick={saveChanges} disabled={saving}>
                  {saving ? "Enregistrement..." : "Enregistrer"}
                </Button>
              </>
            ) : (
              <Button size="sm" onClick={startEdit} disabled={loading}>
                Modifier
              </Button>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[600px] pr-4">
          <div className="space-y-4">
            {groupedHours.map((day) => (
              <div key={day.value} className="border rounded-lg p-4">
                <div className="flex justify-between items-center mb-3">
                  <h3 className="font-semibold">{day.label}</h3>
                  {editMode && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => addBlock(day.value)}
                    >
                      <Plus className="h-4 w-4 mr-1" />
                      Ajouter
                    </Button>
                  )}
                </div>

                {day.blocks.length === 0 ? (
                  <p className="text-sm text-muted-foreground">Non travaillé</p>
                ) : (
                  <div className="space-y-2">
                    {day.blocks.map((block, idx) => {
                      const blockIndex = editMode
                        ? localHours.findIndex(
                            (h) =>
                              h.weekday === day.value &&
                              h.startTime === block.startTime &&
                              h.endTime === block.endTime
                          )
                        : -1;

                      return (
                        <div
                          key={idx}
                          className="flex items-center gap-2 bg-muted/50 p-2 rounded"
                        >
                          {editMode ? (
                            <>
                              <Select
                                value={block.startTime}
                                onValueChange={(value) =>
                                  updateBlock(blockIndex, { startTime: value })
                                }
                              >
                                <SelectTrigger className="w-[110px]">
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
                              <span>-</span>
                              <Select
                                value={block.endTime}
                                onValueChange={(value) =>
                                  updateBlock(blockIndex, { endTime: value })
                                }
                              >
                                <SelectTrigger className="w-[110px]">
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
                              <div className="flex items-center gap-2 ml-auto">
                                <Switch
                                  checked={block.isActive}
                                  onCheckedChange={(checked) =>
                                    updateBlock(blockIndex, {
                                      isActive: checked,
                                    })
                                  }
                                />
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => removeBlock(blockIndex)}
                                >
                                  <Trash2 className="h-4 w-4 text-destructive" />
                                </Button>
                              </div>
                            </>
                          ) : (
                            <>
                              <span className="font-medium">
                                {block.startTime} - {block.endTime}
                              </span>
                              <span
                                className={`ml-auto text-sm ${
                                  block.isActive
                                    ? "text-green-600"
                                    : "text-muted-foreground"
                                }`}
                              >
                                {block.isActive ? "Actif" : "Inactif"}
                              </span>
                            </>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            ))}
          </div>
        </ScrollArea>
      </CardContent>

      <AlertDialog open={showPresets} onOpenChange={setShowPresets}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Préréglages rapides</AlertDialogTitle>
            <AlertDialogDescription>
              Choisissez un préréglage pour configurer rapidement vos horaires
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="space-y-2">
            <Button
              variant="outline"
              className="w-full justify-start"
              onClick={() => applyPreset("weekdays")}
            >
              Lun-Ven 09:00-17:00
            </Button>
            <Button
              variant="outline"
              className="w-full justify-start"
              onClick={() => applyPreset("copy-monday")}
            >
              <Copy className="h-4 w-4 mr-2" />
              Copier lundi sur toute la semaine
            </Button>
            <Button
              variant="outline"
              className="w-full justify-start text-destructive"
              onClick={() => applyPreset("clear")}
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Effacer tous les horaires
            </Button>
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Card>
  );
}
