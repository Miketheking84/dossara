/**
 * MVS-1-local temporal primitives. These helpers were originally prototyped
 * in the historical MVS-0 spike and are internalized here to make the accepted
 * proof self-contained. They contain parsing and timezone normalization only;
 * MVS-0 lifecycle, currentness, due-selection and metric semantics are absent.
 */

const RFC3339_INSTANT = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2}):(\d{2})(?:\.(\d{1,3}))?(Z|[+-]\d{2}:\d{2})$/;
const DATE_ONLY = /^(\d{4})-(\d{2})-(\d{2})$/;
const FIXED_OFFSET = /^(Z|[+-])(\d{2})?:?(\d{2})?$/;

export function parseInstant(value: string): number | null {
  const match = RFC3339_INSTANT.exec(value);
  if (!match) return null;
  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  const hour = Number(match[4]);
  const minute = Number(match[5]);
  const second = Number(match[6]);
  const calendarCheck = new Date(Date.UTC(year, month - 1, day));
  if (
    calendarCheck.getUTCFullYear() !== year
    || calendarCheck.getUTCMonth() !== month - 1
    || calendarCheck.getUTCDate() !== day
    || hour > 23
    || minute > 59
    || second > 59
  ) {
    return null;
  }
  const parsed = Date.parse(value);
  return Number.isFinite(parsed) ? parsed : null;
}

export function canonicalInstant(value: string): string | null {
  const parsed = parseInstant(value);
  return parsed === null ? null : new Date(parsed).toISOString();
}

function parseDateOnly(value: string): { year: number; month: number; day: number } | null {
  const match = DATE_ONLY.exec(value);
  if (!match) return null;
  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  const test = new Date(Date.UTC(year, month - 1, day));
  if (
    test.getUTCFullYear() !== year
    || test.getUTCMonth() !== month - 1
    || test.getUTCDate() !== day
  ) {
    return null;
  }
  return { year, month, day };
}

function nextDate(value: string): { year: number; month: number; day: number } | null {
  const parsed = parseDateOnly(value);
  if (!parsed) return null;
  const next = new Date(Date.UTC(parsed.year, parsed.month - 1, parsed.day + 1));
  return {
    year: next.getUTCFullYear(),
    month: next.getUTCMonth() + 1,
    day: next.getUTCDate(),
  };
}

function fixedOffsetMinutes(timezone: string): number | null {
  if (timezone === "Z") return 0;
  const match = FIXED_OFFSET.exec(timezone);
  if (!match || match[1] === "Z" || match[2] === undefined || match[3] === undefined) {
    return null;
  }
  const hours = Number(match[2]);
  const minutes = Number(match[3]);
  if (hours > 23 || minutes > 59) return null;
  const total = hours * 60 + minutes;
  return match[1] === "-" ? -total : total;
}

function localDateKey(formatter: Intl.DateTimeFormat, epochMs: number): number | null {
  const parts = formatter.formatToParts(new Date(epochMs));
  const year = Number(parts.find((part) => part.type === "year")?.value);
  const month = Number(parts.find((part) => part.type === "month")?.value);
  const day = Number(parts.find((part) => part.type === "day")?.value);
  if (![year, month, day].every(Number.isFinite)) return null;
  return year * 10_000 + month * 100 + day;
}

function ianaStartOfLocalDate(
  year: number,
  month: number,
  day: number,
  timezone: string,
): number | null {
  let formatter: Intl.DateTimeFormat;
  try {
    formatter = new Intl.DateTimeFormat("en-CA", {
      timeZone: timezone,
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    });
  } catch {
    return null;
  }

  const targetKey = year * 10_000 + month * 100 + day;
  const guess = Date.UTC(year, month - 1, day);
  const step = 15 * 60 * 1000;
  let lower = guess - 48 * 60 * 60 * 1000;
  let lowerKey = localDateKey(formatter, lower);
  if (lowerKey === null) return null;

  for (
    let candidate = lower + step;
    candidate <= guess + 48 * 60 * 60 * 1000;
    candidate += step
  ) {
    const candidateKey = localDateKey(formatter, candidate);
    if (candidateKey === null) return null;
    if (candidateKey >= targetKey && lowerKey < targetKey) {
      let left = candidate - step;
      let right = candidate;
      while (left + 1 < right) {
        const middle = left + Math.floor((right - left) / 2);
        const middleKey = localDateKey(formatter, middle);
        if (middleKey === null) return null;
        if (middleKey >= targetKey) right = middle;
        else left = middle;
      }
      return localDateKey(formatter, right) === targetKey ? right : null;
    }
    lower = candidate;
    lowerKey = candidateKey;
  }
  return null;
}

export function resolveDateOnlyDueInstant(
  dateOnly: string,
  timezone: string,
): string | null {
  const target = nextDate(dateOnly);
  if (!target) return null;

  const offset = fixedOffsetMinutes(timezone);
  const epochMs = offset === null
    ? ianaStartOfLocalDate(target.year, target.month, target.day, timezone)
    : Date.UTC(target.year, target.month - 1, target.day) - offset * 60 * 1000;

  return epochMs === null ? null : new Date(epochMs).toISOString();
}
