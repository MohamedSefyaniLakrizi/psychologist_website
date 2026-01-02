import { Ban, AlertTriangleIcon } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
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
import { Button } from "@/app/components/ui/button";
import { Card, CardContent } from "@/app/components/ui/card";
import { Badge } from "@/app/components/ui/badge";
import { Separator } from "@/app/components/ui/separator";
import { useCalendar } from "@/app/components/calendar/contexts/calendar-context";
import type { IEvent } from "@/app/components/calendar/interfaces";
import { cancelAppointment } from "@/lib/actions/appointments";

interface CancelEventDialogProps {
  event: IEvent;
  onSuccess?: () => void;
}

export default function CancelEventDialog({
  event,
  onSuccess,
}: CancelEventDialogProps) {
  const { refreshEvents } = useCalendar();
  const [isOpen, setIsOpen] = useState(false);
  const [isCancelling, setIsCancelling] = useState(false);

  const cancelEvent = async () => {
    setIsCancelling(true);
    try {
      await cancelAppointment(event.id);

      // Show toast first
      toast.success(
        "Rendez-vous annulé avec succès. Email de confirmation envoyé."
      );
      console.log("Event cancelled");
      // Small delay to ensure toast is rendered before closing dialogs
      setTimeout(() => {
        // Close all dialogs instantly
        setIsOpen(false);
        refreshEvents();
        onSuccess?.();
      }, 100);
    } catch (error) {
      console.error("Error cancelling appointment:", error);
      toast.error("Erreur lors de l'annulation du rendez-vous.");
    } finally {
      setIsCancelling(false);
    }
  };

  const resetDialog = () => {
    setIsCancelling(false);
  };

  const handleOpenChange = (open: boolean) => {
    setIsOpen(open);
    if (!open) {
      resetDialog();
    }
  };

  if (!event) {
    return null;
  }

  return (
    <AlertDialog open={isOpen} onOpenChange={handleOpenChange}>
      <AlertDialogTrigger asChild>
        <Button variant="outline">
          <Ban className="w-4 h-4" />
          Annuler
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Annuler le rendez-vous</AlertDialogTitle>
          <AlertDialogDescription asChild>
            <div className="space-y-4">
              <div className="text-foreground">
                Vous êtes sur le point d'annuler ce rendez-vous. Un email de
                confirmation sera envoyé au client.
              </div>

              <Separator />

              <Card className="border-red-200 bg-red-50">
                <CardContent className="flex items-start gap-3">
                  <AlertTriangleIcon className="h-5 w-5 mt-0.5 flex-shrink-0 text-red-600" />
                  <div>
                    <p className="font-semibold text-sm text-red-800">
                      Notification envoyée
                    </p>
                    <p className="text-sm mt-1 text-red-700">
                      Le client recevra un email d'annulation avec les détails
                      du rendez-vous annulé.
                    </p>
                  </div>
                </CardContent>
              </Card>
            </div>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter className="flex items-center justify-between gap-3">
          <AlertDialogCancel
            onClick={() => handleOpenChange(false)}
            className="flex-1 sm:flex-none"
          >
            Fermer
          </AlertDialogCancel>

          <AlertDialogAction
            onClick={cancelEvent}
            disabled={isCancelling}
            className="flex-1 sm:flex-none bg-red-600 hover:bg-red-700 focus:ring-red-500 disabled:opacity-50"
          >
            {isCancelling ? (
              <>
                <div className="w-4 h-4 mr-2 animate-spin rounded-full border-2 border-white border-t-transparent" />
                Annulation...
              </>
            ) : (
              <>
                <Ban className="w-4 h-4" />
                Annuler
              </>
            )}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
