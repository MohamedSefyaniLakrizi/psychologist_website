"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { toast } from "sonner";
import { Button } from "../components/ui/button";
import { RadioGroup, RadioGroupItem } from "../components/ui/radio-group";
import { Label } from "../components/ui/label";
import { Input } from "../components/ui/input";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "../components/ui/form";
import AppointmentCalendar from "../components/appointment-calendar";

const formSchema = z.object({
  firstName: z.string().min(1, "Le prénom est requis"),
  lastName: z.string().min(1, "Le nom est requis"),
  email: z.string().email("Email invalide"),
  phoneNumber: z
    .string()
    .min(1, "Le numéro de téléphone est requis")
    .regex(/^(\d{2}\s){4}\d{2}$/, "Le numéro doit contenir 10 chiffres"),
  format: z.enum(["ONLINE", "FACE_TO_FACE"], {
    message: "Le type de consultation est requis",
  }),
  preferredContact: z.enum(["EMAIL", "PHONE", "SMS", "WHATSAPP"], {
    message: "La méthode de contact est requise",
  }),
});

type FormData = z.infer<typeof formSchema>;

export default function BookPage() {
  const [selectedDate, setSelectedDate] = useState<Date | undefined>();
  const [selectedTime, setSelectedTime] = useState<string | undefined>();
  const [step, setStep] = useState<"type" | "calendar" | "form">("type");

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      firstName: "",
      lastName: "",
      email: "",
      phoneNumber: "",
      format: "FACE_TO_FACE",
      preferredContact: "EMAIL",
    },
  });

  // Phone number formatting function
  const formatPhoneNumber = (value: string) => {
    const digits = value.replace(/\D/g, "");
    const limitedDigits = digits.substring(0, 10);
    const formatted = limitedDigits.replace(/(\d{2})(?=\d)/g, "$1 ").trim();
    return formatted;
  };

  const onSubmit = async (data: FormData) => {
    if (!selectedDate || !selectedTime) {
      toast.error("Veuillez sélectionner une date et une heure");
      return;
    }

    try {
      // Format date as YYYY-MM-DD to avoid timezone issues
      const year = selectedDate.getFullYear();
      const month = String(selectedDate.getMonth() + 1).padStart(2, "0");
      const day = String(selectedDate.getDate()).padStart(2, "0");
      const appointmentDate = `${year}-${month}-${day}`;

      const submitData = {
        ...data,
        appointmentDate,
        appointmentTime: selectedTime,
      };

      console.log("Form submitted:", submitData);

      const response = await fetch("/api/appointments", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(submitData),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Erreur lors de l'envoi");
      }

      toast.success("Demande de rendez-vous envoyée avec succès!", {
        description:
          "Nous vous contacterons bientôt pour confirmer votre rendez-vous.",
      });

      // Reset form and navigate back
      form.reset();
      setSelectedDate(undefined);
      setSelectedTime(undefined);
      setStep("type");
    } catch (error) {
      console.error("Submission error:", error);
      toast.error("Erreur lors de l'envoi", {
        description:
          error instanceof Error
            ? error.message
            : "Veuillez réessayer plus tard.",
      });
    }
  };

  const handleDateTimeSelect = (date: Date, time: string) => {
    setSelectedDate(date);
    setSelectedTime(time);
  };

  const handleFormatSelect = (format: "ONLINE" | "FACE_TO_FACE") => {
    form.setValue("format", format);
    setStep("calendar");
  };

  return (
    <div className="min-h-screen py-8 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Prendre Rendez-vous
          </h1>
          <p className="text-xl text-gray-600">
            {step === "type" &&
              "Choisissez le type de consultation qui vous convient"}
            {step === "calendar" &&
              "Sélectionnez une date et un créneau horaire"}
            {step === "form" && "Remplissez vos informations personnelles"}
          </p>
        </div>

        {/* Step 1: Choose consultation type */}
        {step === "type" && (
          <div className="grid md:grid-cols-2 gap-6 max-w-3xl mx-auto">
            <button
              onClick={() => handleFormatSelect("FACE_TO_FACE")}
              className="group relative cursor-pointer overflow-hidden rounded-lg bg-white p-8 shadow-lg transition-all duration-300 hover:shadow-xl hover:-translate-y-1 border border-gray-200"
            >
              <div className="text-center">
                <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4 group-hover:bg-blue-200 transition-colors">
                  <svg
                    className="w-8 h-8 text-blue-600"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
                    />
                  </svg>
                </div>
                <h3 className="text-2xl font-semibold text-gray-900 mb-3">
                  Consultation en cabinet
                </h3>
                <p className="text-gray-600 mb-4">
                  Rendez-vous en personne dans notre cabinet
                </p>
                <ul className="text-sm text-gray-500 space-y-1 mb-6">
                  <li>• Contact direct et personnel</li>
                  <li>• Environnement professionnel</li>
                  <li>• Confidentialité assurée</li>
                </ul>
                <div className="inline-flex items-center text-blue-600 font-medium group-hover:text-blue-700">
                  Choisir cette option
                  <svg
                    className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 5l7 7-7 7"
                    />
                  </svg>
                </div>
              </div>
            </button>

            <button
              onClick={() => handleFormatSelect("ONLINE")}
              className="group relative overflow-hidden cursor-pointer rounded-lg bg-white p-8 shadow-lg transition-all duration-300 hover:shadow-xl hover:-translate-y-1 border border-gray-200"
            >
              <div className="text-center">
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4 group-hover:bg-green-200 transition-colors">
                  <svg
                    className="w-8 h-8 text-green-600"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"
                    />
                  </svg>
                </div>
                <h3 className="text-2xl font-semibold text-gray-900 mb-3">
                  Consultation en ligne
                </h3>
                <p className="text-gray-600 mb-4">
                  Séance à distance par vidéoconférence
                </p>
                <ul className="text-sm text-gray-500 space-y-1 mb-6">
                  <li>• Confort de votre domicile</li>
                  <li>• Flexibilité horaire</li>
                  <li>• Même qualité d&apos;accompagnement</li>
                </ul>
                <div className="inline-flex items-center text-green-600 font-medium group-hover:text-green-700">
                  Choisir cette option
                  <svg
                    className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 5l7 7-7 7"
                    />
                  </svg>
                </div>
              </div>
            </button>
          </div>
        )}

        {/* Step 2: Calendar selection */}
        {step === "calendar" && (
          <div className="bg-white rounded-lg shadow-lg p-6">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
              <div className="order-2 md:order-1">
                <h2 className="text-2xl font-semibold text-gray-900">
                  {form.getValues("format") === "ONLINE"
                    ? "Consultation en ligne"
                    : "Consultation en cabinet"}
                </h2>
                <p className="text-gray-600">
                  Sélectionnez une date et un créneau horaire disponible
                </p>
              </div>
              <button
                onClick={() => setStep("type")}
                className="order-1 md:order-2 self-start md:self-auto px-4 py-2 text-gray-600 hover:text-gray-900 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                ← Retour
              </button>
            </div>
            <div className="w-full flex justify-center">
              <AppointmentCalendar
                onDateTimeSelect={handleDateTimeSelect}
                selectedDate={selectedDate}
                selectedTime={selectedTime}
              />
            </div>
            {selectedDate && selectedTime && (
              <div className="mt-6 flex justify-end">
                <Button
                  onClick={() => setStep("form")}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3"
                >
                  Continuer
                </Button>
              </div>
            )}
          </div>
        )}

        {/* Step 3: Contact information form */}
        {step === "form" && (
          <div className="bg-white rounded-lg shadow-lg p-6">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
              <div className="order-2 md:order-1">
                <h2 className="text-2xl font-semibold text-gray-900">
                  Vos informations
                </h2>
                <p className="text-gray-600">
                  Remplissez vos informations pour finaliser la demande de
                  rendez-vous
                </p>
              </div>
              <button
                onClick={() => setStep("calendar")}
                className="order-1 md:order-2 self-start md:self-auto px-4 py-2 text-gray-600 hover:text-gray-900 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                ← Retour
              </button>
            </div>

            {/* Selected appointment summary */}
            {selectedDate && selectedTime && (
              <div className="bg-blue-50 p-4 rounded-lg mb-6">
                <h3 className="font-semibold text-blue-900 mb-2">
                  Rendez-vous sélectionné :
                </h3>
                <p className="text-blue-800">
                  <span className="font-medium">Type :</span>{" "}
                  {form.getValues("format") === "ONLINE"
                    ? "En ligne"
                    : "En cabinet"}
                </p>
                <p className="text-blue-800">
                  <span className="font-medium">Date :</span>{" "}
                  {selectedDate.toLocaleDateString("fr-FR", {
                    weekday: "long",
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                  })}
                </p>
                <p className="text-blue-800">
                  <span className="font-medium">Heure :</span> {selectedTime}
                </p>
              </div>
            )}

            <Form {...form}>
              <form
                onSubmit={form.handleSubmit(onSubmit)}
                className="space-y-6"
              >
                <div className="grid md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="firstName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Prénom *</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="Votre prénom"
                            {...field}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="lastName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Nom *</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="Votre nom"
                            {...field}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email *</FormLabel>
                      <FormControl>
                        <Input
                          type="email"
                          placeholder="votre.email@exemple.com"
                          {...field}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="phoneNumber"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Téléphone *</FormLabel>
                      <FormControl>
                        <Input
                          type="tel"
                          placeholder="06 12 34 56 78"
                          value={field.value}
                          onChange={(e) => {
                            const formatted = formatPhoneNumber(e.target.value);
                            field.onChange(formatted);
                          }}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          maxLength={14}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="preferredContact"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Méthode préférée de contact *</FormLabel>
                      <FormControl>
                        <RadioGroup
                          onValueChange={field.onChange}
                          value={field.value}
                          className="flex gap-8 items-center mt-4"
                        >
                          <div className="flex items-center gap-3">
                            <RadioGroupItem value="EMAIL" id="email" />
                            <Label htmlFor="email">Email</Label>
                          </div>
                          <div className="flex items-center gap-3">
                            <RadioGroupItem value="PHONE" id="phone" />
                            <Label htmlFor="phone">Téléphone</Label>
                          </div>
                          <div className="flex items-center gap-3">
                            <RadioGroupItem value="SMS" id="sms" />
                            <Label htmlFor="sms">SMS</Label>
                          </div>
                          <div className="flex items-center gap-3">
                            <RadioGroupItem value="WHATSAPP" id="whatsapp" />
                            <Label htmlFor="whatsapp">WhatsApp</Label>
                          </div>
                        </RadioGroup>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="pt-4">
                  <Button
                    type="submit"
                    disabled={form.formState.isSubmitting}
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white"
                  >
                    {form.formState.isSubmitting
                      ? "Envoi en cours..."
                      : "Demander un rendez-vous"}
                  </Button>
                </div>
              </form>
            </Form>
          </div>
        )}
      </div>
    </div>
  );
}
