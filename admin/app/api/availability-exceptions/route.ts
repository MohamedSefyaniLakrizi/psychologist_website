import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import {
  getDateAvailability,
  setDateAvailability,
  bulkSetDateAvailability,
} from "@/lib/actions/availability";

export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const searchParams = request.nextUrl.searchParams;
  const startDate = searchParams.get("startDate");
  const endDate = searchParams.get("endDate");

  if (!startDate || !endDate) {
    return NextResponse.json(
      { error: "startDate and endDate are required" },
      { status: 400 }
    );
  }

  const result = await getDateAvailability(
    new Date(startDate),
    new Date(endDate)
  );
  if (!result.success) {
    return NextResponse.json({ error: result.error }, { status: 500 });
  }

  return NextResponse.json(result.data);
}

export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();

  // Check if it's a bulk operation
  if (body.dates && Array.isArray(body.dates)) {
    // If slots are provided, apply them to each date
    if (body.slots && Array.isArray(body.slots) && body.slots.length > 0) {
      for (const dateStr of body.dates) {
        const result = await setDateAvailability({
          date: new Date(dateStr),
          slots: body.slots,
        });
        if (!result.success) {
          return NextResponse.json({ error: result.error }, { status: 500 });
        }
      }
      return NextResponse.json({ success: true });
    }

    // If no slots, it's a vacation/closed dates operation
    const dates = body.dates.map((d: string) => new Date(d));
    const result = await bulkSetDateAvailability(dates, body.closed || false);
    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 500 });
    }
    return NextResponse.json({ success: true });
  }

  // Single date update
  const data = {
    date: new Date(body.date),
    slots: body.slots || [],
  };

  const result = await setDateAvailability(data);
  if (!result.success) {
    return NextResponse.json({ error: result.error }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
