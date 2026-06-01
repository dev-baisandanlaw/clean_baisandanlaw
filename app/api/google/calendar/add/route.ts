import { createCalendar } from "../createCalendar";

export async function POST(req: Request) {
  const { title, startISO, endISO, attendeesEmail, description, location } =
    await req.json();
  const calendar = createCalendar();

  const res = await calendar.events.insert({
    calendarId: "primary",
    sendUpdates: "all",
    requestBody: {
      description: description
        ? description
        : "This invitation was generated automatically by the system. Please do not reply to this calendar invite.",
      ...(location ? { location } : {}),
      summary: title,
      start: { dateTime: startISO, timeZone: "Asia/Manila" },
      end: { dateTime: endISO, timeZone: "Asia/Manila" },
      attendees: attendeesEmail?.map((email: string) => ({ email })),
    },
  });

  return Response.json({ eventId: res.data.id, htmlLink: res.data.htmlLink });
}
