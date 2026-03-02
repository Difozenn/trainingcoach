/**
 * ICS Generator — iCalendar Workout Events
 *
 * RFC 5545 compliant .ics files for subscribing to training calendar
 * from any calendar app (Google Calendar, Apple Calendar, Outlook).
 */

export type CalendarEvent = {
  uid: string;
  title: string;
  description: string;
  startDate: Date;
  durationMinutes: number;
  sport: string;
};

/**
 * Generate an ICS file for a single workout event.
 */
export function generateICSEvent(event: CalendarEvent): string {
  const start = formatICSDate(event.startDate);
  const end = formatICSDate(
    new Date(event.startDate.getTime() + event.durationMinutes * 60 * 1000)
  );

  return `BEGIN:VCALENDAR
VERSION:2.0
PRODID:-//PainCave//Workout//EN
CALSCALE:GREGORIAN
METHOD:PUBLISH
BEGIN:VEVENT
UID:${event.uid}
DTSTART:${start}
DTEND:${end}
SUMMARY:${escapeICS(event.title)}
DESCRIPTION:${escapeICS(event.description)}
CATEGORIES:${event.sport.toUpperCase()},TRAINING
STATUS:CONFIRMED
END:VEVENT
END:VCALENDAR`;
}

/**
 * Generate an ICS file for multiple workout events (weekly plan).
 */
export function generateICSCalendar(
  events: CalendarEvent[],
  calendarName = "PainCave"
): string {
  const eventBlocks = events
    .map(
      (event) => {
        const start = formatICSDate(event.startDate);
        const end = formatICSDate(
          new Date(event.startDate.getTime() + event.durationMinutes * 60 * 1000)
        );
        return `BEGIN:VEVENT
UID:${event.uid}
DTSTART:${start}
DTEND:${end}
SUMMARY:${escapeICS(event.title)}
DESCRIPTION:${escapeICS(event.description)}
CATEGORIES:${event.sport.toUpperCase()},TRAINING
STATUS:CONFIRMED
END:VEVENT`;
      }
    )
    .join("\n");

  return `BEGIN:VCALENDAR
VERSION:2.0
PRODID:-//PainCave//Workout//EN
CALSCALE:GREGORIAN
METHOD:PUBLISH
X-WR-CALNAME:${calendarName}
${eventBlocks}
END:VCALENDAR`;
}

function formatICSDate(date: Date): string {
  return date
    .toISOString()
    .replace(/[-:]/g, "")
    .replace(/\.\d{3}/, "");
}

function escapeICS(str: string): string {
  return str
    .replace(/\\/g, "\\\\")
    .replace(/;/g, "\\;")
    .replace(/,/g, "\\,")
    .replace(/\n/g, "\\n");
}
