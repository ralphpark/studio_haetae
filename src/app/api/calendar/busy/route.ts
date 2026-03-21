import { NextResponse } from "next/server";
import { getBusySlots } from "@/utils/google-calendar";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const date = searchParams.get("date");

  if (!date) {
    return NextResponse.json({ error: "date required" }, { status: 400 });
  }

  try {
    const busySlots = await getBusySlots(date);
    return NextResponse.json({ busySlots });
  } catch (error) {
    console.error("Calendar busy check failed:", error);
    return NextResponse.json({ busySlots: [] });
  }
}
