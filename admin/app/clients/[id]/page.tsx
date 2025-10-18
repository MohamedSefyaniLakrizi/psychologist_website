"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/app/components/ui/card";
import { Button } from "@/app/components/ui/button";
import { Badge } from "@/app/components/ui/badge";
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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/app/components/ui/dialog";
import { Input } from "@/app/components/ui/input";
import { Label } from "@/app/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/app/components/ui/select";
import {
  User,
  Calendar,
  FileText,
  Edit,
  Video,
  Plus,
  Mail,
  Phone,
  CreditCard,
  Clock,
  CheckCircle,
  AlertCircle,
  ArrowLeft,
  MessageSquare,
} from "lucide-react";
import { toast } from "sonner";

interface Client {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phoneNumber: string;
  preferredContact: string;
  sendInvoiceAutomatically: boolean;
  defaultRate: number;
  createdAt: string;
  updatedAt: string;
}

interface Appointment {
  id: string;
  startTime: string;
  endTime: string;
  format: "ONLINE" | "FACE_TO_FACE";
  status: string;
  isCompleted: boolean;
  hostJwt?: string;
  clientJwt?: string;
}

interface Note {
  id: string;
  title: string;
  content: any;
  createdAt: string;
  updatedAt: string;
  appointmentId?: string;
}

interface Invoice {
  id: string;
  amount: number;
  status: "UNPAID" | "PAID" | "OVERDUE";
  createdAt: string;
  dueDate?: string;
}

interface ClientStats {
  totalAppointments: number;
  totalPaid: number;
  totalOwed: number;
  upcomingAppointments: number;
}

