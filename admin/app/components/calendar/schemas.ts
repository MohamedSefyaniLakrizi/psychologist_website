import { z } from "zod";

export const eventSchema = z.object({
  title: z.string().min(1, "Title is required"),
  description: z.string().optional(),
  startDate: z.date({ message: "Start date is required" }),
  endDate: z.date({ message: "End date is required" }),
  color: z.enum(["blue", "green", "red", "yellow", "purple", "orange"], {
    message: "Variant is required",
  }),
});

export const appointmentSchema = z
  .object({
    clientId: z.string().min(1, "Client is required"),
    startTime: z.date({ message: "Start time is required" }),
    endTime: z.date({ message: "End time is required" }),
    rate: z.number().min(0, "Rate must be positive"),
    format: z.enum(["ONLINE", "FACE_TO_FACE"], {
      message: "Format is required",
    }),
  })
  .refine((data) => data.endTime > data.startTime, {
    message: "End time must be after start time",
    path: ["endTime"],
  });

export const appointmentFormSchema = z
  .object({
    clientId: z.string().min(1, "Le client est requis"),
    date: z.date({ message: "La date est requise" }),
    startTime: z.string().min(1, "L'heure de début est requise"),
    endTime: z.string().min(1, "L'heure de fin est requise"),
    rate: z.number().int().min(0, "Le tarif doit être positif"),
    format: z.enum(["ONLINE", "FACE_TO_FACE"], {
      message: "Le format est requis",
    }),
    isRecurring: z.boolean(),
    recurringType: z.enum(["WEEKLY", "BIWEEKLY", "MONTHLY"]).optional(),
    recurringPeriod: z.enum(["1M", "3M", "6M", "1Y", "2Y"]).optional(),
    recurringEndDate: z.date().optional(), // Keep for backward compatibility
    editMode: z.enum(["single", "series"]).optional(),
  })
  .refine((data) => data.endTime > data.startTime, {
    message: "L'heure de fin doit être après l'heure de début",
    path: ["endTime"],
  })
  .refine(
    (data) => {
      if (data.isRecurring) {
        return data.recurringType && data.recurringPeriod;
      }
      return true;
    },
    {
      message:
        "Le type de récurrence et la durée sont requis pour les rendez-vous récurrents",
      path: ["recurringType"],
    }
  );

export type TEventFormData = z.infer<typeof eventSchema>;
export type TAppointmentFormData = z.infer<typeof appointmentSchema>;
export type TAppointmentFormSchema = z.infer<typeof appointmentFormSchema>;
