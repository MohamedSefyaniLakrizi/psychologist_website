"use client";

import { useState, useEffect } from "react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import {
  generateInvoicePdf as generatePdf,
  generateInvoiceFilename,
} from "@/lib/pdf-generator";
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
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/app/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle as _AlertDialogTitle,
} from "@/app/components/ui/alert-dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/app/components/ui/select";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/app/components/ui/tooltip";
import { Input } from "@/app/components/ui/input";
import { Label } from "@/app/components/ui/label";
import { Textarea } from "@/app/components/ui/textarea";
import {
  Plus,
  FileText,
  BanknoteArrowUp,
  Clock,
  CheckCircle,
  AlertCircle,
  Calendar,
  User,
  Edit,
  Trash2,
  Mail,
  MailCheck,
  MailX,
} from "lucide-react";
import { toast } from "sonner";
import {
  getInvoices,
  createInvoice,
  updateInvoice,
  deleteInvoice,
  markInvoiceOverdue,
  markInvoiceEmailSent,
  type Invoice,
  type CreateInvoiceData,
} from "@/lib/actions/invoices";
import { getClientsForNotes, type Client } from "@/lib/actions/notes";
import { getAppointments } from "@/lib/actions/appointments";
import { type IEvent } from "@/app/components/calendar/interfaces";

const statusColors = {
  UNPAID: "bg-yellow-100 text-yellow-800",
  PAID: "bg-green-100 text-green-800",
  OVERDUE: "bg-red-100 text-red-800",
};

const statusIcons = {
  UNPAID: Clock,
  PAID: CheckCircle,
  OVERDUE: AlertCircle,
};

const paymentMethods = {
  CASH: "Espèces",
  CARD: "Carte",
  BANK_TRANSFER: "Virement",
  CHECK: "Chèque",
  OTHER: "Autre",
};

