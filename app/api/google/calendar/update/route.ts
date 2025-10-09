import { NextResponse } from "next/server";
import { createCalendar } from "../../createCalendar";

export async function POST(req: Request) {
  const {
    title,
    startISO,
    endISO,
    attendeesEmail,
    description,
    eventId,
    location,
  } = await req.json();

  if (!eventId)
    return NextResponse.json({ error: "Missing eventId" }, { status: 400 });

  const calendar = createCalendar();

  const res = await calendar.events.patch({
    calendarId: "primary",
    sendUpdates: "all",
    eventId,
    requestBody: {
      ...(description ? { description } : {}),
      ...(location ? { location } : {}),
      summary: title,
      start: { dateTime: startISO, timeZone: "Asia/Manila" },
      end: { dateTime: endISO, timeZone: "Asia/Manila" },
      attendees: attendeesEmail?.map((email: string) => ({ email })),
    },
  });

  return Response.json({ eventId: res.data.id, htmlLink: res.data.htmlLink });
}
