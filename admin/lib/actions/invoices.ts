"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

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
  emailSent: boolean;
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
}

export interface UpdateInvoiceData {
  amount?: number;
  status?: "UNPAID" | "PAID" | "OVERDUE";
  paymentMethod?: "CASH" | "CARD" | "BANK_TRANSFER" | "CHECK" | "OTHER";
  description?: string;
  dueDate?: Date;
  emailSent?: boolean;
}

export async function getInvoices(): Promise<Invoice[]> {
  try {
    const invoices = await (prisma as any).invoice.findMany({
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
    const invoice = await (prisma as any).invoice.findUnique({
      where: { id },
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
    const invoice = await (prisma as any).invoice.create({
      data: {
        clientId: data.clientId,
        appointmentId: data.appointmentId,
        amount: data.amount,
        description: data.description,
        dueDate: data.dueDate,
        status: "UNPAID",
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
    const updateData: any = { ...data };

    // Set paidAt when marking as paid
    if (data.status === "PAID" && !updateData.paidAt) {
      updateData.paidAt = new Date();
    }

    // Clear paidAt when marking as unpaid
    if (data.status === "UNPAID") {
      updateData.paidAt = null;
    }

    const invoice = await (prisma as any).invoice.update({
      where: { id },
      data: updateData,
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
    revalidatePath(`/invoices/${id}`);
    return {
      ...invoice,
      amount: parseFloat(invoice.amount),
    };
  } catch (error) {
    console.error("Failed to update invoice:", error);
    throw new Error("Failed to update invoice");
  }
}

export async function deleteInvoice(id: string): Promise<void> {
  try {
    await (prisma as any).invoice.delete({
      where: { id },
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
    const invoices = await (prisma as any).invoice.findMany({
      where: { clientId },
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
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    await (prisma as any).invoice.updateMany({
      where: {
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
    await (prisma as any).invoice.update({
      where: { id },
      data: {
        emailSent: true,
      },
    });

    revalidatePath("/invoices");
  } catch (error) {
    console.error("Failed to mark invoice as email sent:", error);
    throw new Error("Failed to mark invoice as email sent");
  }
}
