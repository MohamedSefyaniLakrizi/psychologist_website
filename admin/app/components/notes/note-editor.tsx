"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { LexicalEditor } from "@/app/components/editor/lexical-editor";
import { Button } from "@/app/components/ui/button";
import { Input } from "@/app/components/ui/input";
import { Card, CardContent } from "@/app/components/ui/card";
import {
  Save,
  Trash2,
  User,
  Calendar,
  SquarePen,
  MoreHorizontal,
} from "lucide-react";
import { toast } from "sonner";
import {
  getNote,
  updateNote,
  deleteNote,
  getClientsForNotes,
  updateNoteClient,
  createNote,
  type Note,
  type Client,
} from "@/lib/actions/notes";
import { getAppointments } from "@/lib/actions/appointments";
import type { IEvent } from "@/app/components/calendar/interfaces";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/app/components/ui/alert-dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/app/components/ui/select";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/app/components/ui/tooltip";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from "@/app/components/ui/dropdown-menu";
// Export libraries
import { exportToPDF, exportToDOCX } from "@/lib/export-utils";

interface NoteEditorProps {
  noteId?: string;
  appointmentId?: string;
  onClose?: () => void;
  showHeader?: boolean;
  className?: string;
}

export default function NoteEditor({
  noteId,
  appointmentId,
  onClose,
  showHeader = true,
  className = "",
}: NoteEditorProps) {
  const [note, setNote] = useState<Note | null>(null);
  const [clients, setClients] = useState<Client[]>([]);
  const [appointments, setAppointments] = useState<IEvent[]>([]);
  const [clientAppointments, setClientAppointments] = useState<IEvent[]>([]);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState<any>(null);
  const [htmlContent, setHtmlContent] = useState<string>("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [autoSaveStatus, setAutoSaveStatus] = useState<
    "idle" | "saving" | "saved"
  >("idle");
  const [lastSavedTime, setLastSavedTime] = useState<Date | null>(null);

  // Auto-save debounce
  const autoSaveTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const lastSavedContentRef = useRef<string>("");
  const lastSavedTitleRef = useRef<string>("");

  // Track content changes for auto-save
  const contentString = content ? JSON.stringify(content) : "";

  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);

        // If we have a noteId, fetch existing note
        if (noteId) {
          const [fetchedNote, fetchedClients, fetchedAppointments] =
            await Promise.all([
              getNote(noteId),
              getClientsForNotes(),
              getAppointments(),
            ]);

          if (fetchedNote) {
            setNote(fetchedNote);
            setTitle(fetchedNote.title);
            setContent(fetchedNote.content);
          } else {
            toast.error("Note introuvable");
            return;
          }

          setClients(fetchedClients);
          setAppointments(fetchedAppointments);
        }
        // If we have appointmentId but no noteId, try to find or create note
        else if (appointmentId) {
          const [fetchedClients, fetchedAppointments] = await Promise.all([
            getClientsForNotes(),
            getAppointments(),
          ]);

          setClients(fetchedClients);
          setAppointments(fetchedAppointments);

          // Try to find existing note for this appointment
          try {
            const response = await fetch("/api/notes/get-or-create", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                appointmentId,
                title: "Note de séance",
              }),
            });

            if (response.ok) {
              const data = await response.json();
              if (data.id) {
                // Fetch the note
                const fetchedNote = await getNote(data.id);
                if (fetchedNote) {
                  setNote(fetchedNote);
                  setTitle(fetchedNote.title);
                  setContent(fetchedNote.content);
                }
              }
            }
          } catch (error) {
            console.error("Error fetching/creating note:", error);
            // Create default note structure
            setTitle("Note de séance");
            setContent({});
          }
        }
        // No noteId or appointmentId - create new note
        else {
          const [fetchedClients, fetchedAppointments] = await Promise.all([
            getClientsForNotes(),
            getAppointments(),
          ]);

          setClients(fetchedClients);
          setAppointments(fetchedAppointments);
          setTitle("Nouvelle note");
          setContent({});
        }
      } catch (error) {
        toast.error("Erreur lors du chargement de la note");
        console.error("Error fetching note:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [noteId, appointmentId]);

  // Filter appointments when client changes
  useEffect(() => {
    if (note?.client?.id && appointments.length > 0) {
      const filtered = appointments.filter(
        (appointment) => appointment.clientId === note.client?.id
      );
      setClientAppointments(filtered);
    } else {
      setClientAppointments([]);
    }
  }, [note?.client?.id, appointments]);

  // Auto-save function with debouncing
  const autoSave = useCallback(async () => {
    if (!content || !title) return;

    const currentContentString = JSON.stringify(content);
    const titleString = title.trim();

    // Check if content or title has actually changed
    if (
      currentContentString === lastSavedContentRef.current &&
      titleString === lastSavedTitleRef.current
    ) {
      setAutoSaveStatus("idle");
      return;
    }

    setAutoSaveStatus("saving");
    setIsSaving(true);

    try {
      let updatedNote;

      if (note?.id) {
        // Update existing note
        updatedNote = await updateNote(note.id, {
          title: titleString,
          content: content,
        });
      } else {
        // Create new note
        updatedNote = await createNote({
          title: titleString,
          content: content,
          appointmentId: appointmentId,
        });
      }

      setNote(updatedNote);
      lastSavedContentRef.current = currentContentString;
      lastSavedTitleRef.current = titleString;
      setHasUnsavedChanges(false);
      setAutoSaveStatus("saved");
      setLastSavedTime(new Date());

      // Reset to idle after 2 seconds
      setTimeout(() => {
        setAutoSaveStatus("idle");
      }, 2000);
    } catch (error) {
      console.error("Auto-save failed:", error);
      setAutoSaveStatus("idle");
    } finally {
      setIsSaving(false);
    }
  }, [note, content, title, appointmentId]);

  // Debounced auto-save effect for content changes
  useEffect(() => {
    if (!content || !contentString) return;

    // Skip if this is the initial load (content matches last saved)
    if (contentString === lastSavedContentRef.current) return;

    setHasUnsavedChanges(true);
    setAutoSaveStatus("idle");

    // Clear existing timeout
    if (autoSaveTimeoutRef.current) {
      clearTimeout(autoSaveTimeoutRef.current);
    }

    // Set new timeout for auto-save (2 seconds after user stops typing)
    autoSaveTimeoutRef.current = setTimeout(() => {
      autoSave();
    }, 2000);

    return () => {
      if (autoSaveTimeoutRef.current) {
        clearTimeout(autoSaveTimeoutRef.current);
      }
    };
  }, [contentString, autoSave, content]);

  // Auto-save title changes
  useEffect(() => {
    if (!title) return;

    // Skip if this is the initial load or title hasn't changed
    if (title === lastSavedTitleRef.current || (note && title === note.title))
      return;

    setHasUnsavedChanges(true);
    setAutoSaveStatus("idle");

    // Clear existing timeout
    if (autoSaveTimeoutRef.current) {
      clearTimeout(autoSaveTimeoutRef.current);
    }

    // Set new timeout for auto-save (1 second after user stops typing title)
    autoSaveTimeoutRef.current = setTimeout(() => {
      autoSave();
    }, 1000);

    return () => {
      if (autoSaveTimeoutRef.current) {
        clearTimeout(autoSaveTimeoutRef.current);
      }
    };
  }, [title, autoSave, note]);

  // Initialize last saved refs when note loads
  useEffect(() => {
    if (note && content) {
      const currentContentString = JSON.stringify(content);
      lastSavedContentRef.current = currentContentString;
      lastSavedTitleRef.current = title;
      setAutoSaveStatus("idle");
      setHasUnsavedChanges(false);
    }
  }, [note?.id, content, note, title]);

  const handleSave = async () => {
    if (!content) return;

    setIsSaving(true);
    setAutoSaveStatus("saving");
    try {
      let updatedNote;

      if (note?.id) {
        updatedNote = await updateNote(note.id, {
          title,
          content: content,
        });
      } else {
        updatedNote = await createNote({
          title,
          content: content,
          appointmentId: appointmentId,
        });
      }

      setNote(updatedNote);
      lastSavedContentRef.current = JSON.stringify(content);
      lastSavedTitleRef.current = title;
      setHasUnsavedChanges(false);
      setAutoSaveStatus("saved");
      setLastSavedTime(new Date());
      toast.success("Note sauvegardée avec succès");

      // Reset to idle after 2 seconds
      setTimeout(() => {
        setAutoSaveStatus("idle");
      }, 2000);
    } catch (error) {
      toast.error("Erreur lors de la sauvegarde");
      console.error("Error saving note:", error);
      setAutoSaveStatus("idle");
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!note?.id) return;

    try {
      await deleteNote(note.id);
      toast.success("Note supprimée avec succès");
      if (onClose) onClose();
    } catch (error) {
      toast.error("Erreur lors de la suppression");
      console.error("Error deleting note:", error);
    }
  };

  const handleTitleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsEditingTitle(false);
  };

  const handleTitleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault();
      setIsEditingTitle(false);
    } else if (e.key === "Escape") {
      setTitle(note?.title || "");
      setIsEditingTitle(false);
    }
  };

  const handleClientChange = async (clientId: string) => {
    if (!note?.id) return;

    try {
      const updatedNote = await updateNoteClient(
        note.id,
        clientId === "none" ? null : clientId
      );
      setNote(updatedNote);
      toast.success("Client mis à jour avec succès");
    } catch (error) {
      toast.error("Erreur lors de la mise à jour du client");
      console.error("Error updating client:", error);
    }
  };

  const handleAppointmentChange = async (appointmentId: string) => {
    if (!note?.id) return;

    try {
      const updatedNote = await updateNote(note.id, {
        title: note.title,
        content: note.content,
        appointmentId: appointmentId === "none" ? undefined : appointmentId,
      });
      setNote(updatedNote);
      toast.success("Rendez-vous mis à jour avec succès");
    } catch (error) {
      toast.error("Erreur lors de la mise à jour du rendez-vous");
      console.error("Error updating appointment:", error);
    }
  };

  const handleContentChange = useCallback(
    (editorContent: { html: string; json: any; editor?: any }) => {
      setContent(editorContent.json);
      setHtmlContent(editorContent.html);
    },
    []
  );

  const handleTitleChange = useCallback((newTitle: string) => {
    setTitle(newTitle);
  }, []);

  const handleExportPDF = async () => {
    if (!htmlContent || !title) {
      toast.error("Aucun contenu à exporter");
      return;
    }

    try {
      const message = await exportToPDF(htmlContent, title);
      toast.success(message);
    } catch (error) {
      console.error("Error exporting PDF:", error);
      toast.error("Erreur lors de l'export PDF");
    }
  };

  const handleExportDOCX = async () => {
    if (!htmlContent || !title) {
      toast.error("Aucun contenu à exporter");
      return;
    }

    try {
      const message = await exportToDOCX(htmlContent, title);
      toast.success(message);
    } catch (error) {
      console.error("Error exporting DOCX:", error);
      toast.error("Erreur lors de l'export DOCX");
    }
  };

  const getAutoSaveStatusText = () => {
    switch (autoSaveStatus) {
      case "saving":
        return "Auto-sauvegarde...";
      case "saved":
        return lastSavedTime
          ? `Sauvegardé à ${lastSavedTime.toLocaleTimeString("fr-FR", {
              hour: "2-digit",
              minute: "2-digit",
            })}`
          : "Sauvegardé";
      default:
        return "";
    }
  };

  if (isLoading) {
    return (
      <div className={`h-full w-full p-6 ${className}`}>
        <div className="animate-pulse space-y-4">
          <div className="flex items-center gap-4">
            <div className="h-8 w-8 bg-muted rounded"></div>
            <div className="h-8 bg-muted rounded w-1/3"></div>
          </div>
          <div className="h-12 bg-muted rounded w-1/2"></div>
          <div className="h-96 bg-muted rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <TooltipProvider>
      <div className={`h-full w-full p-6 ${className}`}>
        <div className="h-full flex flex-col">
          {/* Header */}
          {showHeader && (
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-4">
                {onClose && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={onClose}
                    className="gap-2"
                  >
                    Fermer
                  </Button>
                )}
              </div>

              <div className="flex items-center gap-2">
                {autoSaveStatus !== "idle" && (
                  <span
                    className={`text-xs flex items-center gap-1 ${
                      autoSaveStatus === "saving"
                        ? "text-blue-600"
                        : "text-green-600"
                    }`}
                  >
                    {autoSaveStatus === "saving" && (
                      <div className="w-3 h-3 border border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                    )}
                    {getAutoSaveStatusText()}
                  </span>
                )}

                {note?.id && (
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button variant="outline" size="sm" className="gap-2">
                        <Trash2 className="h-4 w-4" />
                        Supprimer
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Supprimer la note</AlertDialogTitle>
                        <AlertDialogDescription>
                          Êtes-vous sûr de vouloir supprimer cette note ? Cette
                          action est irréversible.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Annuler</AlertDialogCancel>
                        <AlertDialogAction
                          onClick={handleDelete}
                          className="bg-destructive hover:bg-destructive/90"
                        >
                          Supprimer
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                )}

                <Button
                  onClick={handleSave}
                  disabled={isSaving || !hasUnsavedChanges}
                  className="gap-2"
                >
                  <Save className="h-4 w-4" />
                  {isSaving
                    ? "Sauvegarde..."
                    : hasUnsavedChanges
                      ? "Sauvegarder"
                      : "Sauvegardé"}
                </Button>

                {/* Export dropdown button */}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="outline"
                      size="icon"
                      aria-label="Plus d'actions"
                    >
                      <MoreHorizontal className="h-5 w-5" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={handleExportPDF}>
                      Exporter en PDF
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={handleExportDOCX}>
                      Exporter en DOCX
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>
          )}

          {/* Editable title */}
          <div className="mb-4">
            {isEditingTitle ? (
              <form onSubmit={handleTitleSubmit}>
                <Input
                  value={title}
                  onChange={(e) => handleTitleChange(e.target.value)}
                  onBlur={() => setIsEditingTitle(false)}
                  onKeyDown={handleTitleKeyDown}
                  className="text-2xl font-semibold border-none shadow-none p-1 w-auto h-auto"
                  autoFocus
                />
              </form>
            ) : (
              <h1
                className="text-2xl flex items-center gap-3 font-semibold cursor-pointer hover:bg-muted/50 p-2 rounded -m-2 group"
                onClick={() => setIsEditingTitle(true)}
              >
                {title || "Sans titre"}
                <SquarePen className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
              </h1>
            )}
          </div>

          {/* Note metadata */}
          <div className="flex items-center gap-6 mb-4 text-sm flex-wrap">
            <div className="flex items-center gap-2">
              <User className="h-4 w-4 text-muted-foreground" />
              <Tooltip>
                <TooltipTrigger asChild>
                  <Select
                    value={note?.client?.id || "none"}
                    onValueChange={handleClientChange}
                    disabled={!note?.id}
                  >
                    <SelectTrigger className="w-[200px] h-8">
                      <SelectValue placeholder="Sélectionner un client" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">Aucun client</SelectItem>
                      {clients.map((client) => (
                        <SelectItem key={client.id} value={client.id}>
                          {client.firstName} {client.lastName}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Associer cette note à un client</p>
                </TooltipContent>
              </Tooltip>
            </div>

            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              <Tooltip>
                <TooltipTrigger asChild>
                  <Select
                    value={note?.appointment?.id || "none"}
                    onValueChange={handleAppointmentChange}
                    disabled={!note?.client?.id || !note?.id}
                  >
                    <SelectTrigger className="w-[250px] h-8">
                      <SelectValue placeholder="Sélectionner un rendez-vous" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">Aucun rendez-vous</SelectItem>
                      {clientAppointments.map((appointment) => (
                        <SelectItem key={appointment.id} value={appointment.id}>
                          {format(
                            new Date(appointment.startDate),
                            "PPP 'à' HH:mm",
                            {
                              locale: fr,
                            }
                          )}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </TooltipTrigger>
                <TooltipContent>
                  <p>
                    {note?.client?.id
                      ? "Associer cette note à un rendez-vous spécifique"
                      : "Sélectionnez d'abord un client pour voir ses rendez-vous"}
                  </p>
                </TooltipContent>
              </Tooltip>
            </div>

            {note?.updatedAt && (
              <div className="text-muted-foreground">
                Modifié le{" "}
                {format(new Date(note.updatedAt), "PPP 'à' HH:mm", {
                  locale: fr,
                })}
              </div>
            )}
          </div>

          {/* Editor */}
          <Card className="flex-1 flex flex-col py-0 w-full">
            <CardContent className="flex-1 p-0 w-full">
              <LexicalEditor
                className="h-full w-full"
                placeholder="Commencez à rédiger..."
                onChange={handleContentChange}
                initialValue={content}
              />
            </CardContent>
          </Card>
        </div>
      </div>
    </TooltipProvider>
  );
}