export default function InvoicesPage() {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [appointments, setAppointments] = useState<IEvent[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [editingInvoice, setEditingInvoice] = useState<Invoice | null>(null);

  // New alert dialog state
  const [alertOpen, setAlertOpen] = useState(false);
  const [alertMode, setAlertMode] = useState<"delete" | "email" | null>(null);
  const [targetInvoice, setTargetInvoice] = useState<Invoice | null>(null);

  // Form state
  const [formData, setFormData] = useState({
    clientId: "",
    appointmentId: "",
    amount: "",
    description: "",
    dueDate: "",
    paymentMethod: "",
    status: "UNPAID" as "UNPAID" | "PAID" | "OVERDUE",
  });

  // Filter state
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [clientFilter, setClientFilter] = useState<string>("ALL");

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setIsLoading(true);
      const [invoicesData, clientsData, appointmentsData] = await Promise.all([
        getInvoices(),
        getClientsForNotes(),
        getAppointments(),
      ]);

      setInvoices(invoicesData);
      setClients(clientsData);
      setAppointments(appointmentsData);

      // Mark overdue invoices
      await markInvoiceOverdue();
    } catch (error) {
      toast.error("Erreur lors du chargement des données");
      console.error("Error fetching data:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateInvoice = async () => {
    try {
      if (!formData.clientId || !formData.amount) {
        toast.error("Veuillez remplir tous les champs obligatoires");
        return;
      }

      const createData: CreateInvoiceData = {
        clientId: formData.clientId,
        amount: parseFloat(formData.amount),
        description: formData.description || undefined,
        dueDate: formData.dueDate ? new Date(formData.dueDate) : undefined,
        appointmentId:
          formData.appointmentId && formData.appointmentId !== "none"
            ? formData.appointmentId
            : undefined,
      };

      await createInvoice(createData);
      toast.success("Facture créée avec succès");
      setIsCreateDialogOpen(false);
      setEditingInvoice(null); // Reset editing state
      resetForm();
      fetchData();
    } catch (error) {
      toast.error("Erreur lors de la création de la facture");
      console.error("Error creating invoice:", error);
    }
  };

  const handleUpdateInvoice = async () => {
    if (!editingInvoice) return;

    try {
      const updateData: any = {};

      if (formData.amount) updateData.amount = parseFloat(formData.amount);
      if (formData.status) updateData.status = formData.status;
      if (formData.paymentMethod)
        updateData.paymentMethod = formData.paymentMethod;
      if (formData.description !== undefined)
        updateData.description = formData.description;
      if (formData.dueDate) updateData.dueDate = new Date(formData.dueDate);

      await updateInvoice(editingInvoice.id, updateData);
      toast.success("Facture mise à jour avec succès");
      setIsCreateDialogOpen(false); // Close the dialog
      setEditingInvoice(null);
      resetForm();
      fetchData();
    } catch (error) {
      toast.error("Erreur lors de la mise à jour de la facture");
      console.error("Error updating invoice:", error);
    }
  };

  // Replace delete handler to open alert dialog
  const handleDeleteInvoice = (invoice: Invoice) => {
    setTargetInvoice(invoice);
    setAlertMode("delete");
    setAlertOpen(true);
  };

  // Replace email handler to open alert dialog
  const handleEmailInvoice = async (invoice: Invoice) => {
    if (!invoice.client.email) {
      toast.error("Aucune adresse email disponible pour ce client");
      return;
    }

    setTargetInvoice(invoice);
    setAlertMode("email");
    setAlertOpen(true);
  };

  // Confirm deletion (called from AlertDialog)
  const confirmDelete = async () => {
    if (!targetInvoice) return;
    try {
      await deleteInvoice(targetInvoice.id);
      toast.success("Facture supprimée avec succès");
      setAlertOpen(false);
      setTargetInvoice(null);
      setAlertMode(null);
      fetchData();
    } catch (error) {
      toast.error("Erreur lors de la suppression de la facture");
      console.error("Error deleting invoice:", error);
    }
  };

  // Confirm email send (called from AlertDialog)
  const confirmEmail = async () => {
    if (!targetInvoice) return;

    try {
      const loadingToast = toast.loading("Envoi de la facture par email...");

      const response = await fetch("/api/send-invoice-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ invoiceId: targetInvoice.id }),
      });

      toast.dismiss(loadingToast);

      if (response.ok) {
        // Mark invoice as email sent
        await markInvoiceEmailSent(targetInvoice.id);
        toast.success("Facture envoyée par email avec succès");
        fetchData(); // Refresh data to show updated email status
      } else {
        const errorData = await response.json();
        toast.error(errorData.error || "Erreur lors de l'envoi de l'email");
      }

      setAlertOpen(false);
      setTargetInvoice(null);
      setAlertMode(null);
    } catch (error) {
      toast.error("Erreur lors de l'envoi de l'email");
      console.error("Error sending invoice email:", error);
      setAlertOpen(false);
      setTargetInvoice(null);
      setAlertMode(null);
    }
  };

  // Generate and download PDF (client-side)
  const generateInvoicePdf = (invoice: Invoice) => {
    try {
      const pdfBuffer = generatePdf(invoice);
      const filename = generateInvoiceFilename(invoice.id);

      const blob = new Blob([pdfBuffer], { type: "application/pdf" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      toast.success("Facture PDF générée avec succès");
    } catch (error) {
      toast.error("Erreur lors de la génération du PDF");
      console.error("Error generating PDF:", error);
    }
  };

  const resetForm = () => {
    setFormData({
      clientId: "",
      appointmentId: "none",
      amount: "",
      description: "",
      dueDate: "",
      paymentMethod: "",
      status: "UNPAID" as "UNPAID" | "PAID" | "OVERDUE",
    });
    setEditingInvoice(null); // Reset editing state
  };

  const openEditDialog = (invoice: Invoice) => {
    setEditingInvoice(invoice);
    setFormData({
      clientId: invoice.clientId,
      appointmentId: invoice.appointmentId || "none",
      amount: invoice.amount.toString(),
      description: invoice.description || "",
      dueDate: invoice.dueDate
        ? format(new Date(invoice.dueDate), "yyyy-MM-dd")
        : "",
      paymentMethod: invoice.paymentMethod || "",
      status: invoice.status,
    });
    setIsCreateDialogOpen(true); // Open the dialog
  };

  // Filter invoices
  const filteredInvoices = invoices.filter((invoice) => {
    const statusMatch =
      statusFilter === "ALL" || invoice.status === statusFilter;
    const clientMatch =
      clientFilter === "ALL" || invoice.clientId === clientFilter;
    return statusMatch && clientMatch;
  });

  // Calculate totals
  const totals = {
    total: invoices.reduce((sum, inv) => sum + inv.amount, 0),
    paid: invoices
      .filter((inv) => inv.status === "PAID")
      .reduce((sum, inv) => sum + inv.amount, 0),
    unpaid: invoices
      .filter((inv) => inv.status === "UNPAID")
      .reduce((sum, inv) => sum + inv.amount, 0),
    overdue: invoices
      .filter((inv) => inv.status === "OVERDUE")
      .reduce((sum, inv) => sum + inv.amount, 0),
  };

  if (isLoading) {
    return (
      <div className="flex h-screen w-full items-center justify-center">
        <div className="text-lg">Chargement des factures...</div>
      </div>
    );
  }

  return (
    <div className="h-full w-full p-6 space-y-6">
      {/* Alert Dialog used for both delete and email confirmation */}
      <AlertDialog open={alertOpen} onOpenChange={setAlertOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <_AlertDialogTitle>
              {alertMode === "delete"
                ? "Confirmer la suppression"
                : "Confirmer l'envoi par email"}
            </_AlertDialogTitle>
            <AlertDialogDescription>
              {alertMode === "delete"
                ? `Êtes-vous sûr de vouloir supprimer la facture ${targetInvoice ? targetInvoice.id.slice(-8).toUpperCase() : ""} ? Cette action est irréversible.`
                : `Voulez-vous envoyer la facture par email à ${targetInvoice?.client.firstName} ${targetInvoice?.client.lastName} (${targetInvoice?.client.email}) ?`}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel
              onClick={() => {
                setAlertOpen(false);
                setTargetInvoice(null);
                setAlertMode(null);
              }}
            >
              Annuler
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={async () => {
                if (alertMode === "delete") await confirmDelete();
                else if (alertMode === "email") await confirmEmail();
              }}
            >
              Confirmer
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Gestion des Factures</h1>
        <Dialog
          open={isCreateDialogOpen}
          onOpenChange={(open) => {
            setIsCreateDialogOpen(open);
            if (!open) {
              setEditingInvoice(null);
              resetForm();
            }
          }}
        >
          <DialogTrigger asChild>
            <Button onClick={resetForm}>
              <Plus className="h-4 w-4 mr-2" />
              Nouvelle Facture
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[600px]">
            <DialogHeader>
              <DialogTitle>
                {editingInvoice
                  ? "Modifier la Facture"
                  : "Créer une Nouvelle Facture"}
              </DialogTitle>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="client">Client *</Label>
                  <Select
                    value={formData.clientId}
                    onValueChange={(value) =>
                      setFormData((prev) => ({ ...prev, clientId: value }))
                    }
                    disabled={!!editingInvoice}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Sélectionner un client" />
                    </SelectTrigger>
                    <SelectContent>
                      {clients.map((client) => (
                        <SelectItem key={client.id} value={client.id}>
                          {client.firstName} {client.lastName}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="appointment">Rendez-vous (optionnel)</Label>
                  <Select
                    value={formData.appointmentId}
                    onValueChange={(value) =>
                      setFormData((prev) => ({ ...prev, appointmentId: value }))
                    }
                    disabled={!!editingInvoice}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Sélectionner un rendez-vous" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">Aucun rendez-vous</SelectItem>
                      {appointments
                        .filter(
                          (apt) =>
                            !formData.clientId ||
                            apt.clientId === formData.clientId
                        )
                        .map((appointment) => (
                          <SelectItem
                            key={appointment.id}
                            value={appointment.id}
                          >
                            {format(
                              new Date(appointment.startDate),
                              "PPP 'à' HH:mm",
                              { locale: fr }
                            )}
                          </SelectItem>
                        ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="amount">Montant (Dh) *</Label>
                  <Input
                    id="amount"
                    type="number"
                    step="0.01"
                    value={formData.amount}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        amount: e.target.value,
                      }))
                    }
                    placeholder="0.00"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="dueDate">Date d&apos;échéance</Label>
                  <Input
                    id="dueDate"
                    type="date"
                    value={formData.dueDate}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        dueDate: e.target.value,
                      }))
                    }
                  />
                </div>
              </div>

              {editingInvoice && (
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="status">Statut</Label>
                    <Select
                      value={formData.status}
                      onValueChange={(value: any) =>
                        setFormData((prev) => ({ ...prev, status: value }))
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="UNPAID">Non payé</SelectItem>
                        <SelectItem value="PAID">Payé</SelectItem>
                        <SelectItem value="OVERDUE">En retard</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="paymentMethod">Méthode de paiement</Label>
                    <Select
                      value={formData.paymentMethod}
                      onValueChange={(value) =>
                        setFormData((prev) => ({
                          ...prev,
                          paymentMethod: value,
                        }))
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Sélectionner une méthode" />
                      </SelectTrigger>
                      <SelectContent>
                        {Object.entries(paymentMethods).map(([key, label]) => (
                          <SelectItem key={key} value={key}>
                            {label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      description: e.target.value,
                    }))
                  }
                  placeholder="Description de la facture..."
                />
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <Button
                variant="outline"
                onClick={() => {
                  setIsCreateDialogOpen(false);
                  setEditingInvoice(null);
                  resetForm();
                }}
              >
                Annuler
              </Button>
              <Button
                onClick={
                  editingInvoice ? handleUpdateInvoice : handleCreateInvoice
                }
              >
                {editingInvoice ? "Mettre à jour" : "Créer"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total</CardTitle>
            <BanknoteArrowUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {totals.total.toFixed(2)} Dh
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
              {totals.paid.toFixed(2)} Dh
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Non payé</CardTitle>
            <Clock className="h-4 w-4 text-yellow-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">
              {totals.unpaid.toFixed(2)} Dh
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">En retard</CardTitle>
            <AlertCircle className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              {totals.overdue.toFixed(2)} Dh
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex gap-4">
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Filtrer par statut" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">Tous les statuts</SelectItem>
            <SelectItem value="UNPAID">Non payé</SelectItem>
            <SelectItem value="PAID">Payé</SelectItem>
            <SelectItem value="OVERDUE">En retard</SelectItem>
          </SelectContent>
        </Select>
        <Select value={clientFilter} onValueChange={setClientFilter}>
          <SelectTrigger className="w-[200px]">
            <SelectValue placeholder="Filtrer par client" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">Tous les clients</SelectItem>
            {clients.map((client) => (
              <SelectItem key={client.id} value={client.id}>
                {client.firstName} {client.lastName}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Invoices Table */}
      <Card>
        <CardHeader>
          <CardTitle>Factures ({filteredInvoices.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Client</TableHead>
                <TableHead>Montant</TableHead>
                <TableHead>Statut</TableHead>
                <TableHead>Email envoyé</TableHead>
                <TableHead>Rendez-vous</TableHead>
                <TableHead>Créée le</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredInvoices.map((invoice) => {
                const StatusIcon = statusIcons[invoice.status];
                return (
                  <TableRow key={invoice.id}>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <User className="h-4 w-4 text-muted-foreground" />
                        <div>
                          <div className="font-medium">
                            {invoice.client.firstName} {invoice.client.lastName}
                          </div>
                          <div className="text-sm text-muted-foreground">
                            {invoice.client.email}
                          </div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="font-mono">
                      {invoice.amount.toFixed(2)} Dh
                    </TableCell>
                    <TableCell>
                      <Badge className={statusColors[invoice.status]}>
                        <StatusIcon className="h-3 w-3 mr-1" />
                        {invoice.status === "UNPAID" && "Non payé"}
                        {invoice.status === "PAID" && "Payé"}
                        {invoice.status === "OVERDUE" && "En retard"}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge
                        className={
                          invoice.emailSent
                            ? "bg-green-100 text-green-800"
                            : "bg-gray-100 text-gray-800"
                        }
                      >
                        {invoice.emailSent ? (
                          <>
                            <MailCheck className="h-3 w-3 mr-1" />
                            Envoyé
                          </>
                        ) : (
                          <>
                            <MailX className="h-3 w-3 mr-1" />
                            Non envoyé
                          </>
                        )}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {invoice.appointment ? (
                        <div className="flex items-center gap-1">
                          <Calendar className="h-3 w-3 text-muted-foreground" />
                          <div className="text-sm">
                            <div className="font-medium">
                              {format(
                                new Date(invoice.appointment.startTime),
                                "dd/MM/yyyy",
                                {
                                  locale: fr,
                                }
                              )}
                            </div>
                            <div className="text-muted-foreground">
                              {format(
                                new Date(invoice.appointment.startTime),
                                "HH:mm",
                                {
                                  locale: fr,
                                }
                              )}
                            </div>
                          </div>
                        </div>
                      ) : (
                        <span className="text-muted-foreground">-</span>
                      )}
                    </TableCell>
                    <TableCell>
                      {format(new Date(invoice.createdAt), "dd/MM/yyyy", {
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
                                onClick={() => generateInvoicePdf(invoice)}
                              >
                                <FileText className="h-4 w-4" />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>
                              <p>Télécharger la facture PDF</p>
                            </TooltipContent>
                          </Tooltip>

                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleEmailInvoice(invoice)}
                                disabled={
                                  !invoice.client.email || invoice.emailSent
                                }
                              >
                                <Mail className="h-4 w-4" />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>
                              <p>
                                {invoice.emailSent
                                  ? "Facture déjà envoyée par email"
                                  : "Envoyer par email au client"}
                              </p>
                            </TooltipContent>
                          </Tooltip>

                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => openEditDialog(invoice)}
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>
                              <p>Modifier la facture</p>
                            </TooltipContent>
                          </Tooltip>

                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleDeleteInvoice(invoice)}
                                className="text-red-600 hover:text-red-700"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>
                              <p>Supprimer la facture</p>
                            </TooltipContent>
                          </Tooltip>
                        </div>
                      </TooltipProvider>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
          {filteredInvoices.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              Aucune facture trouvée
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
