"use client";

import { format } from "date-fns";
import { fr } from "date-fns/locale";
import {
  Calendar,
  Clock,
  User,
  DollarSign,
  Monitor,
  FileText,
  Plus,
  CheckCircle,
  CreditCard,
} from "lucide-react";
import type { ReactNode } from "react";
import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/app/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/app/components/ui/select";
import { Switch } from "@/app/components/ui/switch";
import { Label } from "@/app/components/ui/label";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/app/components/ui/dialog";
import { ScrollArea } from "@/app/components/ui/scroll-area";
import { useCalendar } from "@/app/components/calendar/contexts/calendar-context";
import { AddEditAppointmentDialog } from "@/app/components/calendar/dialogs/add-edit-appointment-dialog";
import DeleteEventDialog from "@/app/components/calendar/dialogs/delete-event-dialog";
import { formatTime } from "@/app/components/calendar/helpers";
import type { IEvent } from "@/app/components/calendar/interfaces";
import {
  getNotesByAppointmentId,
  createNote,
  type Note,
} from "@/lib/actions/notes";
import { updateAppointmentStatusAndPayment } from "@/lib/actions/appointments";
import { toast } from "sonner";
import {
  getInvoices,
  updateInvoice,
  type Invoice,
} from "@/lib/actions/invoices";

interface IProps {
  event: IEvent;
  children: ReactNode;
}

