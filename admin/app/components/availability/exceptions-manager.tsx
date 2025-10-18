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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/app/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/app/components/ui/table";
import { Label } from "@/app/components/ui/label";
import { Input } from "@/app/components/ui/input";
import { Textarea } from "@/app/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/app/components/ui/select";
import { Calendar } from "@/app/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/app/components/ui/popover";
import { CalendarIcon, Plus, Trash2, Edit, Ban } from "lucide-react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { toast } from "sonner";
import { DateRange } from "react-day-picker";
import { cn } from "@/lib/utils";

interface Exception {
  id?: string;
  type: "FULL_DAY" | "PARTIAL_DAY" | "DATE_RANGE";
  startDate: Date;
  endDate?: Date;
  startTime?: string;
  endTime?: string;
  reason?: string;
}

interface ExceptionsManagerProps {
  exceptions: any[];
  onUpdate: () => void;
  loading: boolean;
}

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

export function ExceptionsManager({
  exceptions,
  onUpdate,
  loading,
}: ExceptionsManagerProps) {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingException, setEditingException] = useState<Exception | null>(
    null
  );
  const [formData, setFormData] = useState<Exception>({
    type: "FULL_DAY",
    startDate: new Date(),
    reason: "",
  });
  const [dateRange, setDateRange] = useState<DateRange | undefined>();
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);

  const openDialog = (exception?: any) => {
    if (exception) {
      setEditingException(exception);
      setFormData({
        id: exception.id,
        type: exception.type,
        startDate: new Date(exception.startDate),
        endDate: exception.endDate ? new Date(exception.endDate) : undefined,
        startTime: exception.startTime,
        endTime: exception.endTime,
        reason: exception.reason,
      });
      if (exception.type === "DATE_RANGE" && exception.endDate) {
        setDateRange({
          from: new Date(exception.startDate),
          to: new Date(exception.endDate),
        });
      }
    } else {
      setEditingException(null);
      setFormData({
        type: "FULL_DAY",
        startDate: new Date(),
        reason: "",
      });
      setDateRange(undefined);
    }
    setDialogOpen(true);
  };

  const closeDialog = () => {
    setDialogOpen(false);
    setEditingException(null);
    setFormData({
      type: "FULL_DAY",
      startDate: new Date(),
      reason: "",
    });
    setDateRange(undefined);
  };

  const handleSave = async () => {
    try {
      setSaving(true);

      // Validation
      if (formData.type === "PARTIAL_DAY") {
        if (!formData.startTime || !formData.endTime) {
          toast.error("Les heures sont requises pour une exception partielle");
          return;
        }
        if (formData.startTime >= formData.endTime) {
          toast.error("L'heure de début doit être avant l'heure de fin");
          return;
        }
      }

      if (formData.type === "DATE_RANGE") {
        if (!dateRange?.from || !dateRange?.to) {
          toast.error("Une plage de dates est requise");
          return;
        }
        formData.startDate = dateRange.from;
        formData.endDate = dateRange.to;
      }

      const url = editingException
        ? `/api/availability-exceptions/${editingException.id}`
        : "/api/availability-exceptions";

      const method = editingException ? "PUT" : "POST";

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: formData.type,
          startDate: formData.startDate.toISOString(),
          endDate: formData.endDate?.toISOString(),
          startTime: formData.startTime,
          endTime: formData.endTime,
          reason: formData.reason,
        }),
      });

      if (!response.ok) throw new Error("Failed to save");

      toast.success(
        editingException ? "Exception mise à jour" : "Exception ajoutée"
      );
      closeDialog();
      onUpdate();
    } catch (error) {
      console.error("Error saving exception:", error);
      toast.error("Erreur lors de la sauvegarde");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Êtes-vous sûr de vouloir supprimer cette exception ?"))
      return;

    try {
      setDeleting(id);
      const response = await fetch(`/api/availability-exceptions/${id}`, {
        method: "DELETE",
      });

      if (!response.ok) throw new Error("Failed to delete");

      toast.success("Exception supprimée");
      onUpdate();
    } catch (error) {
      console.error("Error deleting exception:", error);
      toast.error("Erreur lors de la suppression");
    } finally {
      setDeleting(null);
    }
  };

  const formatExceptionDate = (exception: any) => {
    const start = new Date(exception.startDate);
    if (exception.type === "DATE_RANGE" && exception.endDate) {
      const end = new Date(exception.endDate);
      return `${format(start, "dd/MM/yyyy")} - ${format(end, "dd/MM/yyyy")}`;
    }
    return format(start, "dd/MM/yyyy");
  };

  const formatExceptionTime = (exception: any) => {
    if (
      exception.type === "PARTIAL_DAY" &&
      exception.startTime &&
      exception.endTime
    ) {
      return `${exception.startTime} - ${exception.endTime}`;
    }
    return "Toute la journée";
  };

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle className="flex items-center gap-2">
              <Ban className="h-5 w-5" />
              Exceptions et congés
            </CardTitle>
            <Button size="sm" onClick={() => openDialog()} disabled={loading}>
              <Plus className="h-4 w-4 mr-1" />
              Ajouter
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-[600px]">
            {exceptions.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">
                Aucune exception définie
              </p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date(s)</TableHead>
                    <TableHead>Horaire</TableHead>
                    <TableHead>Raison</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {exceptions.map((exception) => (
                    <TableRow key={exception.id}>
                      <TableCell className="font-medium">
                        {formatExceptionDate(exception)}
                      </TableCell>
                      <TableCell>{formatExceptionTime(exception)}</TableCell>
                      <TableCell className="text-muted-foreground">
                        {exception.reason || "-"}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => openDialog(exception)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleDelete(exception.id)}
                            disabled={deleting === exception.id}
                          >
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </ScrollArea>
        </CardContent>
      </Card>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              {editingException
                ? "Modifier l'exception"
                : "Ajouter une exception"}
            </DialogTitle>
            <DialogDescription>
              Bloquez des créneaux horaires pour vos congés ou indisponibilités
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <Label>Type d&apos;exception</Label>
              <Select
                value={formData.type}
                onValueChange={(value: any) =>
                  setFormData({ ...formData, type: value })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="FULL_DAY">Journée complète</SelectItem>
                  <SelectItem value="PARTIAL_DAY">
                    Heures spécifiques
                  </SelectItem>
                  <SelectItem value="DATE_RANGE">Plage de dates</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {formData.type === "DATE_RANGE" ? (
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
                      <CalendarIcon className="mr-2 h-4 w-4" />
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
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {format(formData.startDate, "dd MMMM yyyy", {
                        locale: fr,
                      })}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar
                      mode="single"
                      selected={formData.startDate}
                      onSelect={(date) =>
                        date && setFormData({ ...formData, startDate: date })
                      }
                      locale={fr}
                    />
                  </PopoverContent>
                </Popover>
              </div>
            )}

            {formData.type === "PARTIAL_DAY" && (
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Heure de début</Label>
                  <Select
                    value={formData.startTime}
                    onValueChange={(value) =>
                      setFormData({ ...formData, startTime: value })
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
                    value={formData.endTime}
                    onValueChange={(value) =>
                      setFormData({ ...formData, endTime: value })
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
                placeholder="Ex: Vacances, rendez-vous médical..."
                value={formData.reason}
                onChange={(e) =>
                  setFormData({ ...formData, reason: e.target.value })
                }
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={closeDialog}>
              Annuler
            </Button>
            <Button onClick={handleSave} disabled={saving}>
              {saving ? "Enregistrement..." : "Enregistrer"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
