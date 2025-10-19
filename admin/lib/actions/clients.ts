"use server";

import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

export async function getClients() {
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect("/login");
  }

  try {
    // Single-user app: get all confirmed clients that are not deleted
    const clients = await prisma.client.findMany({
      where: {
        confirmed: true,
        deleted: false, // Exclude soft-deleted clients
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return { success: true, data: clients };
  } catch (error) {
    console.error("Error fetching clients:", error);
    return { success: false, error: "Failed to fetch clients" };
  }
}
export async function createClient(formData: FormData) {
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect("/login");
  }

  const firstName = formData.get("firstName") as string;
  const lastName = formData.get("lastName") as string;
  const email = formData.get("email") as string;
  const phoneNumber = formData.get("phoneNumber") as string;
  const preferredContact = formData.get("preferredContact") as string;
  const sendInvoiceAutomatically =
    formData.get("sendInvoiceAutomatically") === "on";
  const defaultRateValue = formData.get("defaultRate") as string | null;
  const defaultRate = defaultRateValue ? parseInt(defaultRateValue, 10) : 300;

  if (!firstName || !lastName || !email) {
    return {
      success: false,
      error: "First name, last name and email are required",
    };
  }

  try {
    // Check if client exists (including deleted ones)
    const existingClient = await prisma.client.findUnique({
      where: { email },
    });

    let client;

    if (existingClient) {
      // Client exists - restore if deleted, otherwise update
      client = await prisma.client.update({
        where: { id: existingClient.id },
        data: {
          firstName,
          lastName,
          phoneNumber: phoneNumber || "",
          preferredContact: (preferredContact as any) || "EMAIL",
          sendInvoiceAutomatically,
          defaultRate,
          confirmed: true,
          deleted: false, // Restore if it was deleted
        },
      });
    } else {
      // Client doesn't exist - create new one
      client = await prisma.client.create({
        data: {
          firstName,
          lastName,
          email,
          phoneNumber: phoneNumber || "",
          preferredContact: (preferredContact as any) || "EMAIL",
          sendInvoiceAutomatically,
          defaultRate,
          confirmed: true,
        },
      });
    }

    revalidatePath("/clients");
    return {
      success: true,
      message: existingClient
        ? `Client ${existingClient.deleted ? "restored and" : ""} updated successfully`
        : "Client created successfully",
      client: {
        id: client.id,
        name: `${client.firstName} ${client.lastName}`,
        firstName: client.firstName,
        lastName: client.lastName,
        email: client.email,
        phoneNumber: client.phoneNumber,
        preferredContact: client.preferredContact,
        defaultRate: defaultRate,
      },
    };
  } catch (error) {
    console.error("Error creating/updating client:", error);
    return { success: false, error: "Failed to create/update client" };
  }
}

export async function updateClient(clientId: string, formData: FormData) {
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect("/login");
  }

  const firstName = formData.get("firstName") as string;
  const lastName = formData.get("lastName") as string;
  const email = formData.get("email") as string;
  const phoneNumber = formData.get("phoneNumber") as string;
  const preferredContact = formData.get("preferredContact") as string;
  const sendInvoiceAutomatically =
    formData.get("sendInvoiceAutomatically") === "on";
  const defaultRateValue = formData.get("defaultRate") as string | null;
  const defaultRate = defaultRateValue ? parseInt(defaultRateValue, 10) : 300;

  if (!firstName || !lastName || !email) {
    return {
      success: false,
      error: "First name, last name and email are required",
    };
  }

  try {
    const client = await prisma.client.update({
      where: {
        id: clientId,
      },
      data: {
        firstName,
        lastName,
        email,
        phoneNumber: phoneNumber || "",
        preferredContact: (preferredContact as any) || "EMAIL",
        sendInvoiceAutomatically,
        defaultRate,
      },
    });

    revalidatePath("/clients");
    return {
      success: true,
      message: "Client updated successfully",
      client: {
        id: client.id,
        name: `${client.firstName} ${client.lastName}`,
        firstName: client.firstName,
        lastName: client.lastName,
        email: client.email,
        phoneNumber: client.phoneNumber,
        preferredContact: client.preferredContact,
        defaultRate: client.defaultRate,
        sendInvoiceAutomatically: client.sendInvoiceAutomatically,
      },
    };
  } catch (error) {
    console.error("Error updating client:", error);
    return { success: false, error: "Failed to update client" };
  }
}

export async function deleteClient(clientId: string) {
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect("/login");
  }

  try {
    // Check if client has any appointments or invoices
    const appointmentCount = await prisma.appointment.count({
      where: {
        clientId,
      },
    });

    const invoiceCount = await prisma.invoice.count({
      where: {
        clientId,
      },
    });

    // If no appointments or invoices, hard delete
    if (appointmentCount === 0 && invoiceCount === 0) {
      await prisma.client.delete({
        where: {
          id: clientId,
        },
      });
      revalidatePath("/clients");
      return { success: true, message: "Client deleted successfully" };
    }

    // Otherwise, soft delete (mark as deleted)
    await prisma.client.update({
      where: {
        id: clientId,
      },
      data: {
        deleted: true,
      },
    });

    revalidatePath("/clients");
    return {
      success: true,
      message: "Client archived successfully (has appointments or invoices)",
    };
  } catch (error) {
    console.error("Error deleting client:", error);
    return { success: false, error: "Failed to delete client" };
  }
}