export default function ClientDetailPage() {
  const params = useParams();
  const router = useRouter();
  const clientId = params.id as string;

  // Utility function to safely convert to number for toFixed
  const safeToFixed = (value: any, decimals: number = 2): string => {
    const num = Number(value);
    return (isNaN(num) ? 0 : num).toFixed(decimals);
  };

  const [client, setClient] = useState<Client | null>(null);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [notes, setNotes] = useState<Note[]>([]);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [stats, setStats] = useState<ClientStats>({
    totalAppointments: 0,
    totalPaid: 0,
    totalOwed: 0,
    upcomingAppointments: 0,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isStartingMeeting, setIsStartingMeeting] = useState(false);

  // Edit form state
  const [editForm, setEditForm] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phoneNumber: "",
    preferredContact: "",
    sendInvoiceAutomatically: true,
    defaultRate: 300,
  });

  const fetchClientData = useCallback(async () => {
    try {
      setIsLoading(true);

      // Fetch client details
      const clientResponse = await fetch(`/api/clients/${clientId}`);
      if (!clientResponse.ok) throw new Error("Client not found");
      const clientData = await clientResponse.json();
      setClient(clientData);
      setEditForm({
        firstName: clientData.firstName,
        lastName: clientData.lastName,
        email: clientData.email,
        phoneNumber: clientData.phoneNumber || "",
        preferredContact: clientData.preferredContact,
        sendInvoiceAutomatically: clientData.sendInvoiceAutomatically,
        defaultRate: clientData.defaultRate || 300,
      });

      // Fetch appointments
      const appointmentsResponse = await fetch(
        `/api/clients/${clientId}/appointments`
      );
      if (appointmentsResponse.ok) {
        const appointmentsData = await appointmentsResponse.json();
        setAppointments(appointmentsData);

        // Fetch notes
        const notesResponse = await fetch(`/api/clients/${clientId}/notes`);
        if (notesResponse.ok) {
          const notesData = await notesResponse.json();
          setNotes(notesData);
        }

        // Fetch invoices
        const invoicesResponse = await fetch(
          `/api/clients/${clientId}/invoices`
        );
        if (invoicesResponse.ok) {
          const invoicesData = await invoicesResponse.json();
          setInvoices(invoicesData);

          // Calculate stats
          const totalPaid = invoicesData
            .filter((inv: Invoice) => inv.status === "PAID")
            .reduce(
              (sum: number, inv: Invoice) => sum + (Number(inv.amount) || 0),
              0
            );

          const totalOwed = invoicesData
            .filter((inv: Invoice) => inv.status !== "PAID")
            .reduce(
              (sum: number, inv: Invoice) => sum + (Number(inv.amount) || 0),
              0
            );

          const now = new Date();
          const upcomingAppointments = appointmentsData.filter(
            (apt: Appointment) => new Date(apt.startTime) > now
          ).length;

          setStats({
            totalAppointments: appointmentsData.length || 0,
            totalPaid: Number(totalPaid) || 0,
            totalOwed: Number(totalOwed) || 0,
            upcomingAppointments: upcomingAppointments || 0,
          });
        }
      }
    } catch (error) {
      console.error("Error fetching client data:", error);
      toast.error("Erreur lors du chargement des données du client");
      router.push("/clients");
    } finally {
      setIsLoading(false);
    }
  }, [clientId, router]);

  useEffect(() => {
    if (clientId) {
      fetchClientData();
    }
  }, [clientId, fetchClientData]);

  const handleEditClient = async () => {
    try {
      const response = await fetch(`/api/clients/${clientId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(editForm),
      });

      if (!response.ok) throw new Error("Failed to update client");

      toast.success("Client mis à jour avec succès");
      setIsEditDialogOpen(false);
      fetchClientData();
    } catch (error) {
      console.error("Error updating client:", error);
      toast.error("Erreur lors de la mise à jour du client");
    }
  };

  const handleStartInstantMeeting = async () => {
    if (!client) return;

    try {
      setIsStartingMeeting(true);

      // Create instant appointment
      const appointmentResponse = await fetch("/api/appointments/instant", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          clientId: client.id,
          startTime: new Date(),
          endTime: new Date(Date.now() + 60 * 60 * 1000),
          format: "ONLINE",
        }),
      });

      if (!appointmentResponse.ok)
        throw new Error("Failed to create appointment");

      const appointment = await appointmentResponse.json();

      // Join the meeting as host
      if (appointment.hostJoinUrl) {
        router.push(appointment.hostJoinUrl);
      }

      toast.success("Réunion créée et email envoyé au client");
      fetchClientData(); // Refresh data
    } catch (error) {
      console.error("Error starting instant meeting:", error);
      toast.error("Erreur lors de la création de la réunion");
    } finally {
      setIsStartingMeeting(false);
    }
  };

  const handleCreateNote = () => {
    router.push(`/notes/new?clientId=${clientId}`);
  };

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      NOT_YET_ATTENDED: {
        label: "À venir",
        color: "bg-blue-100 text-blue-800",
      },
      ATTENDED: { label: "Assisté", color: "bg-green-100 text-green-800" },
      ABSENT: { label: "Absent", color: "bg-red-100 text-red-800" },
      CANCELLED: { label: "Annulé", color: "bg-gray-100 text-gray-800" },
    };

    const config =
      statusConfig[status as keyof typeof statusConfig] ||
      statusConfig.NOT_YET_ATTENDED;

    return <Badge className={config.color}>{config.label}</Badge>;
  };

  const getInvoiceStatusIcon = (status: string) => {
    switch (status) {
      case "PAID":
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case "OVERDUE":
        return <AlertCircle className="h-4 w-4 text-red-600" />;
      default:
        return <Clock className="h-4 w-4 text-yellow-600" />;
    }
  };

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="text-lg">Chargement des données du client...</div>
      </div>
    );
  }

  if (!client) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="text-lg">Client non trouvé</div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Back Button */}
      <Button
        variant="outline"
        onClick={() => router.push("/clients")}
        className="mb-4"
      >
        <ArrowLeft className="h-4 w-4 mr-2" />
        Retour aux clients
      </Button>

      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="flex items-center justify-center w-12 h-12 bg-primary/10 rounded-full">
            <User className="h-6 w-6 text-primary" />
          </div>
          <div>
            <h1 className="text-3xl font-bold">
              {client.firstName} {client.lastName}
            </h1>
            <p className="text-muted-foreground">{client.email}</p>
          </div>
        </div>

        <div className="flex gap-2">
          <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="outline">
                <Edit className="h-4 w-4 mr-2" />
                Modifier
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Modifier le client</DialogTitle>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="firstName">Prénom</Label>
                    <Input
                      id="firstName"
                      value={editForm.firstName}
                      onChange={(e) =>
                        setEditForm({ ...editForm, firstName: e.target.value })
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="lastName">Nom</Label>
                    <Input
                      id="lastName"
                      value={editForm.lastName}
                      onChange={(e) =>
                        setEditForm({ ...editForm, lastName: e.target.value })
                      }
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={editForm.email}
                    onChange={(e) =>
                      setEditForm({ ...editForm, email: e.target.value })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phoneNumber">Téléphone</Label>
                  <Input
                    id="phoneNumber"
                    value={editForm.phoneNumber}
                    onChange={(e) =>
                      setEditForm({ ...editForm, phoneNumber: e.target.value })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="preferredContact">Contact préféré</Label>
                  <Select
                    value={editForm.preferredContact}
                    onValueChange={(value) =>
                      setEditForm({ ...editForm, preferredContact: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="EMAIL">Email</SelectItem>
                      <SelectItem value="PHONE">Téléphone</SelectItem>
                      <SelectItem value="SMS">SMS</SelectItem>
                      <SelectItem value="WHATSAPP">WhatsApp</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="defaultRate">Tarif par défaut (Dh)</Label>
                  <Input
                    id="defaultRate"
                    type="number"
                    value={editForm.defaultRate}
                    onChange={(e) =>
                      setEditForm({
                        ...editForm,
                        defaultRate: Number(e.target.value),
                      })
                    }
                    min={0}
                  />
                </div>
              </div>
              <div className="flex justify-end gap-2">
                <Button
                  variant="outline"
                  onClick={() => setIsEditDialogOpen(false)}
                >
                  Annuler
                </Button>
                <Button onClick={handleEditClient}>Sauvegarder</Button>
              </div>
            </DialogContent>
          </Dialog>

          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button>
                <Video className="h-4 w-4 mr-2" />
                Démarrer une séance
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>
                  Démarrer une séance instantanée
                </AlertDialogTitle>
                <AlertDialogDescription>
                  Cela va créer un rendez-vous immédiat avec {client.firstName}{" "}
                  {client.lastName} et envoyer un email avec le lien de la
                  réunion. Voulez-vous continuer ?
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Annuler</AlertDialogCancel>
                <AlertDialogAction
                  onClick={handleStartInstantMeeting}
                  disabled={isStartingMeeting}
                >
                  {isStartingMeeting ? "Création..." : "Démarrer la séance"}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Total Rendez-vous
            </CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalAppointments}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">À venir</CardTitle>
            <Clock className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">
              {stats.upcomingAppointments}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Payé</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {safeToFixed(stats.totalPaid)} Dh
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Dû</CardTitle>
            <CreditCard className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              {safeToFixed(stats.totalOwed)} Dh
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Client Information */}
      <Card>
        <CardHeader>
          <CardTitle>Informations du client</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-6 md:grid-cols-2">
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <User className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-sm text-muted-foreground">Nom complet</p>
                  <p className="font-medium">
                    {client.firstName} {client.lastName}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <Mail className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-sm text-muted-foreground">Adresse email</p>
                  <p className="font-medium">{client.email}</p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <Phone className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-sm text-muted-foreground">
                    Numéro de téléphone
                  </p>
                  <p className="font-medium">
                    {client.phoneNumber || "Non renseigné"}
                  </p>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <MessageSquare className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-sm text-muted-foreground">
                    Contact préféré
                  </p>
                  <p className="font-medium">
                    {client.preferredContact === "EMAIL" && "Email"}
                    {client.preferredContact === "PHONE" && "Téléphone"}
                    {client.preferredContact === "SMS" && "SMS"}
                    {client.preferredContact === "WHATSAPP" && "WhatsApp"}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <CreditCard className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-sm text-muted-foreground">
                    Tarif par défaut
                  </p>
                  <p className="font-medium">{client.defaultRate} Dh</p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <CheckCircle className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-sm text-muted-foreground">
                    Facturation automatique
                  </p>
                  <Badge
                    className={
                      client.sendInvoiceAutomatically
                        ? "bg-green-100 text-green-800"
                        : "bg-gray-100 text-gray-800"
                    }
                  >
                    {client.sendInvoiceAutomatically ? "Activée" : "Désactivée"}
                  </Badge>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-sm text-muted-foreground">Client depuis</p>
                  <p className="font-medium">
                    {format(new Date(client.createdAt), "PPP", { locale: fr })}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Upcoming Appointments */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Prochains rendez-vous</CardTitle>
            {appointments.filter((apt) => new Date(apt.startTime) > new Date())
              .length > 3 && (
              <Button
                size="sm"
                variant="outline"
                onClick={() => router.push(`/calendar?clientId=${clientId}`)}
              >
                Voir tout
              </Button>
            )}
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {appointments
                .filter((apt) => new Date(apt.startTime) > new Date())
                .slice(0, 3)
                .map((appointment) => (
                  <div
                    key={appointment.id}
                    className="flex items-center justify-between p-3 border rounded-lg"
                  >
                    <div className="flex items-center gap-3">
                      <Calendar className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <p className="font-medium">
                          {format(
                            new Date(appointment.startTime),
                            "PPP 'à' HH:mm",
                            { locale: fr }
                          )}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {appointment.format === "ONLINE"
                            ? "En ligne"
                            : "En personne"}
                        </p>
                      </div>
                    </div>
                    {getStatusBadge(appointment.status)}
                  </div>
                ))}
              {appointments.filter(
                (apt) => new Date(apt.startTime) > new Date()
              ).length === 0 && (
                <p className="text-muted-foreground text-center py-4">
                  Aucun rendez-vous à venir
                </p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Recent Notes */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Notes récentes</CardTitle>
            <div className="flex gap-2">
              {notes.length > 3 && (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => router.push(`/notes/client/${clientId}`)}
                >
                  Voir tout
                </Button>
              )}
              <Button size="sm" onClick={handleCreateNote}>
                <Plus className="h-4 w-4 mr-2" />
                Nouvelle note
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {notes.slice(0, 3).map((note) => (
                <div
                  key={note.id}
                  className="flex items-center justify-between p-3 border rounded-lg"
                >
                  <div className="flex items-center gap-3">
                    <FileText className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="font-medium">{note.title}</p>
                      <p className="text-sm text-muted-foreground">
                        {format(new Date(note.createdAt), "PPP", {
                          locale: fr,
                        })}
                      </p>
                    </div>
                  </div>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => router.push(`/notes/${note.id}`)}
                  >
                    Voir
                  </Button>
                </div>
              ))}
              {notes.length === 0 && (
                <p className="text-muted-foreground text-center py-4">
                  Aucune note disponible
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Invoices */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Factures récentes</CardTitle>
          {invoices.length > 5 && (
            <Button
              size="sm"
              variant="outline"
              onClick={() => router.push(`/invoices?clientId=${clientId}`)}
            >
              Voir tout
            </Button>
          )}
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {invoices.slice(0, 5).map((invoice) => (
              <div
                key={invoice.id}
                className="flex items-center justify-between p-3 border rounded-lg"
              >
                <div className="flex items-center gap-3">
                  {getInvoiceStatusIcon(invoice.status)}
                  <div>
                    <p className="font-medium">
                      Facture #{invoice.id.slice(-8).toUpperCase()}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {format(new Date(invoice.createdAt), "PPP", {
                        locale: fr,
                      })}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-medium">
                    {safeToFixed(invoice.amount)} Dh
                  </p>
                  <Badge
                    className={
                      invoice.status === "PAID"
                        ? "bg-green-100 text-green-800"
                        : invoice.status === "OVERDUE"
                          ? "bg-red-100 text-red-800"
                          : "bg-yellow-100 text-yellow-800"
                    }
                  >
                    {invoice.status === "PAID" && "Payée"}
                    {invoice.status === "UNPAID" && "Non payée"}
                    {invoice.status === "OVERDUE" && "En retard"}
                  </Badge>
                </div>
              </div>
            ))}
            {invoices.length === 0 && (
              <p className="text-muted-foreground text-center py-4">
                Aucune facture disponible
              </p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
