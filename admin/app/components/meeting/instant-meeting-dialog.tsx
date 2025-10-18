"use client";

import { useState, useEffect } from "react";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/app/components/ui/select";
import { Input } from "@/app/components/ui/input";
import { Label } from "@/app/components/ui/label";
import { Checkbox } from "@/app/components/ui/checkbox";
import { Plus, Video } from "lucide-react";
import { toast } from "sonner";
import { getClients } from "@/lib/actions/appointments";
import type { IUser } from "@/app/components/calendar/interfaces";

interface InstantMeetingDialogProps {
  onMeetingCreated?: (hostUrl: string) => void;
}

export function InstantMeetingDialog({
  onMeetingCreated,
}: InstantMeetingDialogProps) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [clients, setClients] = useState<IUser[]>([]);
  const [loadingClients, setLoadingClients] = useState(false);

  // Form state
  const [selectedClientId, setSelectedClientId] = useState<string>("");
  const [duration, setDuration] = useState<string>("60"); // Default 1 hour
  const [customDuration, setCustomDuration] = useState<string>("");
  const [price, setPrice] = useState<string>("");
  const [useDefaultRate, setUseDefaultRate] = useState<boolean>(true);

  useEffect(() => {
    if (open) {
      loadClients();
    }
  }, [open]);

  const loadClients = async () => {
    try {
      setLoadingClients(true);
      const clientsList = await getClients();
      setClients(clientsList);
    } catch (error) {
      console.error("Error loading clients:", error);
      toast.error("Erreur lors du chargement des clients");
    } finally {
      setLoadingClients(false);
    }
  };

  // Update price when client is selected and use default rate is enabled
  useEffect(() => {
    if (selectedClientId && useDefaultRate) {
      const selectedClient = clients.find(
        (client) => client.id === selectedClientId
      );
      if (selectedClient?.defaultRate) {
        setPrice(selectedClient.defaultRate.toString());
      }
    }
  }, [selectedClientId, clients, useDefaultRate]);

  const getDurationInMinutes = (): number => {
    if (duration === "other") {
      return parseInt(customDuration) || 60;
    }
    return parseInt(duration);
  };

  const createInstantMeeting = async () => {
    if (!selectedClientId) {
      toast.error("Veuillez sélectionner un client");
      return;
    }

    const durationMinutes = getDurationInMinutes();
    if (durationMinutes < 15 || durationMinutes > 480) {
      toast.error("La durée doit être entre 15 minutes et 8 heures");
      return;
    }

    const priceValue = parseInt(price);
    if (!price || priceValue <= 0) {
      toast.error("Veuillez saisir un prix valide");
      return;
    }

    try {
      setLoading(true);

      // Calculate start and end times
      const now = new Date();
      const startTime = now.toISOString();
      const endTime = new Date(
        now.getTime() + durationMinutes * 60 * 1000
      ).toISOString();

      // Create instant appointment
      const response = await fetch("/api/appointments/instant", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          clientId: selectedClientId,
          startTime,
          endTime,
          format: "ONLINE",
          customRate: priceValue,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to create instant appointment");
      }

      const appointment = await response.json();

      toast.success("Réunion instantanée créée et email envoyé au client !");

      // Reset form
      setSelectedClientId("");
      setDuration("60");
      setCustomDuration("");
      setPrice("");
      setUseDefaultRate(true);
      setOpen(false);

      // Call callback with host URL if provided
      if (onMeetingCreated && appointment.hostJoinUrl) {
        onMeetingCreated(appointment.hostJoinUrl);
      }
    } catch (error) {
      console.error("Error creating instant meeting:", error);
      toast.error("Erreur lors de la création de la réunion instantanée");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="gap-2">
          <Plus className="h-4 w-4" />
          Créer une réunion instantanée
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Video className="h-5 w-5" />
            Créer une réunion instantanée
          </DialogTitle>
          <DialogDescription>
            Sélectionnez un client et la durée de la réunion. Un email avec le
            lien sera automatiquement envoyé au client.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 py-4">
          {/* Client Selection */}
          <div className="space-y-2">
            <Label htmlFor="client">Client</Label>
            {loadingClients ? (
              <div className="text-sm text-muted-foreground">
                Chargement des clients...
              </div>
            ) : (
              <Select
                value={selectedClientId}
                onValueChange={setSelectedClientId}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Choisir un client" />
                </SelectTrigger>
                <SelectContent>
                  {clients.map((client) => (
                    <SelectItem key={client.id} value={client.id}>
                      {client.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>

          {/* Duration Selection */}
          <div className="space-y-2">
            <Label htmlFor="duration">Durée de la réunion</Label>
            <Select value={duration} onValueChange={setDuration}>
              <SelectTrigger>
                <SelectValue placeholder="Choisir la durée" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="30">30 minutes</SelectItem>
                <SelectItem value="60">1 heure</SelectItem>
                <SelectItem value="120">2 heures</SelectItem>
                <SelectItem value="other">Autre durée</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Custom Duration Input */}
          {duration === "other" && (
            <div className="space-y-2">
              <Label htmlFor="customDuration">
                Durée personnalisée (minutes)
              </Label>
              <Input
                id="customDuration"
                type="number"
                min="15"
                max="480"
                placeholder="60"
                value={customDuration}
                onChange={(e) => setCustomDuration(e.target.value)}
              />
            </div>
          )}

          {selectedClientId && (
            <div className="space-y-3">
              <Label>Prix de la séance</Label>

              {/* Use Default Rate Checkbox */}

              <div className="flex items-center space-x-2">
                <Checkbox
                  id="useDefaultRate"
                  checked={useDefaultRate}
                  onCheckedChange={(checked) =>
                    setUseDefaultRate(checked === true)
                  }
                />
                <Label
                  htmlFor="useDefaultRate"
                  className="text-sm font-normal cursor-pointer"
                >
                  Utiliser le tarif par défaut du client
                  {(() => {
                    const selectedClient = clients.find(
                      (c) => c.id === selectedClientId
                    );
                    return selectedClient?.defaultRate
                      ? ` (${selectedClient.defaultRate} Dh)`
                      : "";
                  })()}
                </Label>
              </div>

              {/* Custom Price Input */}
              {(!useDefaultRate || !selectedClientId) && (
                <div className="space-y-2">
                  <Label htmlFor="price">Prix personnalisé</Label>
                  <Input
                    id="price"
                    type="number"
                    min="1"
                    placeholder="300"
                    value={price}
                    onChange={(e) => setPrice(e.target.value)}
                  />
                </div>
              )}
            </div>
          )}
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => setOpen(false)}
            disabled={loading}
          >
            Annuler
          </Button>
          <Button
            onClick={createInstantMeeting}
            disabled={loading || !selectedClientId || loadingClients || !price}
          >
            {loading ? "Création..." : "Créer la réunion"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
