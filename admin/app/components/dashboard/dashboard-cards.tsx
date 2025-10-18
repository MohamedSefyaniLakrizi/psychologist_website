"use client";

import { format } from "date-fns";
import {
  Clock,
  Video,
  Monitor,
  User,
  Calendar,
  FileText,
  Receipt,
  AlertTriangle,
} from "lucide-react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/app/components/ui/card";
import { Button } from "@/app/components/ui/button";
import { Badge } from "@/app/components/ui/badge";
import {
  TodayAppointment,
  RecentActivity,
  TopClient,
} from "@/lib/actions/dashboard";
import Link from "next/link";

interface TodayScheduleProps {
  appointments: TodayAppointment[];
}

export function TodaySchedule({ appointments }: TodayScheduleProps) {
  const getStatusColor = (status: string) => {
    switch (status) {
      case "ATTENDED":
        return "bg-green-100 text-green-800";
      case "ABSENT":
        return "bg-red-100 text-red-800";
      case "CANCELLED":
        return "bg-gray-100 text-gray-800";
      default:
        return "bg-yellow-100 text-yellow-800";
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case "ATTENDED":
        return "Assisté";
      case "ABSENT":
        return "Absent";
      case "CANCELLED":
        return "Annulé";
      default:
        return "À venir";
    }
  };

  return (
    <Card className="h-full">
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-sm">
          <Calendar className="h-4 w-4" />
          <span className="hidden sm:inline">
            Planning d&apos;Aujourd&apos;hui
          </span>
        </CardTitle>
      </CardHeader>
      <CardContent className="h-[calc(100%-4rem)] overflow-auto">
        {appointments.length === 0 ? (
          <div className="text-center py-4 text-muted-foreground">
            <Calendar className="h-6 w-6 mx-auto mb-1 opacity-50" />
            <p className="text-xs">Aucun rendez-vous</p>
          </div>
        ) : (
          <div className="space-y-2">
            {appointments.slice(0, 3).map((appointment) => (
              <div
                key={appointment.id}
                className="flex items-center justify-between p-2 rounded border bg-card text-xs"
              >
                <div className="flex items-center gap-2">
                  <div className="text-center">
                    <div className="font-semibold">
                      {format(appointment.startTime, "HH:mm")}
                    </div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-medium truncate">
                      {appointment.clientName}
                    </div>
                    <div className="flex items-center gap-1 text-muted-foreground">
                      {appointment.format === "ONLINE" ? (
                        <Video className="h-2 w-2" />
                      ) : (
                        <Monitor className="h-2 w-2" />
                      )}
                      <span className="text-xs hidden sm:inline">
                        {appointment.format === "ONLINE"
                          ? "En ligne"
                          : "Présent"}
                      </span>
                      <span className="text-xs sm:hidden">
                        {appointment.format === "ONLINE" ? "Online" : "Pres."}
                      </span>
                    </div>
                  </div>
                </div>
                <Badge
                  className={`text-xs ${getStatusColor(appointment.status)}`}
                >
                  <span className="hidden sm:inline">
                    {getStatusText(appointment.status)}
                  </span>
                  <span className="sm:hidden">
                    {appointment.status === "ATTENDED"
                      ? "✓"
                      : appointment.status === "ABSENT"
                        ? "✗"
                        : appointment.status === "CANCELLED"
                          ? "⚫"
                          : "⏱"}
                  </span>
                </Badge>
              </div>
            ))}
            {appointments.length > 3 && (
              <div className="text-center pt-2">
                <Link href="/calendar">
                  <Button variant="ghost" size="sm" className="text-xs">
                    +{appointments.length - 3} autres
                  </Button>
                </Link>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

interface RecentActivityProps {
  activities: RecentActivity[];
}

export function RecentActivityCard({ activities }: RecentActivityProps) {
  const getActivityIcon = (type: string) => {
    switch (type) {
      case "appointment":
        return <Calendar className="h-4 w-4 text-blue-600" />;
      case "invoice":
        return <Receipt className="h-4 w-4 text-green-600" />;
      case "note":
        return <FileText className="h-4 w-4 text-purple-600" />;
      default:
        return <FileText className="h-4 w-4 text-gray-600" />;
    }
  };

  const getRelativeTime = (timestamp: Date) => {
    const now = new Date();
    const diff = now.getTime() - new Date(timestamp).getTime();
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const days = Math.floor(hours / 24);

    if (days > 0) {
      return `Il y a ${days} jour${days > 1 ? "s" : ""}`;
    } else if (hours > 0) {
      return `Il y a ${hours} heure${hours > 1 ? "s" : ""}`;
    } else {
      return "À l'instant";
    }
  };

  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-sm">
          <Clock className="h-4 w-4" />
          Activité Récente
        </CardTitle>
      </CardHeader>
      <CardContent className="overflow-auto h-[124px]">
        {activities.length === 0 ? (
          <div className="text-center py-4 text-muted-foreground">
            <Clock className="h-6 w-6 mx-auto mb-1 opacity-50" />
            <p className="text-xs">Aucune activité récente</p>
          </div>
        ) : (
          <div className="space-y-2">
            {activities.slice(0, 4).map((activity, index) => (
              <div
                key={index}
                className="flex items-start gap-2 p-2 rounded border bg-card"
              >
                <div className="mt-0.5">{getActivityIcon(activity.type)}</div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <p className="font-medium text-xs truncate">
                      {activity.title}
                    </p>
                    <span className="text-xs text-muted-foreground">
                      {getRelativeTime(activity.timestamp)}
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground truncate">
                    {activity.description}
                  </p>
                  {activity.clientName && (
                    <p className="text-xs text-muted-foreground truncate">
                      {activity.clientName}
                    </p>
                  )}
                </div>
              </div>
            ))}
            {activities.length > 4 && (
              <div className="text-center pt-2">
                <Button variant="ghost" size="sm" className="text-xs">
                  +{activities.length - 4} autres
                </Button>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

interface TopClientsProps {
  clients: TopClient[];
}

export function TopClientsCard({ clients }: TopClientsProps) {
  return (
    <Card className="h-full">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm">
          <span className="hidden sm:inline">Top Clients</span>
          <span className="sm:hidden">Clients</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="overflow-auto">
        {clients.length === 0 ? (
          <div className="text-center py-4 text-muted-foreground">
            <User className="h-6 w-6 mx-auto mb-1 opacity-50" />
            <p className="text-xs">Aucun client</p>
          </div>
        ) : (
          <div className="space-y-2">
            {clients.slice(0, 3).map((client, index) => (
              <div
                key={client.id}
                className="flex items-center justify-between p-2 rounded border bg-card"
              >
                <div className="flex items-center gap-2 flex-1 min-w-0">
                  <div className="flex items-center justify-center w-5 h-5 rounded-full bg-primary/10 text-primary font-semibold text-xs flex-shrink-0">
                    {index + 1}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-xs truncate">
                      {client.name}
                    </div>
                    <div className="text-xs text-muted-foreground flex items-center gap-1">
                      <span className="hidden sm:inline">
                        {client.appointmentCount} RDV
                      </span>
                      <span className="sm:hidden">
                        {client.appointmentCount}
                      </span>
                      <span className="hidden sm:inline">•</span>
                      <span className="font-semibold text-green-600 md:hidden block">
                        {client.totalRevenue.toFixed(0)} Dh
                      </span>
                    </div>
                  </div>
                </div>
                <div className="text-right hidden sm:block flex-shrink-0">
                  <div className="font-semibold text-green-600 text-xs hidden md:block">
                    {client.totalRevenue.toFixed(0)} Dh
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

interface QuickActionsProps {
  onCreateAppointment?: () => void;
  onCreateClient?: () => void;
}

export function QuickActionsCard() {
  return (
    <Card className="h-full py-3 gap-3">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm">Actions</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col h-full gap-1">
        <Link href="/calendar">
          <Button
            className="w-full justify-start gap-2 h-8 text-xs"
            variant="outline"
          >
            <Calendar className="h-3 w-3" />
            <span className="hidden sm:inline">Nouveau RDV</span>
            <span className="sm:hidden">RDV</span>
          </Button>
        </Link>
        <Link href="/clients">
          <Button
            className="w-full justify-start gap-2 h-8 text-xs"
            variant="outline"
          >
            <User className="h-3 w-3" />
            <span className="hidden sm:inline">Ajouter Client</span>
            <span className="sm:hidden">Client</span>
          </Button>
        </Link>
        <Link href="/meeting-room">
          <Button
            className="w-full justify-start gap-2 h-8 text-xs"
            variant="outline"
          >
            <Video className="h-3 w-3" />
            <span className="hidden sm:inline">Réunion</span>
            <span className="sm:hidden">Meet</span>
          </Button>
        </Link>
        <Link href="/invoices">
          <Button
            className="w-full justify-start gap-2 h-8 text-xs"
            variant="outline"
          >
            <Receipt className="h-3 w-3" />
            <span className="hidden sm:inline">Factures</span>
            <span className="sm:hidden">€</span>
          </Button>
        </Link>
      </CardContent>
    </Card>
  );
}

interface AlertsCardProps {
  overdueInvoices: number;
  upcomingAppointments: number;
}

export function AlertsCard({
  overdueInvoices,
  upcomingAppointments,
}: AlertsCardProps) {
  const hasAlerts = overdueInvoices > 0 || upcomingAppointments > 0;

  if (!hasAlerts) {
    return null;
  }

  return (
    <Card className="border-orange-200 bg-orange-50 px-3 py-4 gap-2">
      <CardHeader className="px-2">
        <CardTitle className="flex items-center gap-2 text-orange-800 text-sm ">
          <AlertTriangle className="h-4 w-4" />
          Alertes
        </CardTitle>
      </CardHeader>
      <CardContent className="px-2">
        <div className="space-y-2">
          {overdueInvoices > 0 && (
            <Link href="/invoices">
              <div className="flex items-center justify-between p-2 bg-red-50 rounded-lg cursor-pointer hover:bg-red-100 transition-colors">
                <div className="flex items-center gap-2">
                  <Receipt className="h-3 w-3 text-red-600" />
                  <span className="font-medium text-red-800 text-xs">
                    Factures en retard
                  </span>
                </div>
                <Badge variant="destructive" className="text-xs">
                  {overdueInvoices}
                </Badge>
              </div>
            </Link>
          )}
          {upcomingAppointments > 0 && (
            <Link href="/calendar">
              <div className="flex items-center justify-between p-2 bg-blue-50 rounded cursor-pointer hover:bg-blue-100 transition-colors">
                <div className="flex items-center gap-2">
                  <Calendar className="h-3 w-3 text-blue-600" />
                  <span className="font-medium text-blue-800 text-xs">
                    RDV cette semaine
                  </span>
                </div>
                <Badge className="bg-blue-100 text-blue-800 text-xs">
                  {upcomingAppointments}
                </Badge>
              </div>
            </Link>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
