"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/app/components/ui/card";
import { Button } from "@/app/components/ui/button";
import { Input } from "@/app/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/app/components/ui/select";
import {
  FileText,
  Plus,
  User,
  ArrowLeft,
  Search,
  SortAsc,
  Link,
} from "lucide-react";
import { toast } from "sonner";
import {
  getNotes,
  createNote,
  getClientsForNotes,
  type Note,
  type Client,
} from "@/lib/actions/notes";
import { format } from "date-fns";
import { fr } from "date-fns/locale";

type SortOption = "updatedAt" | "createdAt" | "title";
type SortOrder = "asc" | "desc";

export default function ClientNotesPage() {
  const router = useRouter();
  const params = useParams();
  const clientId = params.clientId as string;

  const [notes, setNotes] = useState<Note[]>([]);
  const [filteredNotes, setFilteredNotes] = useState<Note[]>([]);
  const [client, setClient] = useState<Client | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Filters and sorting
  const [searchTerm, setSearchTerm] = useState("");
  const [sortBy, setSortBy] = useState<SortOption>("updatedAt");
  const [sortOrder, setSortOrder] = useState<SortOrder>("desc");
  const [hasAppointmentFilter, setHasAppointmentFilter] =
    useState<string>("all");

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [fetchedNotes, fetchedClients] = await Promise.all([
          getNotes(),
          getClientsForNotes(),
        ]);

        // Filter notes for this specific client
        const clientNotes = fetchedNotes.filter(
          (note) => note.client?.id === clientId
        );
        setNotes(clientNotes);

        // Find the client info
        const clientInfo = fetchedClients.find((c) => c.id === clientId);
        setClient(clientInfo || null);

        if (!clientInfo) {
          toast.error("Client introuvable");
          router.push("/notes");
        }
      } catch (error) {
        toast.error("Erreur lors du chargement des données");
        console.error("Error fetching data:", error);
      } finally {
        setIsLoading(false);
      }
    };

    if (clientId) {
      fetchData();
    }
  }, [clientId, router]);

  // Filter and sort notes
  useEffect(() => {
    let filtered = [...notes];

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter((note) =>
        note.title.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Appointment filter
    if (hasAppointmentFilter !== "all") {
      if (hasAppointmentFilter === "with") {
        filtered = filtered.filter((note) => note.appointment);
      } else {
        filtered = filtered.filter((note) => !note.appointment);
      }
    }

    // Sort
    filtered.sort((a, b) => {
      let aValue: any;
      let bValue: any;

      switch (sortBy) {
        case "title":
          aValue = a.title.toLowerCase();
          bValue = b.title.toLowerCase();
          break;
        case "createdAt":
          aValue = new Date(a.createdAt).getTime();
          bValue = new Date(b.createdAt).getTime();
          break;
        case "updatedAt":
        default:
          aValue = new Date(a.updatedAt).getTime();
          bValue = new Date(b.updatedAt).getTime();
          break;
      }

      if (sortOrder === "asc") {
        return aValue < bValue ? -1 : aValue > bValue ? 1 : 0;
      } else {
        return aValue > bValue ? -1 : aValue < bValue ? 1 : 0;
      }
    });

    setFilteredNotes(filtered);
  }, [notes, searchTerm, sortBy, sortOrder, hasAppointmentFilter]);

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
        clientId: clientId,
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
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <div className="h-8 w-16 bg-muted rounded animate-pulse"></div>
            <div className="flex items-center gap-2">
              <FileText className="h-6 w-6 text-primary" />
              <h1 className="text-2xl font-semibold">Notes du client</h1>
            </div>
          </div>
          <div className="h-10 w-32 bg-muted rounded animate-pulse"></div>
        </div>

        {/* Client Info Skeleton */}
        <div className="mb-6 p-4 bg-muted/30 rounded-lg">
          <div className="flex items-center gap-4">
            <div className="h-8 w-8 bg-muted rounded animate-pulse"></div>
            <div className="space-y-2">
              <div className="h-5 w-32 bg-muted rounded animate-pulse"></div>
              <div className="h-4 w-48 bg-muted rounded animate-pulse"></div>
            </div>
          </div>
        </div>

        {/* Filters and Search Skeleton */}
        <div className="mb-6 space-y-4">
          <div className="flex flex-col sm:flex-row gap-4">
            {/* Search Skeleton */}
            <div className="h-10 flex-1 bg-muted rounded animate-pulse"></div>
            {/* Mobile Create Button Skeleton */}
            <div className="h-10 w-32 bg-muted rounded animate-pulse sm:hidden"></div>
          </div>

          <div className="flex flex-col sm:flex-row gap-4">
            {/* Filter Dropdowns Skeleton */}
            <div className="h-10 w-full sm:w-[200px] bg-muted rounded animate-pulse"></div>
            <div className="h-10 w-full sm:w-[200px] bg-muted rounded animate-pulse"></div>
            <div className="h-10 w-10 bg-muted rounded animate-pulse flex-shrink-0"></div>
          </div>
        </div>

        {/* Results Count Skeleton */}
        <div className="mb-4">
          <div className="h-4 w-32 bg-muted rounded animate-pulse"></div>
        </div>

        {/* Notes Grid Skeleton */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <Card key={i} className="w-full h-56 animate-pulse">
              <CardHeader className="pb-3">
                <div className="h-6 bg-muted rounded w-3/4"></div>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="h-4 bg-muted rounded w-1/2"></div>
                <div className="mt-auto space-y-1">
                  <div className="h-3 bg-muted rounded w-1/3"></div>
                  <div className="h-3 bg-muted rounded w-1/4"></div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  if (!client) {
    return (
      <div className="h-full w-full p-6 flex items-center justify-center">
        <div className="text-center">
          <User className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-medium text-muted-foreground">
            Client introuvable
          </h3>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full w-full p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.push("/notes")}
            className="gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Retour
          </Button>
          <div className="flex items-center gap-2">
            <User className="h-6 w-6 text-primary" />
            <h1 className="text-2xl font-semibold">
              Notes de {client.firstName} {client.lastName}
            </h1>
          </div>
        </div>
        <Button onClick={handleCreateNote} className="gap-2">
          <Plus className="h-4 w-4" />
          Nouvelle note
        </Button>
      </div>

      {/* Client Info */}
      <div className="mb-6 p-4 bg-muted/30 rounded-lg">
        <div className="flex items-center gap-4">
          <User className="h-8 w-8 text-primary" />
          <div>
            <h2 className="font-semibold">
              {client.firstName} {client.lastName}
            </h2>
            {client.email && (
              <p className="text-sm text-muted-foreground">{client.email}</p>
            )}
          </div>
        </div>
      </div>

      {/* Filters and Search */}
      <div className="mb-6 space-y-4">
        <div className="flex flex-col sm:flex-row gap-4">
          {/* Search */}
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Rechercher par titre..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>

          {/* Create Note Button on mobile */}
          <Button onClick={handleCreateNote} className="gap-2 sm:hidden">
            <Plus className="h-4 w-4" />
            Nouvelle note
          </Button>
        </div>

        <div className="flex flex-col sm:flex-row gap-4">
          {/* Appointment Filter */}
          <Select
            value={hasAppointmentFilter}
            onValueChange={setHasAppointmentFilter}
          >
            <SelectTrigger className="w-full sm:w-[200px]">
              <SelectValue placeholder="Lié à un RDV" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tous</SelectItem>
              <SelectItem value="with">Avec RDV</SelectItem>
              <SelectItem value="without">Sans RDV</SelectItem>
            </SelectContent>
          </Select>

          {/* Sort By */}
          <Select
            value={sortBy}
            onValueChange={(value: SortOption) => setSortBy(value)}
          >
            <SelectTrigger className="w-full sm:w-[200px]">
              <SelectValue placeholder="Trier par" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="updatedAt">Dernière modification</SelectItem>
              <SelectItem value="createdAt">Date de création</SelectItem>
              <SelectItem value="title">Titre</SelectItem>
            </SelectContent>
          </Select>

          {/* Sort Order */}
          <Button
            variant="outline"
            size="icon"
            onClick={() => setSortOrder(sortOrder === "asc" ? "desc" : "asc")}
            className="flex-shrink-0"
          >
            <SortAsc
              className={`h-4 w-4 ${sortOrder === "desc" ? "rotate-180" : ""}`}
            />
          </Button>
        </div>
      </div>

      {/* Results Count */}
      <div className="mb-4 text-sm text-muted-foreground">
        {filteredNotes.length} note{filteredNotes.length !== 1 ? "s" : ""}{" "}
        trouvée{filteredNotes.length !== 1 ? "s" : ""}
      </div>

      {/* Notes Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {filteredNotes.map((note) => (
          <Card
            key={note.id}
            className="w-full h-56 cursor-pointer hover:shadow-md transition-shadow flex flex-col"
            onClick={() => handleOpenNote(note.id)}
          >
            <CardHeader className="pb-3 flex-shrink-0">
              <CardTitle className="text-base font-semibold line-clamp-2 h-12 leading-6">
                {note.title}
              </CardTitle>
            </CardHeader>
            <CardContent className="flex-1 flex flex-col justify-between space-y-2">
              <div className="space-y-2 flex-1">
                {note.appointment && (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Link className="h-3 w-3 flex-shrink-0" />
                    <span className="truncate">
                      RDV{" "}
                      {format(
                        new Date(note.appointment.startTime),
                        "dd/MM/yyyy",
                        {
                          locale: fr,
                        }
                      )}
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

      {/* Empty State */}
      {filteredNotes.length === 0 && !isLoading && (
        <div className="text-center py-12">
          <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-medium text-muted-foreground mb-2">
            Aucune note trouvée
          </h3>
          <p className="text-sm text-muted-foreground mb-4">
            {searchTerm || hasAppointmentFilter !== "all"
              ? "Essayez de modifier vos filtres ou créez une nouvelle note."
              : `Aucune note pour ${client.firstName} ${client.lastName}. Créez la première note !`}
          </p>
          <Button onClick={handleCreateNote} className="gap-2">
            <Plus className="h-4 w-4" />
            Créer une note pour {client.firstName}
          </Button>
        </div>
      )}
    </div>
  );
}
