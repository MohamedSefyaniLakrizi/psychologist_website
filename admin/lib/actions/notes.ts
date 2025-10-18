"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export interface Note {
  id: string;
  title: string;
  content: any; // JSON content from Lexical
  clientId?: string;
  appointmentId?: string;
  createdAt: Date;
  updatedAt: Date;
  client?: {
    id: string;
    firstName: string;
    lastName: string;
  };
  appointment?: {
    id: string;
    startTime: Date;
  };
}

export interface Client {
  id: string;
  firstName: string;
  lastName: string;
  email?: string;
}

export interface ClientWithNotes {
  id: string;
  firstName: string;
  lastName: string;
  email?: string;
  notesCount: number;
  lastNoteUpdated?: Date;
}

export async function getNotes(): Promise<Note[]> {
  try {
    const notes = await (prisma as any).note.findMany({
      include: {
        client: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
        appointment: {
          select: {
            id: true,
            startTime: true,
          },
        },
      },
      orderBy: {
        updatedAt: "desc",
      },
    });

    return notes;
  } catch (error) {
    console.error("Failed to fetch notes:", error);
    throw new Error("Failed to fetch notes");
  }
}

export async function getNote(id: string): Promise<Note | null> {
  try {
    const note = await (prisma as any).note.findUnique({
      where: { id },
      include: {
        client: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
        appointment: {
          select: {
            id: true,
            startTime: true,
          },
        },
      },
    });

    return note;
  } catch (error) {
    console.error("Failed to fetch note:", error);
    throw new Error("Failed to fetch note");
  }
}

export async function createNote(data: {
  title: string;
  content: any;
  clientId?: string;
  appointmentId?: string;
}): Promise<Note> {
  console.log("Creating note with data:", JSON.stringify(data, null, 2));

  try {
    // First try a simple create without includes to isolate the issue
    const createData: any = {
      title: data.title,
      content: data.content,
    };

    // Only add clientId if it's provided and not empty
    if (data.clientId && data.clientId.trim() !== "") {
      createData.clientId = data.clientId;
    }

    // Only add appointmentId if it's provided and not empty
    if (data.appointmentId && data.appointmentId.trim() !== "") {
      createData.appointmentId = data.appointmentId;
    }

    console.log("Final create data:", JSON.stringify(createData, null, 2));

    const note = await (prisma as any).note.create({
      data: createData,
      include: {
        client: true,
        appointment: true,
      },
    });

    console.log("Note created successfully:", JSON.stringify(note, null, 2));
    revalidatePath("/notes");
    return note;
  } catch (error) {
    console.error("Detailed error creating note:", error);
    console.error("Error message:", (error as any)?.message);
    console.error("Error code:", (error as any)?.code);
    console.error("Error meta:", (error as any)?.meta);
    console.error("Prisma error details:", JSON.stringify(error, null, 2));
    throw new Error(
      `Failed to create note: ${(error as any)?.message || "Unknown error"}`
    );
  }
}

export async function updateNote(
  id: string,
  data: {
    title?: string;
    content?: any;
    clientId?: string;
    appointmentId?: string;
  }
): Promise<Note> {
  try {
    const note = await (prisma as any).note.update({
      where: { id },
      data: {
        ...data,
        updatedAt: new Date(),
      },
      include: {
        client: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
        appointment: {
          select: {
            id: true,
            startTime: true,
          },
        },
      },
    });

    revalidatePath("/notes");
    revalidatePath(`/notes/${id}`);
    return note;
  } catch (error) {
    console.error("Failed to update note:", error);
    throw new Error("Failed to update note");
  }
}

export async function deleteNote(id: string): Promise<void> {
  try {
    await (prisma as any).note.delete({
      where: { id },
    });

    revalidatePath("/notes");
  } catch (error) {
    console.error("Failed to delete note:", error);
    throw new Error("Failed to delete note");
  }
}

export async function getClientsForNotes(): Promise<Client[]> {
  try {
    const clients = await (prisma as any).client.findMany({
      where: {
        confirmed: true,
      },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
      },
      orderBy: {
        firstName: "asc",
      },
    });

    return clients;
  } catch (error) {
    console.error("Failed to fetch clients for notes:", error);
    throw new Error("Failed to fetch clients");
  }
}

export async function updateNoteClient(
  id: string,
  clientId: string | null
): Promise<Note> {
  try {
    const updateData: any = {};

    if (clientId === null || clientId === "") {
      updateData.clientId = null;
    } else {
      updateData.clientId = clientId;
    }

    const note = await (prisma as any).note.update({
      where: { id },
      data: updateData,
      include: {
        client: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
        appointment: {
          select: {
            id: true,
            startTime: true,
          },
        },
      },
    });

    revalidatePath("/notes");
    revalidatePath(`/notes/${id}`);
    return note;
  } catch (error) {
    console.error("Failed to update note client:", error);
    throw new Error("Failed to update note client");
  }
}

export async function getClientsWithNotes(): Promise<ClientWithNotes[]> {
  try {
    const clients = await (prisma as any).client.findMany({
      where: {
        confirmed: true,
      },
      include: {
        notes: {
          select: {
            id: true,
            updatedAt: true,
          },
          orderBy: {
            updatedAt: "desc",
          },
        },
      },
      orderBy: {
        firstName: "asc",
      },
    });

    // Filter clients that have notes and transform the data
    const clientsWithNotes: ClientWithNotes[] = clients
      .filter((client: any) => client.notes.length > 0)
      .map((client: any) => ({
        id: client.id,
        firstName: client.firstName,
        lastName: client.lastName,
        email: client.email,
        notesCount: client.notes.length,
        lastNoteUpdated: client.notes[0]?.updatedAt,
      }))
      .sort((a: ClientWithNotes, b: ClientWithNotes) => {
        // Sort by most recent note update
        if (!a.lastNoteUpdated) return 1;
        if (!b.lastNoteUpdated) return -1;
        return (
          new Date(b.lastNoteUpdated).getTime() -
          new Date(a.lastNoteUpdated).getTime()
        );
      });

    return clientsWithNotes;
  } catch (error) {
    console.error("Failed to fetch clients with notes:", error);
    throw new Error("Failed to fetch clients with notes");
  }
}

export async function getNotesByAppointmentId(
  appointmentId: string
): Promise<Note[]> {
  try {
    const notes = await (prisma as any).note.findMany({
      where: {
        appointmentId: appointmentId,
      },
      include: {
        client: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
        appointment: {
          select: {
            id: true,
            startTime: true,
          },
        },
      },
      orderBy: {
        updatedAt: "desc",
      },
    });

    return notes;
  } catch (error) {
    console.error("Failed to fetch notes by appointment ID:", error);
    throw new Error("Failed to fetch notes by appointment ID");
  }
}
