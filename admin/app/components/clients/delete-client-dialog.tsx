"use client";

import { useState } from "react";
import { Button } from "@/app/components/ui/button";
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
import { deleteClient } from "@/lib/actions/clients";
import { Trash2 } from "lucide-react";

interface Client {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
}

interface DeleteClientDialogProps {
  client: Client;
  onClientDeleted?: () => void;
}

export function DeleteClientDialog({
  client,
  onClientDeleted,
}: DeleteClientDialogProps) {
  const [loading, setLoading] = useState(false);

  async function handleDelete() {
    setLoading(true);

    try {
      const result = await deleteClient(client.id);
      if (result.success) {
        if (onClientDeleted) {
          onClientDeleted();
        } else {
          window.location.reload();
        }
      } else {
        alert(result.error);
      }
    } catch (error) {
      console.error(error);
      alert("Une erreur est survenue lors de la suppression");
    } finally {
      setLoading(false);
    }
  }

  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button
          variant="ghost"
          className="h-8 w-8 p-0 text-red-600 hover:text-red-700 hover:bg-red-50"
        >
          <span className="sr-only">Delete</span>
          <Trash2 className="h-4 w-4" />
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Supprimer le client</AlertDialogTitle>
          <AlertDialogDescription>
            Êtes-vous sûr de vouloir supprimer le client{" "}
            <strong>
              {client.firstName} {client.lastName}
            </strong>{" "}
            ? Cette action est irréversible et supprimera également tous les
            rendez-vous, notes et documents associés à ce client.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Annuler</AlertDialogCancel>
          <AlertDialogAction
            onClick={handleDelete}
            disabled={loading}
            className="bg-red-600 hover:bg-red-700"
          >
            {loading ? "Suppression..." : "Supprimer"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
