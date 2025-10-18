"use client";

import { useState } from "react";
import { Button } from "@/app/components/ui/button";
import { Card, CardContent } from "@/app/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/app/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/app/components/ui/select";
import { Plus, User } from "lucide-react";
import { toast } from "sonner";
import { useCalendar } from "@/app/components/calendar/contexts/calendar-context";

interface CreateNoteDialogProps {
  onCreateNote: (clientId: string) => void;
}

export function CreateNoteDialog({ onCreateNote }: CreateNoteDialogProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedClientId, setSelectedClientId] = useState("");
  const { users } = useCalendar();

  const handleCreate = () => {
    if (!selectedClientId) {
      toast.error("Veuillez sélectionner un client");
      return;
    }

    onCreateNote(selectedClientId);
    setIsOpen(false);
    setSelectedClientId("");
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Card className="h-48 border-dashed border-2 border-muted-foreground/25 hover:border-primary/50 transition-colors cursor-pointer group">
          <CardContent className="flex flex-col items-center justify-center h-full text-muted-foreground group-hover:text-primary transition-colors">
            <Plus className="h-12 w-12 mb-2" />
            <span className="text-sm font-medium">Nouvelle note</span>
          </CardContent>
        </Card>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Créer une nouvelle note</DialogTitle>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <label htmlFor="client" className="text-sm font-medium">
              Client
            </label>
            <Select
              value={selectedClientId}
              onValueChange={setSelectedClientId}
            >
              <SelectTrigger>
                <SelectValue placeholder="Sélectionner un client" />
              </SelectTrigger>
              <SelectContent>
                {users.map((client) => (
                  <SelectItem key={client.id} value={client.id}>
                    <div className="flex items-center gap-2">
                      <User className="h-4 w-4" />
                      {client.name}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={() => setIsOpen(false)}>
            Annuler
          </Button>
          <Button onClick={handleCreate}>Créer la note</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
