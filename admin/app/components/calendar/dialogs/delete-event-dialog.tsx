import { TrashIcon, AlertTriangleIcon } from "lucide-react";
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
import { Label } from "@/app/components/ui/label";
import { Badge } from "@/app/components/ui/badge";
import { Separator } from "@/app/components/ui/separator";
import { RadioGroup, RadioGroupItem } from "@/app/components/ui/radio-group";
import { useCalendar } from "@/app/components/calendar/contexts/calendar-context";
import type { IEvent } from "@/app/components/calendar/interfaces";

interface DeleteEventDialogProps {
  event: IEvent;
  onSuccess?: () => void;
}

export default function DeleteEventDialog({
  event,
  onSuccess,
}: DeleteEventDialogProps) {
  const { removeEvent } = useCalendar();
  const [deleteMode, setDeleteMode] = useState<"single" | "series">("single");
  const [step, setStep] = useState<"mode-selection" | "confirmation">(
    "mode-selection"
  );
  const [isOpen, setIsOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const deleteEvent = async () => {
    setIsDeleting(true);
    try {
      await removeEvent(event.id, deleteMode);

      // Show toast first
      toast.success(
        deleteMode === "series"
          ? "Rendez-vous récurrents supprimés avec succès."
          : "Rendez-vous supprimé avec succès."
      );
      console.log("Event deleted");
      // Small delay to ensure toast is rendered before closing dialogs
      setTimeout(() => {
        // Close all dialogs instantly
        setIsOpen(false);
        onSuccess?.();
        resetDialog();
      }, 100);
    } catch {
      toast.error("Erreur lors de la suppression du rendez-vous.");
    } finally {
      setIsDeleting(false);
    }
  };

  const resetDialog = () => {
    setStep("mode-selection");
    setDeleteMode("single");
    setIsDeleting(false);
  };

  const handleOpenChange = (open: boolean) => {
    setIsOpen(open);
    if (!open) {
      resetDialog();
    }
  };

  const handleBack = () => {
    setStep("mode-selection");
  };

  if (!event) {
    return null;
  }

  const isFirstStep = step === "mode-selection";
  const isRecurring = event.isRecurring;

  return (
    <AlertDialog open={isOpen} onOpenChange={handleOpenChange}>
      <AlertDialogTrigger asChild>
        <Button variant="destructive">
          <TrashIcon className="w-4 h-4" />
          Supprimer
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>
            {isRecurring && isFirstStep && "Choisir le mode de suppression"}
            {isRecurring && !isFirstStep && "Confirmer la suppression"}
            {!isRecurring && "Supprimer le rendez-vous"}
          </AlertDialogTitle>
          <AlertDialogDescription asChild>
            <div>
              {isRecurring && isFirstStep ? (
                <div className="space-y-6">
                  <RadioGroup
                    value={deleteMode}
                    onValueChange={(value: "single" | "series") =>
                      setDeleteMode(value)
                    }
                    className="space-y-3"
                  >
                    <Card
                      className={`cursor-pointer transition-all hover:border-blue-300 ${
                        deleteMode === "single"
                          ? "border-blue-500 bg-blue-50"
                          : "border-border"
                      }`}
                      onClick={() => setDeleteMode("single")}
                    >
                      <CardContent>
                        <Label
                          htmlFor="single"
                          className="flex items-start gap-4 cursor-pointer"
                        >
                          <RadioGroupItem value="single" id="single" />
                          <div className="flex-1">
                            <div className="font-semibold text-foreground mb-1">
                              Ce rendez-vous uniquement
                            </div>
                            <div className="text-sm text-muted-foreground">
                              Supprimer seulement ce rendez-vous spécifique. Les
                              autres rendez-vous de la série restent inchangés.
                            </div>
                          </div>
                        </Label>
                      </CardContent>
                    </Card>

                    <Card
                      className={`cursor-pointer transition-all hover:border-red-300 ${
                        deleteMode === "series"
                          ? "border-red-500 bg-red-50"
                          : "border-border"
                      }`}
                      onClick={() => setDeleteMode("series")}
                    >
                      <CardContent>
                        <Label
                          htmlFor="series"
                          className="flex items-start gap-4 cursor-pointer"
                        >
                          <RadioGroupItem
                            value="series"
                            id="series"
                            className="mt-1"
                          />
                          <div className="flex-1">
                            <div className="font-semibold text-foreground mb-1">
                              Tous les rendez-vous récurrents
                            </div>
                            <div className="text-sm text-muted-foreground">
                              Supprimer complètement cette série récurrente.
                              Tous les rendez-vous passés et futurs seront
                              supprimés.
                            </div>
                          </div>
                        </Label>
                      </CardContent>
                    </Card>
                  </RadioGroup>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="text-foreground">
                    {isRecurring ? (
                      deleteMode === "series" ? (
                        <>
                          Vous êtes sur le point de supprimer{" "}
                          <Badge variant="destructive" className="mx-1">
                            tous les rendez-vous récurrents
                          </Badge>{" "}
                          de cette série.
                        </>
                      ) : (
                        <>
                          Vous êtes sur le point de supprimer{" "}
                          <Badge
                            variant="secondary"
                            className="mx-1 bg-orange-100 text-orange-800"
                          >
                            ce rendez-vous uniquement
                          </Badge>
                          .
                        </>
                      )
                    ) : (
                      <>Vous êtes sur le point de supprimer ce rendez-vous?</>
                    )}
                  </div>

                  <Separator />

                  <Card
                    className={`${
                      deleteMode === "series"
                        ? "border-red-200 bg-red-50"
                        : "border-orange-200 bg-orange-50"
                    }`}
                  >
                    <CardContent className="flex items-start gap-3">
                      <AlertTriangleIcon
                        className={`h-5 w-5 mt-0.5 flex-shrink-0 ${
                          deleteMode === "series"
                            ? "text-red-600"
                            : "text-orange-600"
                        }`}
                      />
                      <div>
                        <p
                          className={`font-semibold text-sm ${
                            deleteMode === "series"
                              ? "text-red-800"
                              : "text-orange-800"
                          }`}
                        >
                          Cette action est irréversible
                        </p>
                        <p
                          className={`text-sm mt-1 ${
                            deleteMode === "series"
                              ? "text-red-700"
                              : "text-orange-700"
                          }`}
                        >
                          {deleteMode === "series"
                            ? "Tous les rendez-vous de la série récurrente seront définitivement supprimés."
                            : "Ce rendez-vous sera définitivement supprimé."}
                        </p>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              )}
            </div>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter className="flex items-center justify-between gap-3">
          <AlertDialogCancel
            onClick={() => handleOpenChange(false)}
            className="flex-1 sm:flex-none"
          >
            Annuler
          </AlertDialogCancel>

          {isRecurring && isFirstStep ? (
            <AlertDialogAction
              onClick={deleteEvent}
              disabled={isDeleting}
              className="flex-1 sm:flex-none bg-red-600 hover:bg-red-700 focus:ring-red-500 disabled:opacity-50"
            >
              {isDeleting ? (
                <>
                  <div className="w-4 h-4 mr-2 animate-spin rounded-full border-2 border-white border-t-transparent" />
                  Suppression...
                </>
              ) : (
                <>
                  <TrashIcon className="w-4 h-4 mr-2" />
                  Supprimer
                </>
              )}
            </AlertDialogAction>
          ) : !isRecurring && isFirstStep ? (
            <AlertDialogAction
              onClick={deleteEvent}
              disabled={isDeleting}
              className="flex-1 sm:flex-none bg-red-600 hover:bg-red-700 focus:ring-red-500 disabled:opacity-50"
            >
              {isDeleting ? (
                <>
                  <div className="w-4 h-4 mr-2 animate-spin rounded-full border-2 border-white border-t-transparent" />
                  Suppression...
                </>
              ) : (
                <>
                  <TrashIcon className="w-4 h-4 mr-2" />
                  Supprimer
                </>
              )}
            </AlertDialogAction>
          ) : (
            <div className="flex gap-2 flex-1 sm:flex-none">
              <Button
                variant="outline"
                onClick={handleBack}
                className="flex-1 sm:flex-none"
              >
                Retour
              </Button>
              <AlertDialogAction
                onClick={deleteEvent}
                disabled={isDeleting}
                className={`flex-1 sm:flex-none disabled:opacity-50 ${
                  deleteMode === "series"
                    ? "bg-red-600 hover:bg-red-700 focus:ring-red-500"
                    : "bg-orange-600 hover:bg-orange-700 focus:ring-orange-500"
                }`}
              >
                {isDeleting ? (
                  <>
                    <div className="w-4 h-4 mr-2 animate-spin rounded-full border-2 border-white border-t-transparent" />
                    Suppression...
                  </>
                ) : (
                  <>
                    <TrashIcon className="w-4 h-4 mr-2" />
                    {deleteMode === "series"
                      ? "Supprimer la série"
                      : "Supprimer"}
                  </>
                )}
              </AlertDialogAction>
            </div>
          )}
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
