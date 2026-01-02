"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { getTenantId } from "./tenant";

export interface Invoice {
  id: string;
  clientId: string;
  appointmentId?: string;
  amount: number;
  status: "UNPAID" | "PAID" | "OVERDUE";
  paymentMethod?: "CASH" | "CARD" | "BANK_TRANSFER" | "CHECK" | "OTHER";
  description?: string;
  dueDate?: Date;
  paidAt?: Date;
  emailStatus: "NOT_SENT" | "SCHEDULED" | "SENT";
  createdAt: Date;
  updatedAt: Date;
  client: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
  };
  appointment?: {
    id: string;
    startTime: Date;
    endTime: Date;
  };
}

export interface CreateInvoiceData {
  clientId: string;
  appointmentId?: string;
  amount: number;
  description?: string;
  dueDate?: Date;
  emailStatus?: "NOT_SENT" | "SCHEDULED" | "SENT";
}

export interface UpdateInvoiceData {
  amount?: number;
  status?: "UNPAID" | "PAID" | "OVERDUE";
  paymentMethod?: "CASH" | "CARD" | "BANK_TRANSFER" | "CHECK" | "OTHER";
  description?: string;
  dueDate?: Date;
  emailStatus?: "NOT_SENT" | "SCHEDULED" | "SENT";
}

