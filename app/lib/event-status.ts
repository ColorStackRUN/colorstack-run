import type { EventItem } from "@/app/lib/content-types";

/** All event dates and times entered in the CMS are Eastern Time. */
export const EVENT_TIME_ZONE = "America/New_York";

type DateParts = { year: number; month: number; day: number };

const easternDateTimeFormatter = new Intl.DateTimeFormat("en-US", {
  timeZone: EVENT_TIME_ZONE,
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
  hour: "2-digit",
  minute: "2-digit",
  second: "2-digit",
  hourCycle: "h23",
});

/**
 * Returns the instant when an event ends. The date and time strings from the
 * CMS are wall-clock values in America/New_York, including daylight saving
 * time; they must not inherit the server or visitor's local time zone.
 */
export function getEventEndTime(event: EventItem): number | null {
  const date = parseDateInput(event.endDate ?? event.date);
  if (!date) return null;

  const time = parseTimeInput(event.endTime) ?? { hour: 23, minute: 59, second: 59, millisecond: 999 };
  return easternWallTimeToEpoch(date, time);
}

/** A past event always wins over an old "upcoming" override. */
export function resolveEventStatus(event: EventItem, now = Date.now()): "upcoming" | "past" {
  const eventEndTime = getEventEndTime(event);
  if (eventEndTime !== null && eventEndTime < now) return "past";
  return event.statusOverride ?? "upcoming";
}

export function splitEventsByStatus(events: EventItem[], now = Date.now()) {
  const upcomingEvents: EventItem[] = [];
  const pastEvents: EventItem[] = [];

  for (const event of events) {
    if (resolveEventStatus(event, now) === "past") pastEvents.push(event);
    else upcomingEvents.push(event);
  }

  return { upcomingEvents, pastEvents };
}

/** Finds the earliest automatic status change after `now`. */
export function getNextEventStatusChange(events: EventItem[], now = Date.now()): number | null {
  let nextChange: number | null = null;

  for (const event of events) {
    const eventEndTime = getEventEndTime(event);
    if (eventEndTime === null || eventEndTime < now) continue;
    // Status changes immediately after the stated end time.
    const changeTime = eventEndTime + 1;
    if (nextChange === null || changeTime < nextChange) nextChange = changeTime;
  }

  return nextChange;
}

function easternWallTimeToEpoch(date: DateParts, time: { hour: number; minute: number; second: number; millisecond: number }) {
  const utcGuess = Date.UTC(date.year, date.month - 1, date.day, time.hour, time.minute, time.second, time.millisecond);
  // Resolve twice: on daylight-saving transition days the first resolution can
  // land on the other side of the offset change.
  const firstPass = utcGuess - getEasternOffsetAt(utcGuess);
  return utcGuess - getEasternOffsetAt(firstPass);
}

function getEasternOffsetAt(timestamp: number) {
  const parts = easternDateTimeFormatter.formatToParts(timestamp);
  const values = Object.fromEntries(parts.filter(({ type }) => type !== "literal").map(({ type, value }) => [type, Number(value)]));
  const displayedAsUtc = Date.UTC(values.year, values.month - 1, values.day, values.hour, values.minute, values.second);
  // Intl emits whole seconds; preserve any millisecond component separately.
  const wholeSecondTimestamp = timestamp - ((timestamp % 1_000) + 1_000) % 1_000;
  return displayedAsUtc - wholeSecondTimestamp;
}

function parseDateInput(value: string): DateParts | null {
  const match = value.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!match) return null;
  const [, year, month, day] = match.map(Number);
  const candidate = new Date(Date.UTC(year, month - 1, day));
  if (candidate.getUTCFullYear() !== year || candidate.getUTCMonth() !== month - 1 || candidate.getUTCDate() !== day) return null;
  return { year, month, day };
}

function parseTimeInput(value: string) {
  const match = value.match(/^(\d{2}):(\d{2})$/);
  if (!match) return null;
  const [, hour, minute] = match.map(Number);
  if (hour > 23 || minute > 59) return null;
  return { hour, minute, second: 0, millisecond: 0 };
}
