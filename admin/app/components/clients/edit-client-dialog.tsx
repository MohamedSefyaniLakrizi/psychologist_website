"use client";

import { useState } from "react";
import { Button } from "@/app/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/app/components/ui/dialog";
import { Input } from "@/app/components/ui/input";
import { Label } from "@/app/components/ui/label";
import { Checkbox } from "@/app/components/ui/checkbox";
import { updateClient } from "@/lib/actions/clients";
import { Edit2 } from "lucide-react";

interface Client {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phoneNumber: string;
  defaultRate: number;
  sendInvoiceAutomatically: boolean;
  preferredContact: string;
}

interface EditClientDialogProps {
  client: Client;
  onClientUpdated?: (client: any) => void;
}

export function EditClientDialog({
  client,
  onClientUpdated,
}: EditClientDialogProps) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    event.stopPropagation();

    const form = event.currentTarget;
    const formData = new FormData(form);
    setLoading(true);

    try {
      const result = await updateClient(client.id, formData);
      if (result.success) {
        setOpen(false);
        if (onClientUpdated) {
          onClientUpdated(result.client);
        } else {
          window.location.reload();
        }
      } else {
        alert(result.error);
      }
    } catch (error) {
      console.error(error);
      alert("Une erreur est survenue");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <Button
        variant="ghost"
        className="h-8 w-8 p-0"
        onClick={() => setOpen(true)}
      >
        <span className="sr-only">Edit</span>
        <Edit2 className="h-4 w-4" />
      </Button>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Modifier le client</DialogTitle>
          <DialogDescription>
            Modifiez les informations du client. Cliquez sur sauvegarder pour
            enregistrer les modifications.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="firstName" className="text-right">
                Prénom
              </Label>
              <Input
                id="firstName"
                name="firstName"
                className="col-span-3"
                defaultValue={client.firstName}
                required
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="lastName" className="text-right">
                Nom
              </Label>
              <Input
                id="lastName"
                name="lastName"
                className="col-span-3"
                defaultValue={client.lastName}
                required
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="email" className="text-right">
                Email
              </Label>
              <Input
                id="email"
                name="email"
                type="email"
                className="col-span-3"
                defaultValue={client.email}
                required
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="phoneNumber" className="text-right">
                Téléphone
              </Label>
              <Input
                id="phoneNumber"
                name="phoneNumber"
                type="tel"
                className="col-span-3"
                defaultValue={client.phoneNumber}
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="preferredContact">Contact préféré</Label>
              <select
                id="preferredContact"
                name="preferredContact"
                className="col-span-3 flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                defaultValue={client.preferredContact}
              >
                <option value="EMAIL">Email</option>
                <option value="PHONE">Téléphone</option>
                <option value="SMS">SMS</option>
                <option value="WHATSAPP">WhatsApp</option>
              </select>
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="sendInvoiceAutomatically">
                Facture automatique
              </Label>
              <div className="col-span-3 flex items-center space-x-2">
                <Checkbox
                  id="sendInvoiceAutomatically"
                  name="sendInvoiceAutomatically"
                  defaultChecked={client.sendInvoiceAutomatically}
                />
                <Label
                  htmlFor="sendInvoiceAutomatically"
                  className="text-xs text-muted-foreground"
                >
                  Envoyer automatiquement la facture après chaque séance
                </Label>
              </div>
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="defaultRate">Tarif par défaut (Dh)</Label>
              <Input
                id="defaultRate"
                name="defaultRate"
                type="number"
                defaultValue={client.defaultRate}
                className="col-span-3"
                min={0}
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              type="submit"
              disabled={loading}
              onClick={(e) => {
                e.stopPropagation();
              }}
            >
              {loading ? "Sauvegarde..." : "Sauvegarder"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
