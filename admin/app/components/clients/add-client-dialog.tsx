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
  DialogTrigger,
} from "@/app/components/ui/dialog";
import { Input } from "@/app/components/ui/input";
import { Label } from "@/app/components/ui/label";
import { Checkbox } from "@/app/components/ui/checkbox";
import { createClient } from "@/lib/actions/clients";
import { Plus } from "lucide-react";

interface AddClientDialogProps {
  onClientAdded?: (client: any) => void;
}

export function AddClientDialog({ onClientAdded }: AddClientDialogProps = {}) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault(); // Prevent the form from submitting to parent
    event.stopPropagation(); // Stop event bubbling

    // Store reference to form before async operation
    const form = event.currentTarget;
    const formData = new FormData(form);
    setLoading(true);

    try {
      const result = await createClient(formData);
      if (result.success) {
        setOpen(false);
        // Reset form using stored reference
        form.reset();
        // Call the callback if provided, otherwise reload
        if (onClientAdded) {
          onClientAdded(result.client);
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
      <DialogTrigger asChild>
        <Button>
          <Plus className="mr-2 h-4 w-4" />
          Ajouter un client
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Ajouter un nouveau client</DialogTitle>
          <DialogDescription>
            Saisissez les informations du client. Cliquez sur sauvegarder pour
            l&apos;ajouter.
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
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="preferredContact">Contact préféré</Label>
              <select
                id="preferredContact"
                name="preferredContact"
                className="col-span-3 flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                defaultValue="EMAIL"
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
                  defaultChecked={true}
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
                defaultValue={300}
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
                e.stopPropagation(); // Prevent event bubbling
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