export function EventDetailsDialog({ event, children }: IProps) {
  const startDate = event.startDate;
  const endDate = event.endDate;
  const { use24HourFormat, refreshEvents } = useCalendar();
  const [isOpen, setIsOpen] = useState(false);
  const [notes, setNotes] = useState<Note[]>([]);
  const [isLoadingNotes, setIsLoadingNotes] = useState(false);
  const [isCreatingNote, setIsCreatingNote] = useState(false);
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);
  const [localEvent, setLocalEvent] = useState(event);
  const [invoice, setInvoice] = useState<Invoice | null>(null);
  const [isLoadingInvoice, setIsLoadingInvoice] = useState(false);
  const router = useRouter();

  const loadNotes = useCallback(async () => {
    setIsLoadingNotes(true);
    try {
      const appointmentNotes = await getNotesByAppointmentId(event.id);
      setNotes(appointmentNotes);
    } catch (error) {
      console.error("Error loading notes:", error);
      toast.error("Erreur lors du chargement des notes");
    } finally {
      setIsLoadingNotes(false);
    }
  }, [event.id]);

  const loadInvoice = useCallback(async () => {
    setIsLoadingInvoice(true);
    try {
      const all = await getInvoices();
      const found = all.find((inv) => inv.appointment?.id === event.id);
      if (found) {
        setInvoice(found);
      } else {
        setInvoice(null);
      }
    } catch (error) {
      console.error("Error loading invoice:", error);
      toast.error("Erreur lors du chargement de la facture");
    } finally {
      setIsLoadingInvoice(false);
    }
  }, [event.id]);

  // Load notes when dialog opens
  useEffect(() => {
    if (isOpen) {
      loadNotes();
      loadInvoice();
    }
  }, [isOpen, event.id, loadNotes, loadInvoice]);

  // Update local event when prop changes
  useEffect(() => {
    setLocalEvent(event);
  }, [event]);

  const handleCreateNote = async () => {
    setIsCreatingNote(true);
    try {
      const newNote = await createNote({
        title: "Nouvelle note",
        content: {
          root: {
            children: [
              {
                children: [],
                direction: null,
                format: "",
                indent: 0,
                type: "paragraph",
                version: 1,
              },
            ],
            direction: null,
            format: "",
            indent: 0,
            type: "root",
            version: 1,
          },
        },
        clientId: localEvent.clientId,
        appointmentId: localEvent.id,
      });

      toast.success("Note créée avec succès");
      setIsOpen(false);
      router.push(`/notes/${newNote.id}`);
    } catch (error) {
      console.error("Error creating note:", error);
      toast.error("Erreur lors de la création de la note");
    } finally {
      setIsCreatingNote(false);
    }
  };

  const handleNoteClick = (noteId: string) => {
    setIsOpen(false);
    router.push(`/notes/${noteId}`);
  };

  const handleStatusChange = async (
    newStatus: "NOT_YET_ATTENDED" | "ATTENDED" | "ABSENT" | "CANCELLED"
  ) => {
    setIsUpdatingStatus(true);
    try {
      const updatedEvent = await updateAppointmentStatusAndPayment(
        localEvent.id,
        {
          status: newStatus,
        }
      );
      setLocalEvent(updatedEvent);
      // Refresh the calendar to show updated colors across all views
      await refreshEvents();
      toast.success("Statut mis à jour avec succès");
    } catch (error) {
      console.error("Error updating status:", error);
      toast.error("Erreur lors de la mise à jour du statut");
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  const handlePaymentChange = async (paid: boolean) => {
    setIsUpdatingStatus(true);
    try {
      if (!invoice) {
        toast.error("Aucune facture liée pour mettre à jour le paiement");
        return;
      }

      // When toggling to paid => set PAID. When toggling to unpaid => set to OVERDUE if session end is after now, otherwise UNPAID
      const now = new Date();
      const sessionEnd = new Date(localEvent.endDate);
      const newStatus = paid ? "PAID" : sessionEnd > now ? "OVERDUE" : "UNPAID";

      const updated = await updateInvoice(invoice.id, { status: newStatus });
      setInvoice(updated);
      // Update local event paid flag for UI compatibility
      setLocalEvent((prev) => ({ ...prev, paid: newStatus === "PAID" }));
      await refreshEvents();
      toast.success(
        `Statut de paiement mis à jour: ${newStatus === "PAID" ? "Payé" : "Non payé"}`
      );
    } catch (error) {
      console.error("Error updating payment status:", error);
      toast.error("Erreur lors de la mise à jour du statut de paiement");
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{localEvent.title}</DialogTitle>
        </DialogHeader>

        <ScrollArea className="max-h-[80vh]">
          <div className="space-y-4 p-4">
            <div className="flex items-start gap-2">
              <User className="mt-1 size-4 shrink-0 text-muted-foreground" />
              <div>
                <p className="text-sm font-medium">Client</p>
                <p className="text-sm text-muted-foreground">
                  {localEvent.user.name}
                </p>
              </div>
            </div>

            <div className="flex items-start gap-2">
              <Calendar className="mt-1 size-4 shrink-0 text-muted-foreground" />
              <div>
                <p className="text-sm font-medium">Heure de début</p>
                <p className="text-sm text-muted-foreground">
                  {format(startDate, "EEEE dd MMMM", { locale: fr })}
                  <span className="mx-1">à</span>
                  {formatTime(localEvent.startDate, use24HourFormat)}
                </p>
              </div>
            </div>

            <div className="flex items-start gap-2">
              <Clock className="mt-1 size-4 shrink-0 text-muted-foreground" />
              <div>
                <p className="text-sm font-medium">Heure de fin</p>
                <p className="text-sm text-muted-foreground">
                  {format(endDate, "EEEE dd MMMM", { locale: fr })}
                  <span className="mx-1">à</span>
                  {formatTime(localEvent.endDate, use24HourFormat)}
                </p>
              </div>
            </div>

            <div className="flex items-start gap-2">
              <Monitor className="mt-1 size-4 shrink-0 text-muted-foreground" />
              <div>
                <p className="text-sm font-medium">Format</p>
                <p className="text-sm text-muted-foreground">
                  {localEvent.format === "ONLINE"
                    ? "En ligne"
                    : "En présentiel"}
                </p>
              </div>
            </div>

            <div className="flex items-start gap-2">
              <CheckCircle className="mt-1 size-4 shrink-0 text-muted-foreground" />
              <div className="flex-1">
                <p className="text-sm font-medium">Statut</p>
                <div className="flex items-center gap-2 mt-1">
                  <Select
                    value={localEvent.status || "NOT_YET_ATTENDED"}
                    onValueChange={handleStatusChange}
                    disabled={isUpdatingStatus}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="NOT_YET_ATTENDED">À venir</SelectItem>
                      <SelectItem value="ATTENDED">Fait</SelectItem>
                      <SelectItem value="ABSENT">Absent</SelectItem>
                      <SelectItem value="CANCELLED">Annulé</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>

            <div className="flex items-start gap-2">
              <CreditCard className="mt-1 size-4 shrink-0 text-muted-foreground" />
              <div className="flex-1">
                <p className="text-sm font-medium">Paiement</p>
                <div className="flex items-center gap-2 mt-1">
                  <Switch
                    checked={
                      invoice
                        ? invoice.status === "PAID"
                        : localEvent.paid || false
                    }
                    onCheckedChange={handlePaymentChange}
                    disabled={isUpdatingStatus}
                  />
                  <Label className="text-sm text-muted-foreground">
                    {invoice
                      ? invoice.status === "PAID"
                        ? "Payé"
                        : "Non payé"
                      : localEvent.paid
                        ? "Payé"
                        : "Non payé"}
                  </Label>
                </div>
              </div>
            </div>

            <div className="flex items-start gap-2">
              <DollarSign className="mt-1 size-4 shrink-0 text-muted-foreground" />
              <div className="flex-1">
                <p className="text-sm font-medium">Tarif</p>
                {isLoadingInvoice ? (
                  <p className="text-sm text-muted-foreground">Chargement...</p>
                ) : invoice ? (
                  <p className="text-sm text-muted-foreground">
                    {invoice.amount} Dh
                  </p>
                ) : (
                  <p className="text-sm text-muted-foreground">
                    {localEvent.rate} Dh
                  </p>
                )}
              </div>
            </div>

            <div className="flex items-start gap-2">
              <FileText className="mt-1 size-4 shrink-0 text-muted-foreground" />
              <div className="flex-1">
                <p className="text-sm font-medium">Notes</p>
                {isLoadingNotes ? (
                  <p className="text-sm text-muted-foreground">
                    Chargement des notes...
                  </p>
                ) : notes.length > 0 ? (
                  <div className="space-y-2">
                    {notes.map((note) => (
                      <div
                        key={note.id}
                        className="border rounded-lg p-2 cursor-pointer hover:bg-muted/50 transition-colors"
                        onClick={() => handleNoteClick(note.id)}
                      >
                        <h4 className="text-sm font-medium text-foreground hover:text-primary">
                          {note.title}
                        </h4>
                        <p className="text-xs text-muted-foreground">
                          Modifié le{" "}
                          {format(new Date(note.updatedAt), "PPP 'à' HH:mm", {
                            locale: fr,
                          })}
                        </p>
                      </div>
                    ))}
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleCreateNote}
                      disabled={isCreatingNote}
                      className="gap-2 w-full"
                    >
                      <Plus className="h-3 w-3" />
                      {isCreatingNote
                        ? "Création..."
                        : "Créer une nouvelle note"}
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <p className="text-sm text-muted-foreground">
                      Aucune note pour ce rendez-vous
                    </p>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleCreateNote}
                      disabled={isCreatingNote}
                      className="gap-2"
                    >
                      <Plus className="h-3 w-3" />
                      {isCreatingNote ? "Création..." : "Créer une note"}
                    </Button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </ScrollArea>
        <div className="flex justify-end gap-2">
          <AddEditAppointmentDialog event={localEvent}>
            <Button variant="outline">Modifier</Button>
          </AddEditAppointmentDialog>
          <DeleteEventDialog
            event={localEvent}
            onSuccess={() => setIsOpen(false)}
          />
        </div>
        <DialogClose />
      </DialogContent>
    </Dialog>
  );
}