export async function getInvoices(): Promise<Invoice[]> {
  try {
    const tenantId = await getTenantId();
    const invoices = await (prisma as any).invoice.findMany({
      where: {
        tenantId,
      },
      include: {
        client: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
        appointment: {
          select: {
            id: true,
            startTime: true,
            endTime: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return invoices.map((invoice: any) => ({
      ...invoice,
      amount: parseFloat(invoice.amount),
    }));
  } catch (error) {
    console.error("Failed to fetch invoices:", error);
    throw new Error("Failed to fetch invoices");
  }
}

export async function getInvoice(id: string): Promise<Invoice | null> {
  try {
    const tenantId = await getTenantId();
    const invoice = await prisma.invoice.findFirst({
      where: {
        id,
        tenantId,
      },
      include: {
        client: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
        appointment: {
          select: {
            id: true,
            startTime: true,
            endTime: true,
          },
        },
      },
    });

    if (!invoice) return null;

    return {
      ...invoice,
      amount: parseFloat(invoice.amount),
    };
  } catch (error) {
    console.error("Failed to fetch invoice:", error);
    throw new Error("Failed to fetch invoice");
  }
}

export async function createInvoice(data: CreateInvoiceData): Promise<Invoice> {
  try {
    const tenantId = await getTenantId();
    const invoice = await prisma.invoice.create({
      data: {
        clientId: data.clientId,
        appointmentId: data.appointmentId,
        amount: data.amount,
        description: data.description,
        dueDate: data.dueDate,
        status: "UNPAID",
        emailStatus: data.emailStatus || "NOT_SENT",
        tenantId,
      },
      include: {
        client: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
        appointment: {
          select: {
            id: true,
            startTime: true,
            endTime: true,
          },
        },
      },
    });

    revalidatePath("/invoices");
    return {
      ...invoice,
      amount: parseFloat(invoice.amount),
    };
  } catch (error) {
    console.error("Failed to create invoice:", error);
    throw new Error("Failed to create invoice");
  }
}

export async function updateInvoice(
  id: string,
  data: UpdateInvoiceData
): Promise<Invoice> {
  try {
    const tenantId = await getTenantId();
    const updateData: any = { ...data };

    // Set paidAt when marking as paid
    if (data.status === "PAID" && !updateData.paidAt) {
      updateData.paidAt = new Date();
    }

    // Clear paidAt when marking as unpaid
    if (data.status === "UNPAID") {
      updateData.paidAt = null;
    }

    const invoice = await prisma.invoice.updateMany({
      where: {
        id,
        tenantId,
      },
      data: updateData,
    });

    // Fetch the updated invoice to return
    const updatedInvoice = await prisma.invoice.findFirst({
      where: {
        id,
        tenantId,
      },
      include: {
        client: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
        appointment: {
          select: {
            id: true,
            startTime: true,
            endTime: true,
          },
        },
      },
    });

    if (!updatedInvoice) {
      throw new Error("Invoice not found after update");
    }

    revalidatePath("/invoices");
    revalidatePath(`/invoices/${id}`);
    return {
      ...updatedInvoice,
      amount: parseFloat(updatedInvoice.amount),
    };
  } catch (error) {
    console.error("Failed to update invoice:", error);
    throw new Error("Failed to update invoice");
  }
}

export async function deleteInvoice(id: string): Promise<void> {
  try {
    const tenantId = await getTenantId();
    await (prisma as any).invoice.deleteMany({
      where: {
        id,
        tenantId,
      },
    });

    revalidatePath("/invoices");
  } catch (error) {
    console.error("Failed to delete invoice:", error);
    throw new Error("Failed to delete invoice");
  }
}

export async function getInvoicesByClient(
  clientId: string
): Promise<Invoice[]> {
  try {
    const tenantId = await getTenantId();
    const invoices = await prisma.invoice.findMany({
      where: {
        clientId,
        tenantId,
      },
      include: {
        client: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
        appointment: {
          select: {
            id: true,
            startTime: true,
            endTime: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return invoices.map((invoice: any) => ({
      ...invoice,
      amount: parseFloat(invoice.amount),
    }));
  } catch (error) {
    console.error("Failed to fetch client invoices:", error);
    throw new Error("Failed to fetch client invoices");
  }
}

export async function markInvoiceOverdue(): Promise<void> {
  try {
    const tenantId = await getTenantId();
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    await (prisma as any).invoice.updateMany({
      where: {
        tenantId,
        status: "UNPAID",
        dueDate: {
          lt: today,
        },
      },
      data: {
        status: "OVERDUE",
      },
    });

    revalidatePath("/invoices");
  } catch (error) {
    console.error("Failed to mark overdue invoices:", error);
    throw new Error("Failed to mark overdue invoices");
  }
}

export async function markInvoiceEmailSent(id: string): Promise<void> {
  try {
    const tenantId = await getTenantId();
    await (prisma as any).invoice.updateMany({
      where: {
        id,
        tenantId,
      },
      data: {
        emailStatus: "SENT",
      },
    });

    revalidatePath("/invoices");
  } catch (error) {
    console.error("Failed to mark invoice as email sent:", error);
    throw new Error("Failed to mark invoice as email sent");
  }
}

export async function sendInvoiceEmailNow(invoiceId: string): Promise<void> {
  try {
    console.log("📧 Sending invoice email immediately:", invoiceId);
    const tenantId = await getTenantId();

    // Fetch the invoice with all necessary details
    const invoice = await (prisma as any).invoice.findFirst({
      where: {
        id: invoiceId,
        tenantId,
      },
      include: {
        client: {
          select: {
            firstName: true,
            lastName: true,
            email: true,
          },
        },
        appointment: {
          select: {
            id: true,
            startTime: true,
            endTime: true,
            format: true,
          },
        },
      },
    });

    if (!invoice) {
      throw new Error("Invoice not found");
    }

    if (!invoice.client.email) {
      throw new Error("Client email not found");
    }

    // Send the invoice email using EmailService
    const { EmailService } = await import("@/lib/services/email-service");
    await EmailService.sendInvoiceEmail(invoice, invoice.client.email);

    // Mark invoice as sent
    await (prisma as any).invoice.updateMany({
      where: {
        id: invoiceId,
        tenantId,
      },
      data: { emailStatus: "SENT" },
    });

    // Cancel any scheduled invoice delivery emails for this appointment
    if (invoice.appointmentId) {
      await (prisma as any).emailSchedule.updateMany({
        where: {
          tenantId,
          appointmentId: invoice.appointmentId,
          emailType: "INVOICE_DELIVERY",
          status: "PENDING",
        },
        data: {
          status: "CANCELLED",
        },
      });

      console.log(
        "✅ Cancelled scheduled invoice emails for appointment:",
        invoice.appointmentId
      );
    }

    console.log(
      "✅ Invoice email sent successfully and scheduled emails cancelled"
    );
    revalidatePath("/invoices");
  } catch (error) {
    console.error("Failed to send invoice email:", error);
    throw new Error(
      `Failed to send invoice email: ${
        (error as any)?.message || "Unknown error"
      }`
    );
  }
}

export async function cancelInvoiceEmail(invoiceId: string): Promise<void> {
  try {
    console.log("🚫 Cancelling scheduled invoice email:", invoiceId);
    const tenantId = await getTenantId();

    // Fetch the invoice to get the appointment ID
    const invoice = await prisma.invoice.findFirst({
      where: {
        id: invoiceId,
        tenantId,
      },
      select: {
        id: true,
        appointmentId: true,
      },
    });

    if (!invoice) {
      throw new Error("Invoice not found");
    }

    if (!invoice.appointmentId) {
      throw new Error("Invoice is not linked to an appointment");
    }

    // Cancel all pending invoice delivery emails for this appointment
    const result = await prisma.emailSchedule.updateMany({
      where: {
        tenantId,
        appointmentId: invoice.appointmentId,
        emailType: "INVOICE_DELIVERY",
        status: "PENDING",
      },
      data: {
        status: "CANCELLED",
      },
    });

    console.log(
      `✅ Cancelled ${result.count} scheduled invoice email(s) for appointment:`,
      invoice.appointmentId
    );

    // Update invoice email status to NOT_SENT
    await prisma.invoice.updateMany({
      where: {
        id: invoiceId,
        tenantId,
      },
      data: { emailStatus: "NOT_SENT" },
    });

    revalidatePath("/invoices");
  } catch (error) {
    console.error("Failed to cancel scheduled invoice email:", error);
    throw new Error(
      `Failed to cancel scheduled invoice email: ${
        (error as any)?.message || "Unknown error"
      }`
    );
  }
}
