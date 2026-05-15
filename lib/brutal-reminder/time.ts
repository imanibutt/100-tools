import type { ReminderCadence } from "./types";

function getTimezoneOffsetMs(date: Date, timezone: string) {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: timezone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  }).formatToParts(date);

  const values = Object.fromEntries(parts.map((part) => [part.type, part.value]));
  const asUtc = Date.UTC(
    Number(values.year),
    Number(values.month) - 1,
    Number(values.day),
    Number(values.hour) % 24,
    Number(values.minute),
    Number(values.second),
  );

  return asUtc - date.getTime();
}

function zonedTimeToUtc(
  year: number,
  month: number,
  day: number,
  hour: number,
  minute: number,
  timezone: string,
) {
  const utcGuess = new Date(Date.UTC(year, month - 1, day, hour, minute, 0));
  const offset = getTimezoneOffsetMs(utcGuess, timezone);
  const firstPass = new Date(utcGuess.getTime() - offset);
  const secondOffset = getTimezoneOffsetMs(firstPass, timezone);
  return new Date(utcGuess.getTime() - secondOffset);
}

function localParts(date: Date, timezone: string) {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: timezone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    weekday: "short",
  }).formatToParts(date);

  const values = Object.fromEntries(parts.map((part) => [part.type, part.value]));
  return {
    year: Number(values.year),
    month: Number(values.month),
    day: Number(values.day),
    weekday: values.weekday,
  };
}

function addLocalDays(parts: { year: number; month: number; day: number }, days: number) {
  const date = new Date(Date.UTC(parts.year, parts.month - 1, parts.day + days, 12, 0, 0));
  return {
    year: date.getUTCFullYear(),
    month: date.getUTCMonth() + 1,
    day: date.getUTCDate(),
  };
}

function isWeekday(date: Date, timezone: string) {
  const weekday = localParts(date, timezone).weekday;
  return weekday !== "Sat" && weekday !== "Sun";
}

export function calculateNextDueAt(
  cadence: ReminderCadence,
  timezone: string,
  localTime: string,
  fromDate = new Date(),
) {
  const [hour = 9, minute = 0] = localTime.split(":").map(Number);
  const currentLocal = localParts(fromDate, timezone);
  let candidateLocal: { year: number; month: number; day: number } = currentLocal;

  if (cadence === "weekly") {
    const todayAtTime = zonedTimeToUtc(
      candidateLocal.year,
      candidateLocal.month,
      candidateLocal.day,
      hour,
      minute,
      timezone,
    );
    if (todayAtTime <= fromDate) {
      candidateLocal = addLocalDays(candidateLocal, 7);
    }
    return zonedTimeToUtc(candidateLocal.year, candidateLocal.month, candidateLocal.day, hour, minute, timezone);
  }

  for (let i = 0; i < 10; i += 1) {
    const candidate = zonedTimeToUtc(
      candidateLocal.year,
      candidateLocal.month,
      candidateLocal.day,
      hour,
      minute,
      timezone,
    );
    const allowedDay = cadence === "daily" || isWeekday(candidate, timezone);

    if (allowedDay && candidate > fromDate) {
      return candidate;
    }

    candidateLocal = addLocalDays(candidateLocal, 1);
  }

  return new Date(fromDate.getTime() + 24 * 60 * 60 * 1000);
}

export function formatSchedule(cadence: ReminderCadence, localTime: string) {
  const label = cadence === "weekdays" ? "Weekdays only" : cadence[0].toUpperCase() + cadence.slice(1);
  return `${label} at ${localTime}`;
}
