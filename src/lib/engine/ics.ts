export interface CalendarEventExport {
  id: string;
  title: string;
  description?: string;
  startAt: Date;
  endAt: Date;
  location?: string;
}

export function generateICS(events: CalendarEventExport[]): string {
  const formatICSDate = (d: Date) => {
    return d.toISOString().replace(/[-:]/g, "").split(".")[0] + "Z";
  };

  let ics = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Orbit Life-OS//Student Desk//EN",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    "X-WR-CALNAME:Orbit Student Life-OS",
    "X-WR-TIMEZONE:Asia/Kolkata",
  ];

  for (const ev of events) {
    ics.push(
      "BEGIN:VEVENT",
      `UID:${ev.id}@orbit.lifeos`,
      `DTSTAMP:${formatICSDate(new Date())}`,
      `DTSTART:${formatICSDate(ev.startAt)}`,
      `DTEND:${formatICSDate(ev.endAt)}`,
      `SUMMARY:${ev.title}`,
      `DESCRIPTION:${ev.description || "Scheduled via Orbit Life-OS"}`,
      "STATUS:CONFIRMED",
      "END:VEVENT"
    );
  }

  ics.push("END:VCALENDAR");
  return ics.join("\r\n");
}
