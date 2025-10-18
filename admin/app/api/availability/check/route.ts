import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { checkAvailability } from "@/lib/actions/availability";

export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const searchParams = request.nextUrl.searchParams;
  const startTime = searchParams.get("startTime");
  const endTime = searchParams.get("endTime");
  const excludeAppointmentId = searchParams.get("excludeAppointmentId");

  if (!startTime || !endTime) {
    return NextResponse.json(
      { error: "startTime and endTime are required" },
      { status: 400 }
    );
  }

  const result = await checkAvailability(
    new Date(startTime),
    new Date(endTime),
    excludeAppointmentId || undefined
  );

  if (!result.success) {
    return NextResponse.json({ error: result.error }, { status: 500 });
  }

  return NextResponse.json(result);
}
