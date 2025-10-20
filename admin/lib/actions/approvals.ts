"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

// Get pending clients (not confirmed, not deleted)
export async function getPendingClients() {
  try {
    const clients = await prisma.client.findMany({
      where: {
        confirmed: false,
        deleted: false, // Exclude soft-deleted clients
      },
      orderBy: {
        createdAt: "desc",
      },
    });
    return clients;
  } catch (error) {
    console.error("Error fetching pending clients:", error);
    throw new Error("Failed to fetch pending clients");
  }
}

// Get pending appointments (not confirmed, and clients not deleted)
export async function getPendingAppointments() {
  try {
    const appointments = await prisma.appointment.findMany({
      where: {
        confirmed: false,
        client: { deleted: false },
      },
      include: {
        client: true,
      },
      orderBy: {
        createdAt: "desc",
      },
    });
    return appointments;
  } catch (error) {
    console.error("Error fetching pending appointments:", error);
    throw new Error("Failed to fetch pending appointments");
  }
}

// Approve a client
export async function approveClient(clientId: string) {
  try {
    await prisma.client.update({
      where: { id: clientId },
      data: { confirmed: true },
    });
    revalidatePath("/approvals");
    return { success: true };
  } catch (error) {
    console.error("Error approving client:", error);
    throw new Error("Failed to approve client");
  }
}

// Reject (delete) a client
export async function rejectClient(clientId: string) {
  try {
    await prisma.client.delete({
      where: { id: clientId },
    });
    revalidatePath("/approvals");
    return { success: true };
  } catch (error) {
    console.error("Error rejecting client:", error);
    throw new Error("Failed to reject client");
  }
}

// Approve an appointment
export async function approveAppointment(appointmentId: string) {
  try {
    await prisma.appointment.update({
      where: { id: appointmentId },
      data: { confirmed: true },
    });
    revalidatePath("/approvals");
    return { success: true };
  } catch (error) {
    console.error("Error approving appointment:", error);
    throw new Error("Failed to approve appointment");
  }
}

// Reject (delete) an appointment
export async function rejectAppointment(appointmentId: string) {
  try {
    await prisma.appointment.delete({
      where: { id: appointmentId },
    });
    revalidatePath("/approvals");
    return { success: true };
  } catch (error) {
    console.error("Error rejecting appointment:", error);
    throw new Error("Failed to reject appointment");
  }
}
