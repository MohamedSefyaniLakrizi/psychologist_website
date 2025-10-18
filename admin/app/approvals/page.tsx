"use client";

import { useState, useEffect } from "react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/app/components/ui/table";
import { Button } from "@/app/components/ui/button";
import { Badge } from "@/app/components/ui/badge";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/app/components/ui/card";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/app/components/ui/alert-dialog";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/app/components/ui/tooltip";
import {
  Check,
  X,
  User,
  Calendar,
  Clock,
  Mail,
  Phone,
  UserCheck,
  CalendarCheck,
} from "lucide-react";
import { toast } from "sonner";
import {
  getPendingClients,
  getPendingAppointments,
  approveClient,
  rejectClient,
  approveAppointment,
  rejectAppointment,
} from "@/lib/actions/approvals";

interface PendingClient {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phoneNumber: string;
  preferredContact: string;
  defaultRate: number;
  sendInvoiceAutomatically: boolean;
  createdAt: Date;
}

interface PendingAppointment {
  id: string;
  clientId: string;
  startTime: Date;
  endTime: Date;
  format: string;
  createdAt: Date;
  client: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    phoneNumber: string;
  };
}

export default function ApprovalsPage() {
  const [pendingClients, setPendingClients] = useState<PendingClient[]>([]);
  const [pendingAppointments, setPendingAppointments] = useState<
    PendingAppointment[]
  >([]);
  const [isLoading, setIsLoading] = useState(true);

  // Alert dialog state
  const [alertOpen, setAlertOpen] = useState(false);
  const [alertMode, setAlertMode] = useState<
    | "approve-client"
    | "reject-client"
    | "approve-appointment"
    | "reject-appointment"
    | null
  >(null);
  const [targetId, setTargetId] = useState<string>("");
  const [targetName, setTargetName] = useState<string>("");

  useEffect(() => {
    fetchPendingData();
  }, []);

  const fetchPendingData = async () => {
    try {
      setIsLoading(true);
      const [clients, appointments] = await Promise.all([
        getPendingClients(),
        getPendingAppointments(),
      ]);
      setPendingClients(clients);
      setPendingAppointments(appointments);
    } catch (error) {
      toast.error("Erreur lors du chargement des données en attente");
      console.error("Error fetching pending data:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleApproveClient = async (clientId: string, clientName: string) => {
    setTargetId(clientId);
    setTargetName(clientName);
    setAlertMode("approve-client");
    setAlertOpen(true);
  };

  const handleRejectClient = async (clientId: string, clientName: string) => {
    setTargetId(clientId);
    setTargetName(clientName);
    setAlertMode("reject-client");
    setAlertOpen(true);
  };

  const handleApproveAppointment = async (
    appointmentId: string,
    clientName: string
  ) => {
    setTargetId(appointmentId);
    setTargetName(clientName);
    setAlertMode("approve-appointment");
    setAlertOpen(true);
  };

  const handleRejectAppointment = async (
    appointmentId: string,
    clientName: string
  ) => {
    setTargetId(appointmentId);
    setTargetName(clientName);
    setAlertMode("reject-appointment");
    setAlertOpen(true);
  };

  const confirmAction = async () => {
    try {
      switch (alertMode) {
        case "approve-client":
          await approveClient(targetId);
          toast.success("Client approuvé avec succès");
          break;
        case "reject-client":
          await rejectClient(targetId);
          toast.success("Client rejeté avec succès");
          break;
        case "approve-appointment":
          await approveAppointment(targetId);
          toast.success("Rendez-vous approuvé avec succès");
          break;
        case "reject-appointment":
          await rejectAppointment(targetId);
          toast.success("Rendez-vous rejeté avec succès");
          break;
      }
      setAlertOpen(false);
      setTargetId("");
      setTargetName("");
      setAlertMode(null);
      fetchPendingData();
    } catch (error) {
      toast.error("Erreur lors de l'action");
      console.error("Error performing action:", error);
    }
  };

  const getAlertContent = () => {
    switch (alertMode) {
      case "approve-client":
        return {
          title: "Approuver le client",
          description: `Êtes-vous sûr de vouloir approuver le client ${targetName} ? Il sera ajouté à votre liste de clients.`,
          action: "Approuver",
        };
      case "reject-client":
        return {
          title: "Rejeter le client",
          description: `Êtes-vous sûr de vouloir rejeter le client ${targetName} ? Cette action supprimera définitivement ce client.`,
          action: "Rejeter",
        };
      case "approve-appointment":
        return {
          title: "Approuver le rendez-vous",
          description: `Êtes-vous sûr de vouloir approuver le rendez-vous avec ${targetName} ? Ce rendez-vous apparaîtra dans votre calendrier.`,
          action: "Approuver",
        };
      case "reject-appointment":
        return {
          title: "Rejeter le rendez-vous",
          description: `Êtes-vous sûr de vouloir rejeter le rendez-vous avec ${targetName} ? Cette action supprimera définitivement ce rendez-vous.`,
          action: "Rejeter",
        };
      default:
        return { title: "", description: "", action: "" };
    }
  };

  if (isLoading) {
    return (
      <div className="flex h-screen w-full items-center justify-center">
        <div className="text-lg">Chargement des données en attente...</div>
      </div>
    );
  }

  const alertContent = getAlertContent();

  return (
    <div className="h-full w-full p-6 space-y-6">
      {/* Alert Dialog */}
      <AlertDialog open={alertOpen} onOpenChange={setAlertOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{alertContent.title}</AlertDialogTitle>
            <AlertDialogDescription>
              {alertContent.description}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel
              onClick={() => {
                setAlertOpen(false);
                setTargetId("");
                setTargetName("");
                setAlertMode(null);
              }}
            >
              Annuler
            </AlertDialogCancel>
            <AlertDialogAction onClick={confirmAction}>
              {alertContent.action}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Approbations en attente</h1>
        <div className="flex items-center gap-4">
          <Badge variant="outline" className="text-sm">
            {pendingClients.length} clients en attente
          </Badge>
          <Badge variant="outline" className="text-sm">
            {pendingAppointments.length} rendez-vous en attente
          </Badge>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Nouveaux Clients
            </CardTitle>
            <UserCheck className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{pendingClients.length}</div>
            <p className="text-xs text-muted-foreground">
              En attente d&apos;approbation
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Nouveaux Rendez-vous
            </CardTitle>
            <CalendarCheck className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {pendingAppointments.length}
            </div>
            <p className="text-xs text-muted-foreground">
              En attente d&apos;approbation
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Pending Clients Table */}
      <Card>
        <CardHeader>
          <CardTitle>Clients en attente ({pendingClients.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Client</TableHead>
                <TableHead>Contact</TableHead>
                <TableHead>Tarif par défaut</TableHead>
                <TableHead>Facture auto</TableHead>
                <TableHead>Demandé le</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {pendingClients.map((client) => (
                <TableRow key={client.id}>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <User className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <div className="font-medium">
                          {client.firstName} {client.lastName}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          {client.email}
                        </div>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      {client.preferredContact === "PHONE" ? (
                        <Phone className="h-3 w-3" />
                      ) : (
                        <Mail className="h-3 w-3" />
                      )}
                      <span className="text-sm">{client.phoneNumber}</span>
                    </div>
                    <div className="text-xs text-muted-foreground">
                      Préfère: {client.preferredContact}
                    </div>
                  </TableCell>
                  <TableCell className="font-mono">
                    {client.defaultRate} Dh
                  </TableCell>
                  <TableCell>
                    <Badge
                      className={
                        client.sendInvoiceAutomatically
                          ? "bg-green-100 text-green-800"
                          : "bg-gray-100 text-gray-800"
                      }
                    >
                      {client.sendInvoiceAutomatically ? "Oui" : "Non"}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {format(new Date(client.createdAt), "dd/MM/yyyy à HH:mm", {
                      locale: fr,
                    })}
                  </TableCell>
                  <TableCell>
                    <TooltipProvider>
                      <div className="flex items-center gap-2">
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() =>
                                handleApproveClient(
                                  client.id,
                                  `${client.firstName} ${client.lastName}`
                                )
                              }
                              className="text-green-600 hover:text-green-700"
                            >
                              <Check className="h-4 w-4" />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>Approuver le client</p>
                          </TooltipContent>
                        </Tooltip>

                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() =>
                                handleRejectClient(
                                  client.id,
                                  `${client.firstName} ${client.lastName}`
                                )
                              }
                              className="text-red-600 hover:text-red-700"
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>Rejeter le client</p>
                          </TooltipContent>
                        </Tooltip>
                      </div>
                    </TooltipProvider>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          {pendingClients.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              Aucun client en attente d&apos;approbation
            </div>
          )}
        </CardContent>
      </Card>

      {/* Pending Appointments Table */}
      <Card>
        <CardHeader>
          <CardTitle>
            Rendez-vous en attente ({pendingAppointments.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Client</TableHead>
                <TableHead>Date et heure</TableHead>
                <TableHead>Format</TableHead>
                <TableHead>Durée</TableHead>
                <TableHead>Demandé le</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {pendingAppointments.map((appointment) => (
                <TableRow key={appointment.id}>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <User className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <div className="font-medium">
                          {appointment.client.firstName}{" "}
                          {appointment.client.lastName}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          {appointment.client.email}
                        </div>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <div className="font-medium">
                          {format(new Date(appointment.startTime), "PPP", {
                            locale: fr,
                          })}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          {format(new Date(appointment.startTime), "HH:mm", {
                            locale: fr,
                          })}{" "}
                          -{" "}
                          {format(new Date(appointment.endTime), "HH:mm", {
                            locale: fr,
                          })}
                        </div>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge
                      className={
                        appointment.format === "ONLINE"
                          ? "bg-blue-100 text-blue-800"
                          : "bg-purple-100 text-purple-800"
                      }
                    >
                      {appointment.format === "ONLINE"
                        ? "En ligne"
                        : "Présentiel"}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      <Clock className="h-3 w-3 text-muted-foreground" />
                      <span className="text-sm">
                        {Math.round(
                          (new Date(appointment.endTime).getTime() -
                            new Date(appointment.startTime).getTime()) /
                            (1000 * 60)
                        )}{" "}
                        min
                      </span>
                    </div>
                  </TableCell>
                  <TableCell>
                    {format(
                      new Date(appointment.createdAt),
                      "dd/MM/yyyy à HH:mm",
                      {
                        locale: fr,
                      }
                    )}
                  </TableCell>
                  <TableCell>
                    <TooltipProvider>
                      <div className="flex items-center gap-2">
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() =>
                                handleApproveAppointment(
                                  appointment.id,
                                  `${appointment.client.firstName} ${appointment.client.lastName}`
                                )
                              }
                              className="text-green-600 hover:text-green-700"
                            >
                              <Check className="h-4 w-4" />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>Approuver le rendez-vous</p>
                          </TooltipContent>
                        </Tooltip>

                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() =>
                                handleRejectAppointment(
                                  appointment.id,
                                  `${appointment.client.firstName} ${appointment.client.lastName}`
                                )
                              }
                              className="text-red-600 hover:text-red-700"
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>Rejeter le rendez-vous</p>
                          </TooltipContent>
                        </Tooltip>
                      </div>
                    </TooltipProvider>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          {pendingAppointments.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              Aucun rendez-vous en attente d&apos;approbation
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
