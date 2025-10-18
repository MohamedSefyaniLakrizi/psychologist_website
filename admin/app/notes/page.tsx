"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/app/components/ui/card";
import { Button } from "@/app/components/ui/button";
import {
  FileText,
  Plus,
  Calendar,
  User,
  Folder,
  ChevronRight,
} from "lucide-react";
import { toast } from "sonner";
import {
  getNotes,
  createNote,
  getClientsWithNotes,
  type Note,
  type ClientWithNotes,
} from "@/lib/actions/notes";
import { format } from "date-fns";
import { fr } from "date-fns/locale";

export default function NotesPage() {
  const router = useRouter();
  const [notes, setNotes] = useState<Note[]>([]);
  const [clientsWithNotes, setClientsWithNotes] = useState<ClientWithNotes[]>(
    []
  );
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [fetchedNotes, fetchedClientsWithNotes] = await Promise.all([
          getNotes(),
          getClientsWithNotes(),
        ]);
        setNotes(fetchedNotes);
        setClientsWithNotes(fetchedClientsWithNotes);
      } catch (error) {
        toast.error("Erreur lors du chargement des données");
        console.error("Error fetching data:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, []);

  // Helper function to extract preview text from Lexical content
  const getPreviewText = (content: any): string => {
    if (!content?.root?.children) return "";

    const extractTextFromNode = (node: any): string => {
      if (node.type === "text") {
        return node.text || "";
      }

      if (node.children && Array.isArray(node.children)) {
        return node.children
          .map((child: any) => extractTextFromNode(child))
          .join("")
          .trim();
      }

      return "";
    };

    // Get text from all children and take the first meaningful line
    const allText = content.root.children
      .map((child: any) => extractTextFromNode(child))
      .join(" ")
      .trim();

    const firstLine = allText.split("\n")[0].trim();
    return firstLine.length > 30
      ? firstLine.substring(0, 30) + "..."
      : firstLine;
  };

  const handleCreateNote = async () => {
    try {
      const newNote = await createNote({
        title: "Nouvelle note",
        content: {
          root: {
            children: [],
            direction: null,
            format: "",
            indent: 0,
            type: "root",
            version: 1,
          },
        },
      });

      router.push(`/notes/${newNote.id}`);
    } catch (error) {
      toast.error("Erreur lors de la création de la note");
      console.error("Error creating note:", error);
    }
  };

  const handleOpenNote = (noteId: string) => {
    router.push(`/notes/${noteId}`);
  };

  if (isLoading) {
    return (
      <div className="h-full w-full p-6">
        {/* Header Skeleton */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-2">
            <FileText className="h-6 w-6 text-primary" />
            <h1 className="text-2xl font-semibold">Notes</h1>
          </div>
        </div>

        {/* Recent Notes Loading */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <div className="h-6 bg-muted rounded w-32 animate-pulse"></div>
            <div className="h-8 bg-muted rounded w-20 animate-pulse"></div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <Card key={`recent-${i}`} className="w-full h-56 animate-pulse">
                <CardHeader className="pb-3">
                  <div className="h-6 bg-muted rounded w-3/4"></div>
                </CardHeader>
                <CardContent className="space-y-2">
                  <div className="h-4 bg-muted rounded w-1/2"></div>
                  <div className="h-4 bg-muted rounded w-2/3"></div>
                  <div className="mt-auto space-y-1">
                    <div className="h-3 bg-muted rounded w-1/3"></div>
                    <div className="h-3 bg-muted rounded w-1/4"></div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Clients Loading */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <div className="h-6 bg-muted rounded w-32 animate-pulse"></div>
            <div className="h-8 bg-muted rounded w-20 animate-pulse"></div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <Card key={`client-${i}`} className="w-full h-56 animate-pulse">
                <CardHeader className="pb-3">
                  <div className="flex items-center gap-2">
                    <div className="h-5 w-5 bg-muted rounded"></div>
                    <div className="h-6 bg-muted rounded w-3/4"></div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-2">
                  <div className="h-4 bg-muted rounded w-1/2"></div>
                  <div className="h-4 bg-muted rounded w-2/3"></div>
                  <div className="mt-auto">
                    <div className="h-3 bg-muted rounded w-1/3"></div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full w-full p-6">
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-2">
          <FileText className="h-6 w-6 text-primary" />
          <h1 className="text-2xl font-semibold">Notes</h1>
        </div>
      </div>

      {/* Recent Notes Section */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold">Notes récentes</h2>
          <Button
            variant="ghost"
            size="sm"
            className="gap-1"
            onClick={() => router.push("/notes/all")}
          >
            Voir plus
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {/* Create new note card */}
          <Card
            className="w-full h-56 border-dashed border-2 border-muted-foreground/25 hover:border-primary/50 transition-colors cursor-pointer group flex flex-col"
            onClick={handleCreateNote}
          >
            <CardContent className="flex flex-col items-center justify-center h-full text-muted-foreground group-hover:text-primary transition-colors">
              <Plus className="h-12 w-12 mb-3" />
              <span className="text-sm font-medium">Nouvelle note</span>
            </CardContent>
          </Card>

          {/* Recent notes (limit to 7 to show with create card) */}
          {notes.slice(0, 7).map((note) => (
            <Card
              key={note.id}
              className="w-full h-56 cursor-pointer hover:shadow-md transition-shadow flex flex-col gap-0"
              onClick={() => handleOpenNote(note.id)}
            >
              <CardHeader className="flex-shrink-0">
                <CardTitle className="text-base font-semibold line-clamp-2 h-12 leading-6">
                  {note.title}
                </CardTitle>
              </CardHeader>
              <CardContent className="flex-1 flex flex-col justify-between space-y-2">
                <div className="space-y-2 flex-1 flex flex-col justify-between">
                  {/* Note preview */}
                  {(() => {
                    const preview = getPreviewText(note.content);
                    return preview ? (
                      <p className="text-sm text-muted-foreground line-clamp-2 leading-relaxed">
                        {preview}
                      </p>
                    ) : (
                      <p className="text-sm text-muted-foreground italic">
                        Note vide
                      </p>
                    );
                  })()}

                  {note.client && (
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <User className="h-3 w-3 flex-shrink-0" />
                      <span className="truncate">
                        {note.client.firstName} {note.client.lastName}
                      </span>
                    </div>
                  )}

                  {note.appointment && (
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Calendar className="h-3 w-3 flex-shrink-0" />
                      <span className="truncate">
                        {format(new Date(note.appointment.startTime), "PPP", {
                          locale: fr,
                        })}
                      </span>
                    </div>
                  )}
                </div>

                <div className="space-y-1 flex-shrink-0">
                  <div className="text-xs text-muted-foreground">
                    Modifié le{" "}
                    {format(new Date(note.updatedAt), "dd/MM/yyyy", {
                      locale: fr,
                    })}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    Créé le{" "}
                    {format(new Date(note.createdAt), "dd/MM/yyyy", {
                      locale: fr,
                    })}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Clients with Notes Section */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold">Notes par client</h2>
          <Button
            variant="ghost"
            size="sm"
            className="gap-1"
            onClick={() => router.push("/notes/all")}
          >
            Voir plus
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {clientsWithNotes.slice(0, 8).map((client) => (
            <Card
              key={client.id}
              className="w-full h-56 cursor-pointer hover:shadow-md transition-shadow flex flex-col"
              onClick={() => router.push(`/notes/client/${client.id}`)}
            >
              <CardHeader className="pb-3 flex-shrink-0">
                <div className="flex items-center gap-2">
                  <Folder className="h-5 w-5 text-primary flex-shrink-0" />
                  <CardTitle className="text-base font-semibold line-clamp-1">
                    {client.firstName} {client.lastName}
                  </CardTitle>
                </div>
              </CardHeader>
              <CardContent className="flex-1 flex flex-col justify-between space-y-2">
                <div className="space-y-2 flex-1">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <FileText className="h-3 w-3 flex-shrink-0" />
                    <span>
                      {client.notesCount}{" "}
                      {client.notesCount === 1 ? "note" : "notes"}
                    </span>
                  </div>

                  {client.email && (
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <User className="h-3 w-3 flex-shrink-0" />
                      <span className="truncate">{client.email}</span>
                    </div>
                  )}
                </div>

                <div className="flex-shrink-0">
                  {client.lastNoteUpdated && (
                    <div className="text-xs text-muted-foreground">
                      Dernière note le{" "}
                      {format(new Date(client.lastNoteUpdated), "dd/MM/yyyy", {
                        locale: fr,
                      })}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}
