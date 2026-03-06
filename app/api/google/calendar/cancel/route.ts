import { NextResponse } from "next/server";
import { createCalendar } from "../createCalendar";

export async function POST(req: Request) {
  const { eventId } = await req.json();

  if (!eventId) {
    return NextResponse.json({ error: "Missing eventId" }, { status: 400 });
  }

  try {
    const calendar = createCalendar();

    await calendar.events.delete({
      calendarId: "primary",
      eventId,
      sendUpdates: "all",
    });

    return NextResponse.json({
      success: true,
      message: "Event cancelled successfully",
    });
  } catch (error) {
    console.error("Error cancelling calendar event:", error);
    return NextResponse.json(
      { error: "Failed to cancel calendar event" },
      { status: 500 },
    );
  }
}
