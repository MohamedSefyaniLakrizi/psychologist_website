"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { format, isToday, isTomorrow, isThisWeek } from "date-fns";
import { fr } from "date-fns/locale";
import { Video, Clock, User, Calendar, Copy } from "lucide-react";
import { Button } from "@/app/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/app/components/ui/card";
import { Badge } from "@/app/components/ui/badge";
import { getUpcomingOnlineAppointments } from "@/lib/actions/appointments";
import type { IEvent } from "@/app/components/calendar/interfaces";
import { toast } from "sonner";
import { generateMeetingName } from "@/lib/jitsi";
import { InstantMeetingDialog } from "@/app/components/meeting/instant-meeting-dialog";

export default function MeetingRoomPage() {
  const router = useRouter();
  const [appointments, setAppointments] = useState<IEvent[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadUpcomingMeetings();
  }, []);

  const loadUpcomingMeetings = async () => {
    try {
      setIsLoading(true);
      const upcomingMeetings = await getUpcomingOnlineAppointments();
      setAppointments(upcomingMeetings);
    } catch (error) {
      console.error("Error loading meetings:", error);
      toast.error("Erreur lors du chargement des réunions");
    } finally {
      setIsLoading(false);
    }
  };

  const joinMeeting = async (appointment: IEvent) => {
    try {
      // Check if hostJwt is available
      if (!appointment.hostJwt) {
        toast.error("Token d'hôte non disponible pour cette réunion");
        return;
      }

      // Generate URL with stored JWT token
      const hostUrl = `${
        window.location.origin
      }/meeting/host?jwt=${encodeURIComponent(
        appointment.hostJwt
      )}&user=${encodeURIComponent(
        "Malika Lkhabir"
      )}&appointmentId=${encodeURIComponent(
        appointment.id
      )}&title=${encodeURIComponent("Rendez Vous")}&room=${encodeURIComponent(
        "Rendez Vous"
      )}`;

      // Navigate to host URL
      router.push(hostUrl);
    } catch (error) {
      console.error("Error joining meeting:", error);
      toast.error("Erreur lors de l'accès à la réunion");
    }
  };

  const copyClientUrl = async (appointment: IEvent) => {
    try {
      // Check if clientJwt is available
      if (!appointment.clientJwt) {
        toast.error("Token client non disponible pour cette réunion");
        return;
      }

      // Generate URL with stored client JWT token
      const clientUrl = `${
        window.location.origin
      }/meeting?jwt=${encodeURIComponent(
        appointment.clientJwt
      )}&user=${encodeURIComponent(
        appointment.user.name
      )}&appointmentId=${encodeURIComponent(
        appointment.id
      )}&title=${encodeURIComponent("Rendez Vous")}&room=${encodeURIComponent(
        "Rendez Vous"
      )}`;

      await navigator.clipboard.writeText(clientUrl);
      toast.success("Lien client copié dans le presse-papiers");
    } catch (error) {
      console.error("Error generating client URL:", error);
      toast.error("Erreur lors de la génération du lien client");
    }
  };

  const isUpcoming = (appointment: IEvent): boolean => {
    const now = new Date();
    const startTime = new Date(appointment.startDate);
    const endTime = new Date(appointment.endDate);

    // Meeting is upcoming if it's within the next 1 hour or currently happening
    const oneHourBefore = new Date(startTime.getTime() - 60 * 60 * 1000);
    return now >= oneHourBefore && now <= endTime;
  };

  const isFinished = (appointment: IEvent): boolean => {
    const now = new Date();
    const endTime = new Date(appointment.endDate);
    return now > endTime;
  };

  const getButtonState = (
    appointment: IEvent
  ): {
    disabled: boolean;
    variant: "default" | "outline" | "secondary";
    text: string;
  } => {
    // If appointment status is ATTENDED, allow rejoining but with different styling
    if (appointment.status === "ATTENDED") {
      return {
        disabled: false,
        variant: "outline",
        text: "Rejoindre à nouveau",
      };
    }

    if (isFinished(appointment)) {
      return {
        disabled: true,
        variant: "secondary",
        text: "Réunion terminée",
      };
    }

    if (isUpcoming(appointment)) {
      return {
        disabled: false,
        variant: "default",
        text: "Rejoindre en tant qu'hôte",
      };
    }

    return {
      disabled: true,
      variant: "outline",
      text: "Pas encore disponible",
    };
  };

  const getMeetingStatus = (
    appointment: IEvent
  ): {
    status: string;
    variant: "default" | "secondary" | "destructive" | "outline";
  } => {
    const now = new Date();
    const startTime = new Date(appointment.startDate);
    const endTime = new Date(appointment.endDate);

    if (now < startTime) {
      const diffMs = startTime.getTime() - now.getTime();
      const diffMinutes = Math.floor(diffMs / (1000 * 60));

      if (diffMinutes <= 60) {
        return { status: "Imminent", variant: "destructive" };
      }
      return { status: "À venir", variant: "secondary" };
    }

    if (now >= startTime && now <= endTime) {
      return { status: "En cours", variant: "default" };
    }

    return { status: "Terminé", variant: "outline" };
  };

  const isPriority = (appointment: IEvent): boolean => {
    // Don't mark ATTENDED appointments as priority since they've already been attended

    if (appointment.status === "ATTENDED") {
      return false;
    }

    const now = new Date();
    const start = new Date(appointment.startDate);
    const end = new Date(appointment.endDate);

    const thirtyMinutesBefore = new Date(start.getTime() - 30 * 60 * 1000);

    const isStartingSoon = now >= thirtyMinutesBefore && now < start;
    const isOngoing = now >= start && now <= end;

    console.log("isPriority check for", appointment.user.name, {
      now: now.toISOString(),
      start: start.toISOString(),
      end: end.toISOString(),
      thirtyMinutesBefore: thirtyMinutesBefore.toISOString(),
      isStartingSoon,
      isOngoing,
      status: appointment.status,
      isPriority: isStartingSoon || isOngoing,
    });

    return isStartingSoon || isOngoing;
  };

  const formatLongDuration = (appointment: IEvent): string => {
    const now = new Date();
    const start = new Date(appointment.startDate);

    if (now >= start && now <= new Date(appointment.endDate)) return "En cours";
    if (now > new Date(appointment.endDate)) return "Terminé";

    let remainingMs = start.getTime() - now.getTime();

    const years = Math.floor(remainingMs / (365 * 24 * 60 * 60 * 1000));
    remainingMs -= years * 365 * 24 * 60 * 60 * 1000;

    const months = Math.floor(remainingMs / (30 * 24 * 60 * 60 * 1000));
    remainingMs -= months * 30 * 24 * 60 * 60 * 1000;

    const days = Math.floor(remainingMs / (24 * 60 * 60 * 1000));
    remainingMs -= days * 24 * 60 * 60 * 1000;

    const hours = Math.floor(remainingMs / (60 * 60 * 1000));
    remainingMs -= hours * 60 * 60 * 1000;

    const minutes = Math.floor(remainingMs / (60 * 1000));

    const parts: string[] = [];
    if (years) parts.push(`${years}a`);
    if (months) parts.push(`${months}m`);
    if (days) parts.push(`${days}j`);
    if (hours) parts.push(`${hours}h`);
    if (minutes || parts.length === 0) parts.push(`${minutes}min`);

    return `Dans ${parts.join(" ")}`;
  };

  // Group appointments
  const priorityAppointments = appointments.filter(isPriority);
  console.log("Priority Appointments:", priorityAppointments);
  const nonPriority = appointments.filter((a) => !isPriority(a));

  const todayAppointments = nonPriority.filter((a) =>
    isToday(new Date(a.startDate))
  );
  const tomorrowAppointments = nonPriority.filter((a) =>
    isTomorrow(new Date(a.startDate))
  );
  const thisWeekAppointments = nonPriority.filter((a) => {
    const d = new Date(a.startDate);
    return !isToday(d) && !isTomorrow(d) && isThisWeek(d, { weekStartsOn: 1 });
  });
  const laterAppointments = nonPriority.filter((a) => {
    const d = new Date(a.startDate);
    return !isToday(d) && !isTomorrow(d) && !isThisWeek(d, { weekStartsOn: 1 });
  });

  if (isLoading) {
    return (
      <div className="flex h-screen w-full items-center justify-center">
        <div className="text-lg">Chargement des réunions...</div>
      </div>
    );
  }

  return (
    <div className="h-full w-full p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            Salle de Réunion
          </h1>
          <p className="text-muted-foreground">
            Démarrez ou rejoignez vos réunions en ligne
          </p>
        </div>
        <InstantMeetingDialog
          onMeetingCreated={(hostUrl) => {
            router.push(hostUrl);
          }}
        />
      </div>

      {isLoading ? (
        <div className="flex h-screen w-screen items-center justify-center">
          <div className="text-lg">Chargement des réunions...</div>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Priority cards (starting in <30min or ongoing) - full width, high priority */}
          {priorityAppointments.length > 0 && (
            <div className="space-y-4">
              {priorityAppointments.map((appointment) => (
                <Card
                  key={appointment.id}
                  className="border-2 border-blue-500 bg-gradient-to-r from-blue-50 to-indigo-50 shadow-xl p-6"
                >
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div>
                        <CardTitle className="text-2xl flex items-center gap-2 text-blue-800">
                          <Video className="h-6 w-6 text-blue-600" /> Réunion
                          prête avec {appointment.user.name}
                        </CardTitle>
                        <p className="text-sm text-blue-600">
                          Début:{" "}
                          {format(
                            new Date(appointment.startDate),
                            "PPP 'à' HH:mm",
                            { locale: fr }
                          )}
                        </p>
                      </div>
                      <Badge
                        variant="default"
                        className="bg-green-100 text-green-800 border-green-300"
                      >
                        {getMeetingStatus(appointment).status}
                      </Badge>
                    </div>
                  </CardHeader>

                  <CardContent className="mt-4 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                    <div>
                      <p className="text-xl font-semibold text-blue-800">
                        {formatLongDuration(appointment)}
                      </p>
                      <p className="text-sm text-blue-600 mt-2">
                        ID:{" "}
                        {generateMeetingName(
                          appointment.user.name,
                          new Date(appointment.startDate)
                        )}
                      </p>
                    </div>

                    <div className="flex items-center gap-2">
                      <Button
                        onClick={() => joinMeeting(appointment)}
                        className="gap-2 bg-blue-600 hover:bg-blue-700 text-white shadow-lg hover:shadow-xl transform transition-all duration-200 animate-pulse"
                        size="lg"
                      >
                        <Video className="h-5 w-5" /> Rejoindre maintenant
                      </Button>
                      <Button
                        onClick={() => copyClientUrl(appointment)}
                        variant="outline"
                        className="gap-2 border-blue-300 text-blue-700 hover:bg-blue-50"
                      >
                        <Copy className="h-4 w-4" /> Lien client
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          {/* Grouped sections */}
          {todayAppointments.length > 0 && (
            <section>
              <h2 className="text-xl font-semibold">Aujourd&apos;hui</h2>
              <div className="grid gap-4 mt-3">
                {todayAppointments.map((appointment) => (
                  <Card
                    key={appointment.id}
                    className="transition-shadow hover:shadow-md"
                  >
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div className="space-y-2">
                          <CardTitle className="flex items-center gap-2">
                            <User className="h-5 w-5" /> Réunion avec{" "}
                            {appointment.user.name}
                          </CardTitle>
                          <div className="flex items-center gap-4 text-sm text-muted-foreground">
                            <div className="flex items-center gap-1">
                              <Calendar className="h-4 w-4" />
                              {format(
                                new Date(appointment.startDate),
                                "EEEE dd MMMM",
                                { locale: fr }
                              )}
                            </div>
                            <div className="flex items-center gap-1">
                              <Clock className="h-4 w-4" />
                              {format(
                                new Date(appointment.startDate),
                                "HH:mm",
                                { locale: fr }
                              )}{" "}
                              -{" "}
                              {format(new Date(appointment.endDate), "HH:mm", {
                                locale: fr,
                              })}
                            </div>
                          </div>
                        </div>
                        <Badge variant={getMeetingStatus(appointment).variant}>
                          {getMeetingStatus(appointment).status}
                        </Badge>
                      </div>
                    </CardHeader>

                    <CardContent>
                      <div className="flex items-center justify-between">
                        <div className="space-y-1">
                          <p className="text-sm font-medium">
                            {formatLongDuration(appointment)}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            ID de réunion:{" "}
                            {generateMeetingName(
                              appointment.user.name,
                              new Date(appointment.startDate)
                            )}
                          </p>
                        </div>

                        <div className="flex gap-2">
                          <Button
                            onClick={() => joinMeeting(appointment)}
                            disabled={getButtonState(appointment).disabled}
                            className="gap-2"
                            variant={getButtonState(appointment).variant}
                          >
                            <Video className="h-4 w-4" />
                            {getButtonState(appointment).text}
                          </Button>
                          <Button
                            onClick={() => copyClientUrl(appointment)}
                            variant="outline"
                            size="sm"
                            className="gap-2"
                            title="Copier le lien pour le client"
                          >
                            <Copy className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </section>
          )}

          {tomorrowAppointments.length > 0 && (
            <section>
              <h2 className="text-xl font-semibold">Demain</h2>
              <div className="grid gap-4 mt-3">
                {tomorrowAppointments.map((appointment) => (
                  <Card
                    key={appointment.id}
                    className="transition-shadow hover:shadow-md"
                  >
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div className="space-y-2">
                          <CardTitle className="flex items-center gap-2">
                            <User className="h-5 w-5" /> Réunion avec{" "}
                            {appointment.user.name}
                          </CardTitle>
                          <div className="flex items-center gap-4 text-sm text-muted-foreground">
                            <div className="flex items-center gap-1">
                              <Calendar className="h-4 w-4" />
                              {format(
                                new Date(appointment.startDate),
                                "EEEE dd MMMM",
                                { locale: fr }
                              )}
                            </div>
                            <div className="flex items-center gap-1">
                              <Clock className="h-4 w-4" />
                              {format(
                                new Date(appointment.startDate),
                                "HH:mm",
                                { locale: fr }
                              )}{" "}
                              -{" "}
                              {format(new Date(appointment.endDate), "HH:mm", {
                                locale: fr,
                              })}
                            </div>
                          </div>
                        </div>
                        <Badge variant={getMeetingStatus(appointment).variant}>
                          {getMeetingStatus(appointment).status}
                        </Badge>
                      </div>
                    </CardHeader>

                    <CardContent>
                      <div className="flex items-center justify-between">
                        <div className="space-y-1">
                          <p className="text-sm font-medium">
                            {formatLongDuration(appointment)}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            ID de réunion:{" "}
                            {generateMeetingName(
                              appointment.user.name,
                              new Date(appointment.startDate)
                            )}
                          </p>
                        </div>

                        <div className="flex gap-2">
                          <Button
                            onClick={() => joinMeeting(appointment)}
                            disabled={getButtonState(appointment).disabled}
                            className="gap-2"
                            variant={getButtonState(appointment).variant}
                          >
                            <Video className="h-4 w-4" />
                            {getButtonState(appointment).text}
                          </Button>
                          <Button
                            onClick={() => copyClientUrl(appointment)}
                            variant="outline"
                            size="sm"
                            className="gap-2"
                            title="Copier le lien pour le client"
                          >
                            <Copy className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </section>
          )}

          {thisWeekAppointments.length > 0 && (
            <section>
              <h2 className="text-xl font-semibold">Cette semaine</h2>
              <div className="grid gap-4 mt-3">
                {thisWeekAppointments.map((appointment) => (
                  <Card
                    key={appointment.id}
                    className="transition-shadow hover:shadow-md"
                  >
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div className="space-y-2">
                          <CardTitle className="flex items-center gap-2">
                            <User className="h-5 w-5" /> Réunion avec{" "}
                            {appointment.user.name}
                          </CardTitle>
                          <div className="flex items-center gap-4 text-sm text-muted-foreground">
                            <div className="flex items-center gap-1">
                              <Calendar className="h-4 w-4" />
                              {format(
                                new Date(appointment.startDate),
                                "EEEE dd MMMM",
                                { locale: fr }
                              )}
                            </div>
                            <div className="flex items-center gap-1">
                              <Clock className="h-4 w-4" />
                              {format(
                                new Date(appointment.startDate),
                                "HH:mm",
                                { locale: fr }
                              )}{" "}
                              -{" "}
                              {format(new Date(appointment.endDate), "HH:mm", {
                                locale: fr,
                              })}
                            </div>
                          </div>
                        </div>
                        <Badge variant={getMeetingStatus(appointment).variant}>
                          {getMeetingStatus(appointment).status}
                        </Badge>
                      </div>
                    </CardHeader>

                    <CardContent>
                      <div className="flex items-center justify-between">
                        <div className="space-y-1">
                          <p className="text-sm font-medium">
                            {formatLongDuration(appointment)}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            ID de réunion:{" "}
                            {generateMeetingName(
                              appointment.user.name,
                              new Date(appointment.startDate)
                            )}
                          </p>
                        </div>

                        <div className="flex gap-2">
                          <Button
                            onClick={() => joinMeeting(appointment)}
                            disabled={getButtonState(appointment).disabled}
                            className="gap-2"
                            variant={getButtonState(appointment).variant}
                          >
                            <Video className="h-4 w-4" />
                            {getButtonState(appointment).text}
                          </Button>
                          <Button
                            onClick={() => copyClientUrl(appointment)}
                            variant="outline"
                            size="sm"
                            className="gap-2"
                            title="Copier le lien pour le client"
                          >
                            <Copy className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </section>
          )}

          {laterAppointments.length > 0 && (
            <section>
              <h2 className="text-xl font-semibold">Plus tard</h2>
              <div className="grid gap-4 mt-3">
                {laterAppointments.map((appointment) => (
                  <Card
                    key={appointment.id}
                    className="transition-shadow hover:shadow-md"
                  >
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div className="space-y-2">
                          <CardTitle className="flex items-center gap-2">
                            <User className="h-5 w-5" /> Réunion avec{" "}
                            {appointment.user.name}
                          </CardTitle>
                          <div className="flex items-center gap-4 text-sm text-muted-foreground">
                            <div className="flex items-center gap-1">
                              <Calendar className="h-4 w-4" />
                              {format(
                                new Date(appointment.startDate),
                                "EEEE dd MMMM",
                                { locale: fr }
                              )}
                            </div>
                            <div className="flex items-center gap-1">
                              <Clock className="h-4 w-4" />
                              {format(
                                new Date(appointment.startDate),
                                "HH:mm",
                                { locale: fr }
                              )}{" "}
                              -{" "}
                              {format(new Date(appointment.endDate), "HH:mm", {
                                locale: fr,
                              })}
                            </div>
                          </div>
                        </div>
                        <Badge variant={getMeetingStatus(appointment).variant}>
                          {getMeetingStatus(appointment).status}
                        </Badge>
                      </div>
                    </CardHeader>

                    <CardContent>
                      <div className="flex items-center justify-between">
                        <div className="space-y-1">
                          <p className="text-sm font-medium">
                            {formatLongDuration(appointment)}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            ID de réunion:{" "}
                            {generateMeetingName(
                              appointment.user.name,
                              new Date(appointment.startDate)
                            )}
                          </p>
                        </div>

                        <div className="flex gap-2">
                          <Button
                            onClick={() => joinMeeting(appointment)}
                            disabled={getButtonState(appointment).disabled}
                            className="gap-2"
                            variant={getButtonState(appointment).variant}
                          >
                            <Video className="h-4 w-4" />
                            {getButtonState(appointment).text}
                          </Button>
                          <Button
                            onClick={() => copyClientUrl(appointment)}
                            variant="outline"
                            size="sm"
                            className="gap-2"
                            title="Copier le lien pour le client"
                          >
                            <Copy className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </section>
          )}
        </div>
      )}
    </div>
  );
}
