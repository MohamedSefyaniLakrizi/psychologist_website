import { zodResolver } from "@hookform/resolvers/zod";
import { format, setHours, setMinutes, addMonths, addYears } from "date-fns";
import { type ReactNode, useEffect, useState, useCallback } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { Button } from "@/app/components/ui/button";
import { Calendar } from "@/app/components/ui/calendar";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/app/components/ui/form";
import { Input } from "@/app/components/ui/input";
import { Label } from "@/app/components/ui/label";
import { Checkbox } from "@/app/components/ui/checkbox";
import { RadioGroup, RadioGroupItem } from "@/app/components/ui/radio-group";
import {
  Modal,
  ModalClose,
  ModalContent,
  ModalDescription,
  ModalFooter,
  ModalHeader,
  ModalTitle,
  ModalTrigger,
} from "@/app/components/ui/responsive-modal";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/app/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/app/components/ui/select";
import { useCalendar } from "@/app/components/calendar/contexts/calendar-context";
import { useDisclosure } from "@/app/components/calendar/hooks";
import type { IEvent, IUser } from "@/app/components/calendar/interfaces";
import {
  appointmentFormSchema,
  type TAppointmentFormSchema,
} from "@/app/components/calendar/schemas";
import { AddClientDialog } from "@/app/components/clients/add-client-dialog";
import { CalendarIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { fr } from "date-fns/locale";
import {
  getInvoices,
  updateInvoice,
  type Invoice,
} from "@/lib/actions/invoices";

interface IProps {
  children: ReactNode;
  startDate?: Date;
  event?: IEvent;
}

export function AddEditAppointmentDialog({
  children,
  startDate,
  event,
}: IProps) {
  const { isOpen, onClose, onToggle } = useDisclosure();
  const { addEvent, updateEvent, users, isLoading } = useCalendar();
  const [clients, setClients] = useState<IUser[]>([]);
  const [invoice, setInvoice] = useState<Invoice | null>(null);

  const isEditing = !!event;

  useEffect(() => {
    setClients(users);
  }, [users]);

  const loadInvoice = useCallback(async () => {
    if (!event) return;

    try {
      const all = await getInvoices();
      const found = all.find((inv) => inv.appointment?.id === event.id);
      setInvoice(found || null);
    } catch (error) {
      console.error("Error loading invoice:", error);
      toast.error("Erreur lors du chargement de la facture");
    }
  }, [event]);

  // Load invoice when editing an appointment
  useEffect(() => {
    if (isEditing && event && isOpen) {
      loadInvoice();
    }
  }, [isEditing, event, isOpen, loadInvoice]);

  // Helper function to format time string from date
  const formatTimeString = (date: Date) => {
    return format(date, "HH:mm");
  };

  const [open, setOpen] = useState(false);

  // Helper function to create datetime from date and time string
  const combineDateTime = (date: Date, timeStr: string) => {
    const [hours, minutes] = timeStr.split(":").map(Number);
    return setMinutes(setHours(date, hours), minutes);
  };

  const [editMode, setEditMode] = useState<"single" | "series">("single");
  const [selectedDayOfWeek, setSelectedDayOfWeek] = useState<number>(0);
  const [originalDayOfWeek, setOriginalDayOfWeek] = useState<number>(0);

  const form = useForm<TAppointmentFormSchema>({
    resolver: zodResolver(appointmentFormSchema),
    defaultValues: {
      clientId: event?.clientId ?? "",
      date: startDate || (event ? new Date(event.startDate) : new Date()),
      startTime: event ? formatTimeString(new Date(event.startDate)) : "09:00",
      endTime: event ? formatTimeString(new Date(event.endDate)) : "10:00",
      rate: event?.rate ?? 300,
      format: event?.format ?? "ONLINE",
      isRecurring: false,
      recurringType: undefined,
      recurringPeriod: undefined,
      recurringEndDate: undefined,
    },
  });

  useEffect(() => {
    if (event) {
      console.log("🎯 Loading event for editing:", {
        id: event.id,
        isRecurring: event.isRecurring,
        recurringType: event.recurringType,
        startDate: event.startDate,
        endDate: event.endDate,
      });

      const eventStart = new Date(event.startDate);
      const eventEnd = new Date(event.endDate);

      // Initial form reset - will be updated again when invoice loads
      form.reset({
        clientId: event.clientId,
        date: eventStart,
        startTime: formatTimeString(eventStart),
        endTime: formatTimeString(eventEnd),
        rate: event.rate,
        format: event.format,
      });

      // Reset edit mode for recurring appointments
      if (event.isRecurring) {
        console.log(
          "📅 This is a recurring appointment, setting edit mode options"
        );
        setEditMode("single");
        // Set the day of week from the event's start date
        const dayOfWeek = eventStart.getDay();
        setSelectedDayOfWeek(dayOfWeek);
        setOriginalDayOfWeek(dayOfWeek);
      }
    }
  }, [event, form]);

  // Update form rate when invoice is loaded
  useEffect(() => {
    if (event && invoice) {
      const eventStart = new Date(event.startDate);
      const eventEnd = new Date(event.endDate);

      form.reset({
        clientId: event.clientId,
        date: eventStart,
        startTime: formatTimeString(eventStart),
        endTime: formatTimeString(eventEnd),
        rate: invoice.amount,
        format: event.format,
      });
    }
  }, [invoice, event, form]);

  // Store original times for calculating time differences
  const [originalStartTime, setOriginalStartTime] = useState<string>("");
  const [originalEndTime, setOriginalEndTime] = useState<string>("");

  useEffect(() => {
    if (event && isEditing) {
      const eventStart = new Date(event.startDate);
      const eventEnd = new Date(event.endDate);
      setOriginalStartTime(formatTimeString(eventStart));
      setOriginalEndTime(formatTimeString(eventEnd));
    }
  }, [event, isEditing]);

  const calculateRecurringEndDate = (startDate: Date, period: string): Date => {
    switch (period) {
      case "1M":
        return addMonths(startDate, 1);
      case "3M":
        return addMonths(startDate, 3);
      case "6M":
        return addMonths(startDate, 6);
      case "1Y":
        return addYears(startDate, 1);
      case "2Y":
        return addYears(startDate, 2);
      default:
        return addMonths(startDate, 1);
    }
  };

  const onSubmit = async (values: TAppointmentFormSchema) => {
    try {
      const startDateTime = combineDateTime(values.date, values.startTime);
      const endDateTime = combineDateTime(values.date, values.endTime);

      let recurringEndDate: Date | undefined = undefined;
      if (values.isRecurring && values.recurringPeriod) {
        recurringEndDate = calculateRecurringEndDate(
          values.date,
          values.recurringPeriod
        );
      }

      if (isEditing && event) {
        const updateData: any = {
          startTime: startDateTime,
          endTime: endDateTime,
        };

        // For series editing, include time and day changes
        if (editMode === "series" && event.isRecurring) {
          console.log("⏰ Calculating time and day changes for series update");

          // Calculate day difference for moving appointments to different day of week
          const dayDifference = selectedDayOfWeek - originalDayOfWeek;

          // Calculate time differences in minutes for series updates
          const originalStart = originalStartTime.split(":").map(Number);
          const originalEnd = originalEndTime.split(":").map(Number);
          const newStart = values.startTime.split(":").map(Number);
          const newEnd = values.endTime.split(":").map(Number);

          const originalStartMinutes = originalStart[0] * 60 + originalStart[1];
          const originalEndMinutes = originalEnd[0] * 60 + originalEnd[1];
          const newStartMinutes = newStart[0] * 60 + newStart[1];
          const newEndMinutes = newEnd[0] * 60 + newEnd[1];

          const startTimeDiff = newStartMinutes - originalStartMinutes;
          const endTimeDiff = newEndMinutes - originalEndMinutes;

          // Only use calculated dates for this specific appointment update
          updateData.startTime = startDateTime;
          updateData.endTime = endDateTime;

          // Pass time and day differences for series processing
          updateData.timeDifferences = {
            startTimeDiff,
            endTimeDiff,
          };

          // Pass day difference separately so backend can shift each appointment
          updateData.dayDifference = dayDifference;

          // Add format for series editing (but not rate - that goes to invoice)
          updateData.format = values.format;

          console.log("📊 Series update data:", {
            startTime: updateData.startTime.toString(),
            endTime: updateData.endTime.toString(),
            format: updateData.format,
            timeDifferences: updateData.timeDifferences,
            dayDifference: `${dayDifference} days`,
            originalDay: originalDayOfWeek,
            newDay: selectedDayOfWeek,
          });
        } else {
          // For single appointment editing, include format but not rate
          updateData.format = values.format;
        }

        console.log("📊 Update data:", updateData);
        console.log("🎯 Update mode:", editMode);

        await updateEvent(event.id, updateData, editMode);

        // Update the invoice amount if it exists and rate has changed
        if (invoice && values.rate !== invoice.amount) {
          console.log("💳 Updating invoice amount:", {
            invoiceId: invoice.id,
            oldAmount: invoice.amount,
            newAmount: values.rate,
          });

          try {
            await updateInvoice(invoice.id, { amount: values.rate });
            console.log("✅ Invoice amount updated successfully");
            toast.success("Montant de la facture mis à jour");
          } catch (invoiceError) {
            console.error("❌ Error updating invoice:", invoiceError);
            toast.error(
              "Erreur lors de la mise à jour du montant de la facture"
            );
          }
        }

        console.log("✅ Appointment updated successfully");
        toast.success("Rendez-vous modifié avec succès");
      } else {
        console.log("➕ Starting appointment creation...");
        const appointmentData = {
          clientId: values.clientId,
          startTime: startDateTime,
          endTime: endDateTime,
          rate: values.rate,
          format: values.format,
          isRecurring: values.isRecurring || false,
          recurringType: values.isRecurring ? values.recurringType : undefined,
          recurringEndDate,
        };
        console.log("📊 Final appointment data:", appointmentData);
        await addEvent(appointmentData);
        console.log("✅ Appointment created successfully");
        toast.success("Rendez-vous créé avec succès");
      }

      console.log("🔄 Closing dialog and resetting form");
      onClose();
      form.reset();
    } catch (error) {
      console.error("❌ Form submission error:", error);
      console.error("❌ Error stack:", (error as Error).stack);
      toast.error(
        `Échec ${
          isEditing ? "de modification du" : "de création du"
        } rendez-vous`
      );
    }
  };

  return (
    <Modal open={isOpen} onOpenChange={onToggle} modal={false}>
      <ModalTrigger asChild>{children}</ModalTrigger>
      <ModalContent>
        <ModalHeader>
          <ModalTitle>
            {isEditing ? "Modifier le rendez-vous" : "Nouveau rendez-vous"}
          </ModalTitle>
          <ModalDescription>
            {isEditing
              ? "Modifiez les détails de votre rendez-vous."
              : "Créez un nouveau rendez-vous pour votre calendrier."}
          </ModalDescription>
        </ModalHeader>

        <Form {...form}>
          <form
            id="appointment-form"
            onSubmit={form.handleSubmit(onSubmit)}
            className="grid gap-4 py-4"
          >
            {/* Edit mode selection for recurring appointments - show first */}
            {isEditing && event?.isRecurring && (
              <div className="mb-4 p-4 bg-blue-50 rounded-lg border border-blue-200">
                <FormLabel className="text-base font-semibold">
                  Mode de modification
                </FormLabel>
                <p className="text-sm text-muted-foreground mb-3">
                  Ce rendez-vous fait partie d&apos;une série récurrente. Que
                  souhaitez-vous modifier ?
                </p>
                <RadioGroup
                  value={editMode}
                  onValueChange={(value: "single" | "series") => {
                    setEditMode(value);
                  }}
                >
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="single" id="single" />
                    <Label
                      htmlFor="single"
                      className="text-sm font-medium cursor-pointer"
                    >
                      Ce rendez-vous uniquement
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="series" id="series" />
                    <Label
                      htmlFor="series"
                      className="text-sm font-medium cursor-pointer"
                    >
                      Tous les rendez-vous récurrents
                    </Label>
                  </div>
                </RadioGroup>
              </div>
            )}
            {!isEditing && (
              <FormField
                name="clientId"
                render={({ field, fieldState }) => (
                  <FormItem>
                    <FormLabel className="required">Client</FormLabel>
                    <FormControl>
                      <div className="flex gap-2">
                        <Select
                          value={field.value}
                          onValueChange={(clientId) => {
                            field.onChange(clientId);
                            // Set default rate for selected client
                            const selectedClient = clients.find(
                              (c) => c.id === clientId
                            );
                            if (selectedClient && selectedClient.defaultRate) {
                              form.setValue("rate", selectedClient.defaultRate);
                            }
                          }}
                        >
                          <SelectTrigger
                            className={`flex-1 ${
                              fieldState.invalid ? "border-red-500" : ""
                            }`}
                          >
                            <SelectValue placeholder="Choisir un client" />
                          </SelectTrigger>
                          <SelectContent>
                            {clients.map((client) => (
                              <SelectItem value={client.id} key={client.id}>
                                {client.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <AddClientDialog
                          onClientAdded={(client) => {
                            setClients((prev) => {
                              const updated = [...prev, client];
                              return updated;
                            });
                            setTimeout(() => {
                              field.onChange(client.id);
                              form.setValue("clientId", client.id);
                              // Set default rate for new client
                              if (client.defaultRate) {
                                form.setValue("rate", client.defaultRate);
                              }
                            }, 100);
                          }}
                        />
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            {/* Date field - disabled for series editing */}
            {!(isEditing && event?.isRecurring && editMode === "series") && (
              <FormField
                name="date"
                render={({ field, fieldState }) => (
                  <FormItem>
                    <FormLabel className="required">Date</FormLabel>
                    <FormControl>
                      <Popover open={open} onOpenChange={setOpen}>
                        <PopoverTrigger asChild>
                          <Button
                            variant="outline"
                            className={cn(
                              "w-full justify-start text-left font-normal",
                              !field.value && "text-muted-foreground",
                              fieldState.invalid && "border-red-500"
                            )}
                          >
                            <CalendarIcon className="mr-2 h-4 w-4" />
                            {field.value
                              ? format(field.value, "PPP", { locale: fr })
                              : "Choisir une date"}
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                          <Calendar
                            mode="single"
                            selected={field.value}
                            onSelect={(date) => {
                              field.onChange(date);
                              setOpen(false);
                            }}
                            disabled={(date) => {
                              const today = new Date();
                              today.setHours(0, 0, 0, 0);
                              return date < today;
                            }}
                            initialFocus
                            locale={fr}
                          />
                        </PopoverContent>
                      </Popover>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            {/* Day of week selector for series editing */}
            {isEditing && event?.isRecurring && editMode === "series" && (
              <FormItem>
                <FormLabel className="required">Jour de la semaine</FormLabel>
                <FormControl>
                  <Select
                    value={selectedDayOfWeek.toString()}
                    onValueChange={(value) =>
                      setSelectedDayOfWeek(parseInt(value))
                    }
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Choisir le jour de la semaine" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1">Lundi</SelectItem>
                      <SelectItem value="2">Mardi</SelectItem>
                      <SelectItem value="3">Mercredi</SelectItem>
                      <SelectItem value="4">Jeudi</SelectItem>
                      <SelectItem value="5">Vendredi</SelectItem>
                      <SelectItem value="6">Samedi</SelectItem>
                      <SelectItem value="0">Dimanche</SelectItem>
                    </SelectContent>
                  </Select>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}

            <div className="grid grid-cols-2 gap-4">
              <FormField
                name="startTime"
                render={({ field, fieldState }) => (
                  <FormItem>
                    <FormLabel className="required">Heure de début</FormLabel>
                    <FormControl>
                      <Input
                        type="time"
                        {...field}
                        onChange={(e) => {
                          field.onChange(e.target.value);
                          // Auto-calculate end time (1 hour later)
                          if (e.target.value) {
                            const [hours, minutes] = e.target.value
                              .split(":")
                              .map(Number);
                            const endHour = hours + 1;
                            const endTime = `${endHour
                              .toString()
                              .padStart(2, "0")}:${minutes
                              .toString()
                              .padStart(2, "0")}`;
                            form.setValue("endTime", endTime);
                          }
                        }}
                        className={fieldState.invalid ? "border-red-500" : ""}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                name="endTime"
                render={({ field, fieldState }) => (
                  <FormItem>
                    <FormLabel className="required">Heure de fin</FormLabel>
                    <FormControl>
                      <Input
                        type="time"
                        {...field}
                        className={fieldState.invalid ? "border-red-500" : ""}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Rate and Format fields - always shown for new appointments and single edits, for series edits only when editing recurring */}
            {!isEditing ||
            !event?.isRecurring ||
            editMode === "single" ||
            editMode === "series" ? (
              <>
                <FormField
                  name="rate"
                  render={({ field, fieldState }) => (
                    <FormItem>
                      <FormLabel className="required">Tarif (Dh)</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          min="0"
                          step="1"
                          placeholder="300"
                          {...field}
                          onChange={(e) =>
                            field.onChange(parseInt(e.target.value) || 0)
                          }
                          className={fieldState.invalid ? "border-red-500" : ""}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  name="format"
                  render={({ field, fieldState }) => (
                    <FormItem>
                      <FormLabel className="required">Format</FormLabel>
                      <FormControl>
                        <Select
                          value={field.value}
                          onValueChange={field.onChange}
                        >
                          <SelectTrigger
                            className={`w-full ${
                              fieldState.invalid ? "border-red-500" : ""
                            }`}
                          >
                            <SelectValue placeholder="Choisir le format" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="ONLINE">En ligne</SelectItem>
                            <SelectItem value="FACE_TO_FACE">
                              En personne
                            </SelectItem>
                          </SelectContent>
                        </Select>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </>
            ) : null}

            {!isEditing && (
              <>
                <FormField
                  name="isRecurring"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                      <FormControl>
                        <Checkbox
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                      <div className="space-y-1 leading-none">
                        <FormLabel>Rendez-vous récurrent</FormLabel>
                        <p className="text-sm text-muted-foreground">
                          Créer plusieurs rendez-vous selon une fréquence
                          définie
                        </p>
                      </div>
                    </FormItem>
                  )}
                />

                {form.watch("isRecurring") && (
                  <>
                    <div className="grid grid-cols-2 gap-4">
                      <FormField
                        name="recurringType"
                        render={({ field, fieldState }) => (
                          <FormItem>
                            <FormLabel className="required">
                              Fréquence
                            </FormLabel>
                            <FormControl>
                              <Select
                                value={field.value}
                                onValueChange={field.onChange}
                              >
                                <SelectTrigger
                                  className={
                                    fieldState.invalid ? "border-red-500" : ""
                                  }
                                >
                                  <SelectValue placeholder="Choisir la fréquence" />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="WEEKLY">
                                    Chaque semaine
                                  </SelectItem>
                                  <SelectItem value="BIWEEKLY">
                                    Toutes les 2 semaines
                                  </SelectItem>
                                  <SelectItem value="MONTHLY">
                                    Chaque mois
                                  </SelectItem>
                                </SelectContent>
                              </Select>
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        name="recurringPeriod"
                        render={({ field, fieldState }) => (
                          <FormItem>
                            <FormLabel className="required">
                              Durée de récurrence
                            </FormLabel>
                            <FormControl>
                              <Select
                                value={field.value}
                                onValueChange={field.onChange}
                              >
                                <SelectTrigger
                                  className={
                                    fieldState.invalid ? "border-red-500" : ""
                                  }
                                >
                                  <SelectValue placeholder="Choisir la durée" />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="1M">1 mois</SelectItem>
                                  <SelectItem value="3M">3 mois</SelectItem>
                                  <SelectItem value="6M">6 mois</SelectItem>
                                  <SelectItem value="1Y">1 an</SelectItem>
                                  <SelectItem value="2Y">2 ans</SelectItem>
                                </SelectContent>
                              </Select>
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  </>
                )}
              </>
            )}

            <ModalFooter className="flex justify-end gap-2">
              <ModalClose asChild>
                <Button type="button" variant="outline">
                  Annuler
                </Button>
              </ModalClose>
              <Button
                form="appointment-form"
                type="submit"
                disabled={isLoading}
                onClick={(e) => {
                  e.preventDefault();
                  console.log("Submit clicked");
                  onSubmit(form.getValues());
                }}
              >
                {isLoading
                  ? isEditing
                    ? "Modification..."
                    : "Création..."
                  : isEditing
                    ? "Sauvegarder"
                    : "Créer le rendez-vous"}
              </Button>
            </ModalFooter>
          </form>
        </Form>
      </ModalContent>
    </Modal>
  );
}
