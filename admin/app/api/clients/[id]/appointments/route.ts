import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: clientId } = await params;

    const appointments = await prisma.appointment.findMany({
      where: {
        clientId,
        confirmed: true,
        client: {
          deleted: false,
        },
      },
      orderBy: { startTime: "desc" },
    });

    return NextResponse.json(appointments);
  } catch (error) {
    console.error("Error fetching client appointments:", error);
    return NextResponse.json(
      { error: "Erreur interne du serveur" },
      { status: 500 }
    );
  }
}
