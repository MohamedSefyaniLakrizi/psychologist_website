"use client";
import { useState, useEffect, useCallback } from "react";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { RadioGroup, RadioGroupItem } from "../components/ui/radio-group";
import { toast } from "sonner";
import { useSession, signOut } from "next-auth/react";
import { LoginButton } from "../components/auth/LoginButton";
import Link from "next/link";
import {
  Mail,
  User,
  Calendar,
  Clock,
  RefreshCw,
  CheckCircle,
  AlertTriangle,
  Lightbulb,
  Lock,
  Loader2,
  ArrowLeft,
  LogOut,
} from "lucide-react";

interface Template {
  id: string;
  name: string;
  description: string;
}

interface CalendarEvent {
  id: string;
  title: string;
  start: string;
  end: string;
  description?: string;
  attendees: Array<{
    email: string;
    name?: string;
  }>;
}

export default function AdminPage() {
  const { data: session, status } = useSession();
  const [templates, setTemplates] = useState<Template[]>([]);
  const [selectedTemplate, setSelectedTemplate] = useState<string>("");
  const [calendarEvents, setCalendarEvents] = useState<CalendarEvent[]>([]);
  const [selectedEvent, setSelectedEvent] = useState<string>("");
  const [formData, setFormData] = useState({
    clientEmail: "",
    firstName: "",
    lastName: "",
    date: "",
    time: "",
    originalDate: "",
    originalTime: "",
  });
  const [isLoading, setIsLoading] = useState(false);
  const [loadingEvents, setLoadingEvents] = useState(false);

  // Helper function to handle authentication errors
  const handleAuthError = (error: unknown) => {
    const errorMessage = error instanceof Error ? error.message : String(error);
    if (
      errorMessage?.includes("invalid authentication credentials") ||
      errorMessage?.includes("OAuth 2 access token") ||
      errorMessage?.includes("401") ||
      errorMessage?.includes("Unauthorized")
    ) {
      console.log("Authentication error detected, signing out...", error);
      toast.error("Session expirée, reconnexion nécessaire...");
      signOut({ callbackUrl: "/admin" });
      return true;
    }
    return false;
  };

  // Load templates on component mount
  const loadTemplates = useCallback(async () => {
    try {
      const response = await fetch("/api/send-template-email");

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      setTemplates(data.templates);
    } catch (error) {
      console.error("Error loading templates:", error);

      // Check if it's an authentication error and handle accordingly
      if (!handleAuthError(error)) {
        toast.error("Erreur lors du chargement des templates");
      }
    }
  }, []);

  // Load calendar events
  const loadCalendarEvents = useCallback(async () => {
    setLoadingEvents(true);
    try {
      // Get events for the next 30 days
      const timeMin = new Date().toISOString();
      const timeMax = new Date(
        Date.now() + 30 * 24 * 60 * 60 * 1000
      ).toISOString();

      const response = await fetch(
        `/api/calendar?timeMin=${timeMin}&timeMax=${timeMax}&maxResults=50`
      );

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      setCalendarEvents(data.events);
    } catch (error) {
      console.error("Error loading calendar events:", error);

      // Check if it's an authentication error and handle accordingly
      if (!handleAuthError(error)) {
        toast.error("Impossible de charger les événements du calendrier");
      }
    } finally {
      setLoadingEvents(false);
    }
  }, []);

  // Load templates and events when component mounts
  useEffect(() => {
    if (session) {
      // Check for authentication errors and sign out if needed
      if (
        (session as unknown as { error?: string }).error ===
        "RefreshAccessTokenError"
      ) {
        console.log("Authentication error detected, signing out...");
        signOut({ callbackUrl: "/admin" });
        return;
      }

      const loadData = async () => {
        await loadTemplates();
        await loadCalendarEvents();
      };

      loadData();
    }
  }, [session, loadTemplates, loadCalendarEvents]);

  // Handle event selection
  const handleEventSelect = (eventId: string) => {
    setSelectedEvent(eventId);
    const event = calendarEvents.find((e) => e.id === eventId);

    if (event) {
      const startDate = new Date(event.start);
      const attendee = event.attendees[0]; // Assume first attendee is the client

      // Extract name with priority: description first, then attendee, then fallbacks
      let firstName = "";
      let lastName = "";

      // Priority 1: Extract from event description
      if (event.description) {
        // Look for patterns like "Client: John Doe" or "Name: John Doe" or just "John Doe"
        const descriptionPatterns = [
          /(?:client|name|nom|prénom|participant)\s*:\s*(.+)/i,
          /rendez-vous\s+(?:avec|pour)\s+(.+)/i,
          /^(.+)$/, // Fallback: entire description if it's short
        ];

        for (const pattern of descriptionPatterns) {
          const match = event.description.trim().match(pattern);
          if (match) {
            const extractedName = match[1].trim();
            // Only use if it looks like a name (2-50 chars, contains letters)
            if (
              extractedName.length >= 2 &&
              extractedName.length <= 50 &&
              /[a-zA-ZÀ-ÿ]/.test(extractedName)
            ) {
              const nameParts = extractedName.split(/\s+/);
              firstName = nameParts[0] || "";
              lastName = nameParts.slice(1).join(" ") || "";
              break;
            }
          }
        }
      }

      // Priority 2: Extract from attendee name if description didn't work
      if (!firstName && attendee?.name) {
        const nameParts = attendee.name.trim().split(/\s+/);
        firstName = nameParts[0] || "";
        lastName = nameParts.slice(1).join(" ") || "";
      }

      // Priority 3: Extract from attendee email if still no name
      if (!firstName && attendee?.email) {
        const emailName = attendee.email.split("@")[0];
        // Replace dots, underscores, numbers with spaces and capitalize
        const cleanName = emailName
          .replace(/[._0-9]/g, " ")
          .split(/\s+/)
          .map(
            (word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
          )
          .filter((word) => word.length > 0);

        firstName = cleanName[0] || "";
        lastName = cleanName.slice(1).join(" ") || "";
      }

      // Priority 4: Extract from event title as last resort
      if (!firstName && event.title) {
        const titleMatch = event.title.match(
          /(?:rendez-vous|rdv|meeting)?\s*-?\s*(.+)/i
        );
        if (titleMatch) {
          const nameParts = titleMatch[1].trim().split(/\s+/);
          firstName = nameParts[0] || "";
          lastName = nameParts.slice(1).join(" ") || "";
        }
      }

      // Final fallback: use "Client" if nothing found
      if (!firstName) {
        firstName = "Client";
        lastName = "";
      }

      // Auto-populate all form data from the selected calendar event
      setFormData((prev) => ({
        ...prev,
        clientEmail: attendee?.email || "",
        firstName: firstName,
        lastName: lastName,
        date: startDate.toISOString().split("T")[0],
        time: startDate.toTimeString().slice(0, 5),
        // For reschedule: automatically populate original date/time from selected event
        originalDate: startDate.toISOString().split("T")[0],
        originalTime: startDate.toTimeString().slice(0, 5),
      }));
    }
  };

  // Show login screen if not authenticated
  if (status === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 sm:h-12 sm:w-12 animate-spin text-blue-600 mx-auto mb-4" />
          <p className="text-gray-600">Chargement...</p>
        </div>
      </div>
    );
  }

  if (!session) {
    return (
      <div className="min-h-[calc(100vh-133px)] flex items-center justify-center">
        <div className="bg-white p-8 rounded-lg shadow-lg text-center max-w-md w-full mx-4">
          <div className="flex items-center justify-center mb-4">
            <Lock className="h-6 w-6 sm:h-8 sm:w-8 text-gray-700" />
          </div>
          <h2 className="font-bold text-gray-900 mb-4">Administration</h2>
          <p className="text-gray-600 mb-6">
            Vous devez vous connecter avec votre compte Google autorisé pour
            accéder à l&apos;administration.
          </p>
          <LoginButton />
        </div>
      </div>
    );
  }

  const handleSendTemplate = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedTemplate) {
      toast.error("Veuillez sélectionner un template");
      return;
    }

    // Validate required fields based on template type
    if (!formData.firstName.trim()) {
      toast.error("Le prénom du client est requis");
      return;
    }

    if (!formData.clientEmail.trim()) {
      toast.error("L&apos;email du client est requis");
      return;
    }

    // For templates that require date/time (but reminder uses existing event date/time)
    if (
      (selectedTemplate === "confirmation" ||
        selectedTemplate === "reschedule") &&
      (!formData.date || !formData.time)
    ) {
      toast.error("La date et l'heure du rendez-vous sont requises");
      return;
    }

    // For reschedule, cancellation, and reminder, ensure an event is selected
    if (
      (selectedTemplate === "reschedule" ||
        selectedTemplate === "cancellation" ||
        selectedTemplate === "reminder") &&
      !selectedEvent
    ) {
      toast.error("Veuillez sélectionner un événement du calendrier");
      return;
    }

    setIsLoading(true);

    try {
      // First send the email
      const emailPayload = {
        templateType: selectedTemplate,
        clientEmail: formData.clientEmail,
        firstName: formData.firstName,
        lastName: formData.lastName,
        // For reminder, use the existing event date/time, for others use form data
        date:
          selectedTemplate === "reminder" && selectedEvent
            ? (() => {
                const event = calendarEvents.find(
                  (e) => e.id === selectedEvent
                );
                return event
                  ? new Date(event.start).toISOString()
                  : new Date(formData.date).toISOString();
              })()
            : new Date(formData.date).toISOString(),
        time:
          selectedTemplate === "reminder" && selectedEvent
            ? (() => {
                const event = calendarEvents.find(
                  (e) => e.id === selectedEvent
                );
                return event
                  ? new Date(event.start).toTimeString().slice(0, 5)
                  : formData.time;
              })()
            : formData.time,
        ...(selectedTemplate === "reschedule" && {
          originalDate: new Date(formData.originalDate).toISOString(),
          originalTime: formData.originalTime,
        }),
      };

      const emailResponse = await fetch("/api/send-template-email", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(emailPayload),
      });

      const emailResult = await emailResponse.json();

      if (!emailResponse.ok) {
        throw new Error(
          emailResult.error || "Erreur lors de l'envoi de l'email"
        );
      }

      // Handle calendar actions based on template type
      let calendarAction = null;

      if (selectedTemplate === "confirmation" && !selectedEvent) {
        // Create new calendar event for confirmation
        calendarAction = {
          action: "create",
          summary: `Rendez-vous - ${formData.firstName} ${formData.lastName}`,
          description: `Client: ${formData.firstName} ${formData.lastName}\nEmail: ${formData.clientEmail}\nRendez-vous confirmé`,
          date: formData.date,
          time: formData.time,
          clientEmail: formData.clientEmail,
          clientName: `${formData.firstName} ${formData.lastName}`,
        };
      } else if (selectedTemplate === "reschedule" && selectedEvent) {
        // Update existing event with new date/time
        calendarAction = {
          action: "update",
          eventId: selectedEvent,
          summary: `Rendez-vous - ${formData.firstName} ${formData.lastName}`,
          description: `Client: ${formData.firstName} ${formData.lastName}\nEmail: ${formData.clientEmail}\nRendez-vous reprogrammé`,
          date: formData.date,
          time: formData.time,
          clientEmail: formData.clientEmail,
          clientName: `${formData.firstName} ${formData.lastName}`,
        };
      } else if (selectedTemplate === "cancellation" && selectedEvent) {
        // Delete the calendar event
        calendarAction = {
          action: "delete",
          eventId: selectedEvent,
        };
      }

      // Execute calendar action if needed
      if (calendarAction) {
        const calendarResponse = await fetch("/api/calendar", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(calendarAction),
        });

        if (!calendarResponse.ok) {
          const calendarError = await calendarResponse.json();
          console.warn("Calendar action failed:", calendarError);
          toast.warning("Email envoyé mais erreur avec le calendrier");
        } else {
          // Refresh calendar events after successful action
          await loadCalendarEvents();
          toast.success("Email envoyé et calendrier mis à jour!");
        }
      } else {
        toast.success("Email envoyé avec succès!");
      }

      // Reset form
      setFormData({
        clientEmail: "",
        firstName: "",
        lastName: "",
        date: "",
        time: "",
        originalDate: "",
        originalTime: "",
      });
      setSelectedTemplate("");
      setSelectedEvent("");
    } catch (error) {
      console.error("Error sending template:", error);

      // Check if it's an authentication error and handle accordingly
      if (!handleAuthError(error)) {
        toast.error(
          error instanceof Error ? error.message : "Erreur lors de l'envoi"
        );
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen py-8 px-4 mt-5">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-lg shadow-lg p-6 border border-gray-200">
          <div className="flex items-center justify-between w-full mb-8 mt-1">
            <Button variant="secondary">
              <Link href="/" className="flex items-center gap-2">
                <ArrowLeft className="h-4 w-4" />
                <span>Retour</span>
              </Link>
            </Button>

            <div className="flex items-center gap-3">
              <Button
                onClick={() => signOut({ callbackUrl: "/" })}
                variant="outline"
                className="cursor-pointer flex items-center gap-2 text-red-600 hover:text-red-700 hover:bg-red-50 border-red-200"
              >
                <LogOut className="h-4 w-4" />
                Se déconnecter
              </Button>
            </div>
          </div>
          <div className="mb-6">
            <div className="flex items-center gap-3">
              <Mail className="h-6 w-6 sm:h-8 sm:w-8 text-blue-600" />
              <h1 className="text-3xl font-bold text-gray-900">Email Hub</h1>
            </div>
          </div>

          <form onSubmit={handleSendTemplate} className="space-y-6">
            {/* Template Selection - First Step */}
            <div className="bg-blue-50 p-4 rounded-lg">
              <div className="flex items-center gap-2 mb-3">
                <div className="flex items-center gap-2">
                  <span className="bg-blue-600 text-white text-xs font-bold px-2 py-1 rounded-full">
                    1
                  </span>
                  <Mail className="h-4 w-4 sm:h-5 sm:w-5 text-blue-600" />
                </div>
                <h3 className="text-base font-semibold text-blue-900">
                  Sélectionnez le type d&apos;email à envoyer
                </h3>
              </div>
              <RadioGroup
                value={selectedTemplate}
                onValueChange={setSelectedTemplate}
                className="mt-3"
              >
                {templates.map((template) => (
                  <label
                    key={template.id}
                    htmlFor={template.id}
                    className="flex items-start space-x-3 p-3 border rounded-lg hover:bg-gray-50 bg-white cursor-pointer transition-colors"
                  >
                    <RadioGroupItem
                      value={template.id}
                      id={template.id}
                      className="mt-1"
                    />
                    <div className="flex-1">
                      <span className="font-medium">{template.name}</span>
                      <p className="text-sm text-gray-600 mt-1">
                        {template.description}
                      </p>
                    </div>
                  </label>
                ))}
              </RadioGroup>
            </div>

            {/* Show form fields only after template selection */}
            {selectedTemplate && (
              <>
                {/* Calendar Event Selection for reschedule/cancellation/reminder */}
                {(selectedTemplate === "reschedule" ||
                  selectedTemplate === "cancellation" ||
                  selectedTemplate === "reminder") && (
                  <div className="bg-yellow-50 p-4 rounded-lg">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-3">
                      <div className="flex items-center gap-2">
                        <span className="bg-yellow-600 text-white text-xs font-bold px-2 py-1 rounded-full">
                          2
                        </span>
                        <Calendar className="h-4 w-4 sm:h-5 sm:w-5 text-yellow-600" />
                        <h3 className="font-semibold text-yellow-800">
                          Sélectionner l&apos;événement du calendrier à{" "}
                          {selectedTemplate === "reschedule"
                            ? "reprogrammer"
                            : selectedTemplate === "cancellation"
                              ? "annuler"
                              : "rappeler"}
                        </h3>
                      </div>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={loadCalendarEvents}
                        disabled={loadingEvents}
                        className="w-fit self-start sm:self-auto"
                      >
                        {loadingEvents ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <RefreshCw className="h-4 w-4" />
                        )}{" "}
                        Actualiser
                      </Button>
                    </div>

                    {loadingEvents ? (
                      <div className="text-center py-4 text-gray-600">
                        Chargement des événements...
                      </div>
                    ) : calendarEvents.length === 0 ? (
                      <div className="text-center py-4 text-gray-600">
                        Aucun événement trouvé pour les 30 prochains jours
                      </div>
                    ) : (
                      <div className="space-y-2 max-h-60 overflow-y-auto">
                        {calendarEvents.map((event) => {
                          const eventDate = new Date(event.start);
                          const isSelected = selectedEvent === event.id;

                          return (
                            <div
                              key={event.id}
                              onClick={() => handleEventSelect(event.id)}
                              className={`p-3 border rounded-lg cursor-pointer transition-colors ${
                                isSelected
                                  ? "border-yellow-500 bg-yellow-100"
                                  : "border-gray-200 hover:bg-white bg-white"
                              }`}
                            >
                              <div className="flex justify-between items-start">
                                <div className="flex-1">
                                  <h4 className="font-medium text-gray-900">
                                    {event.title}
                                  </h4>
                                  <div className="flex items-center gap-1 text-sm text-gray-600 mt-1">
                                    <Calendar className="h-3 w-3" />
                                    {eventDate.toLocaleDateString("fr-FR", {
                                      weekday: "long",
                                      year: "numeric",
                                      month: "long",
                                      day: "numeric",
                                    })}
                                  </div>
                                  <div className="flex items-center gap-1 text-sm text-gray-600">
                                    <Clock className="h-3 w-3" />
                                    {eventDate.toLocaleTimeString("fr-FR", {
                                      hour: "2-digit",
                                      minute: "2-digit",
                                    })}
                                  </div>
                                  {event.attendees.length > 0 && (
                                    <div className="flex items-center gap-1 text-sm text-gray-600">
                                      <User className="h-3 w-3" />
                                      {event.attendees[0].email}
                                    </div>
                                  )}
                                </div>
                                {isSelected && (
                                  <div className="flex items-center gap-1 text-yellow-600 font-medium text-sm">
                                    <CheckCircle className="h-4 w-4" />
                                    Sélectionné
                                  </div>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                )}

                {/* Client Information - Hidden for cancellation when event is selected */}
                {!(
                  (selectedTemplate === "cancellation" ||
                    selectedTemplate === "reminder") &&
                  selectedEvent
                ) && (
                  <div className="bg-green-50 p-4 rounded-lg">
                    <div className="flex items-center gap-2 mb-3">
                      <span className="bg-green-600 text-white text-xs font-bold px-2 py-1 rounded-full">
                        {selectedTemplate === "reschedule" ||
                        selectedTemplate === "cancellation" ||
                        selectedTemplate === "reminder"
                          ? "3"
                          : "2"}
                      </span>
                      <User className="h-4 w-4 sm:h-5 sm:w-5 text-green-600" />
                      <h3 className="font-semibold text-green-800">
                        Informations du client
                      </h3>
                    </div>
                    <div className="grid md:grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="firstName">Prénom du client *</Label>
                        <Input
                          id="firstName"
                          value={formData.firstName}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              firstName: e.target.value,
                            })
                          }
                          placeholder="Prénom"
                          required
                          disabled={
                            !!(
                              selectedEvent &&
                              (selectedTemplate === "cancellation" ||
                                selectedTemplate === "reminder")
                            )
                          }
                          className={
                            selectedEvent &&
                            (selectedTemplate === "cancellation" ||
                              selectedTemplate === "reminder")
                              ? "bg-gray-100"
                              : selectedEvent &&
                                  selectedTemplate === "reschedule"
                                ? "bg-yellow-50 border-yellow-200"
                                : ""
                          }
                        />
                      </div>
                      <div>
                        <Label htmlFor="lastName">Nom du client *</Label>
                        <Input
                          id="lastName"
                          value={formData.lastName}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              lastName: e.target.value,
                            })
                          }
                          placeholder="Nom"
                          required
                          disabled={
                            !!(
                              selectedEvent &&
                              (selectedTemplate === "cancellation" ||
                                selectedTemplate === "reminder")
                            )
                          }
                          className={
                            selectedEvent &&
                            (selectedTemplate === "cancellation" ||
                              selectedTemplate === "reminder")
                              ? "bg-gray-100"
                              : selectedEvent &&
                                  selectedTemplate === "reschedule"
                                ? "bg-yellow-50 border-yellow-200"
                                : ""
                          }
                        />
                      </div>
                    </div>

                    <div className="mt-4">
                      <Label htmlFor="clientEmail">Email du client *</Label>
                      <Input
                        id="clientEmail"
                        type="email"
                        value={formData.clientEmail}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            clientEmail: e.target.value,
                          })
                        }
                        placeholder="email@exemple.com"
                        required
                        disabled={
                          !!(
                            selectedEvent &&
                            (selectedTemplate === "cancellation" ||
                              selectedTemplate === "reminder")
                          )
                        }
                        className={
                          selectedEvent &&
                          (selectedTemplate === "cancellation" ||
                            selectedTemplate === "reminder")
                            ? "bg-gray-100"
                            : selectedEvent && selectedTemplate === "reschedule"
                              ? "bg-yellow-50 border-yellow-200"
                              : ""
                        }
                      />
                    </div>
                  </div>
                )}

                {/* Auto-populated client info display for cancellation and reminder */}
                {(selectedTemplate === "cancellation" ||
                  selectedTemplate === "reminder") &&
                  selectedEvent && (
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <div className="flex items-center gap-2 mb-3">
                        <span className="bg-gray-600 text-white text-xs font-bold px-2 py-1 rounded-full">
                          3
                        </span>
                        <CheckCircle className="h-4 w-4 sm:h-5 sm:w-5 text-gray-600" />
                        <h3 className="font-semibold text-gray-800">
                          Informations du rendez-vous
                        </h3>
                      </div>
                      <div className="bg-white p-3 rounded border">
                        <div className="grid md:grid-cols-2 gap-4 text-sm">
                          <div>
                            <Label className="text-gray-600">Client</Label>
                            <p className="font-medium text-gray-900">
                              {formData.firstName} {formData.lastName}
                            </p>
                          </div>
                          <div>
                            <Label className="text-gray-600">Email</Label>
                            <p className="font-medium text-gray-900">
                              {formData.clientEmail}
                            </p>
                          </div>
                          <div>
                            <Label className="text-gray-600">
                              Date du rendez-vous
                            </Label>
                            <p className="font-medium text-gray-900">
                              {formData.date
                                ? new Date(formData.date).toLocaleDateString(
                                    "fr-FR",
                                    {
                                      weekday: "long",
                                      year: "numeric",
                                      month: "long",
                                      day: "numeric",
                                    }
                                  )
                                : "-"}
                            </p>
                          </div>
                          <div>
                            <Label className="text-gray-600">Heure</Label>
                            <p className="font-medium text-gray-900">
                              {formData.time || "-"}
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                {/* Appointment Details - Only for confirmation and reschedule */}
                {(selectedTemplate === "confirmation" ||
                  selectedTemplate === "reschedule") && (
                  <div className="bg-purple-50 p-4 rounded-lg">
                    <div className="flex items-center gap-2 mb-3">
                      <span className="bg-purple-600 text-white text-xs font-bold px-2 py-1 rounded-full">
                        {selectedTemplate === "reschedule" ? "4" : "3"}
                      </span>
                      <Clock className="h-4 w-4 sm:h-5 sm:w-5 text-purple-600" />
                      <h3 className="font-semibold text-purple-800">
                        {selectedTemplate === "reschedule"
                          ? "Nouvelle date et heure du rendez-vous"
                          : "Date et heure du rendez-vous"}
                      </h3>
                    </div>
                    <div className="grid md:grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="date">Date du rendez-vous *</Label>
                        <Input
                          id="date"
                          type="date"
                          value={formData.date}
                          onChange={(e) =>
                            setFormData({ ...formData, date: e.target.value })
                          }
                          required
                        />
                      </div>
                      <div>
                        <Label htmlFor="time">Heure du rendez-vous *</Label>
                        <Input
                          id="time"
                          type="time"
                          value={formData.time}
                          onChange={(e) =>
                            setFormData({ ...formData, time: e.target.value })
                          }
                          required
                        />
                      </div>
                    </div>
                  </div>
                )}

                {/* Original appointment details - Now automatically filled from calendar */}
                {selectedTemplate === "reschedule" && selectedEvent && (
                  <div className="bg-orange-50 p-4 rounded-lg">
                    <div className="flex items-center gap-2 mb-3">
                      <span className="bg-orange-600 text-white text-xs font-bold px-2 py-1 rounded-full">
                        5
                      </span>
                      <CheckCircle className="h-4 w-4 sm:h-5 sm:w-5 text-orange-600" />
                      <h3 className="font-semibold text-orange-800">
                        Rendez-vous original
                      </h3>
                    </div>
                    <div className="bg-white p-3 rounded border">
                      <div className="grid md:grid-cols-2 gap-4 text-sm">
                        <div>
                          <Label className="text-gray-600">
                            Date originale
                          </Label>
                          <p className="font-medium text-gray-900">
                            {formData.originalDate
                              ? new Date(
                                  formData.originalDate
                                ).toLocaleDateString("fr-FR", {
                                  weekday: "long",
                                  year: "numeric",
                                  month: "long",
                                  day: "numeric",
                                })
                              : "-"}
                          </p>
                        </div>
                        <div>
                          <Label className="text-gray-600">
                            Heure originale
                          </Label>
                          <p className="font-medium text-gray-900">
                            {formData.originalTime || "-"}
                          </p>
                        </div>
                      </div>
                      <p className="text-xs text-orange-700 mt-2">
                        Ces informations seront automatiquement incluses dans
                        l&apos;email de reprogrammation
                      </p>
                    </div>
                  </div>
                )}

                {/* Action confirmations */}
                {selectedTemplate === "reschedule" && selectedEvent && (
                  <div className="bg-yellow-100 p-3 rounded-lg">
                    <div className="flex items-center gap-2">
                      <Lightbulb className="h-4 w-4 text-yellow-600" />
                      <p className="text-sm text-yellow-800">
                        L&apos;événement sélectionné sera automatiquement mis à
                        jour avec la nouvelle date/heure.
                      </p>
                    </div>
                  </div>
                )}

                {selectedTemplate === "cancellation" && selectedEvent && (
                  <div className="bg-red-100 p-3 rounded-lg">
                    <div className="flex items-center gap-2">
                      <AlertTriangle className="h-4 w-4 text-red-600" />
                      <div>
                        <p className="text-sm text-red-800 font-medium">
                          L&apos;événement sélectionné sera automatiquement
                          supprimé du calendrier.
                        </p>
                        <p className="text-xs text-red-700 mt-1">
                          Un email d&apos;annulation sera envoyé au client avec
                          les détails du rendez-vous annulé pour confirmation.
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                <Button
                  type="submit"
                  disabled={isLoading}
                  className="w-full bg-blue-600 hover:bg-blue-700"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Envoi en cours...
                    </>
                  ) : (
                    <>
                      <Mail className="w-4 h-4 mr-2" />
                      Envoyer l&apos;email
                    </>
                  )}
                </Button>
              </>
            )}

            {/* Show message when no template is selected */}
            {!selectedTemplate && (
              <div className="text-center py-8 text-gray-500">
                <div className="flex flex-col items-center gap-2">
                  <Mail className="h-8 w-8 sm:h-12 sm:w-12 text-gray-300" />
                  <p>Sélectionnez un type d&apos;email pour continuer</p>
                </div>
              </div>
            )}
          </form>
        </div>

        {/* Help Section */}
        <div className="mt-8 bg-blue-50 rounded-lg p-6">
          <div className="flex items-center gap-2 mb-3">
            <Lightbulb className="h-5 w-5 sm:h-6 sm:w-6 text-blue-600" />
            <h2 className="text-xl font-semibold text-blue-900">
              Guide d&apos;utilisation
            </h2>
          </div>
          <div className="space-y-2 text-blue-800">
            <p>
              <strong>Confirmation :</strong> Utilisez après avoir accepté une
              demande de rendez-vous
            </p>
            <p>
              <strong>Reprogrammation :</strong> Utilisez pour proposer de
              nouveaux créneaux
            </p>
            <p>
              <strong>Rappel :</strong> Envoyez quelques jours avant le
              rendez-vous
            </p>
            <p>
              <strong>Annulation :</strong> Utilisez pour annuler un rendez-vous
              confirmé
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
