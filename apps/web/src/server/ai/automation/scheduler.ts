/**
 * Business-Timezone Schedule Calculator & Period Resolver
 * Accurately resolves local schedule times across IANA timezones (e.g. Africa/Lagos)
 * without machine clock drift or browser dependencies.
 */

import type { AutomationFrequency } from '@nnoo/contracts';

export interface ScheduleConfig {
  frequency: AutomationFrequency;
  scheduleLocalTime: string; // 'HH:MM'
  scheduleWeekday?: number | null; // 1 = Monday, 7 = Sunday
  scheduleMonthday?: number | null; // 1 - 31
  timezone?: string; // e.g. 'Africa/Lagos'
}

/**
 * Returns the current date parts in the given IANA timezone.
 */
export function getLocalTimeParts(date: Date = new Date(), timezone = 'Africa/Lagos') {
  const formatter = new Intl.DateTimeFormat('en-US', {
    timeZone: timezone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
    weekday: 'short',
  });

  const parts = formatter.formatToParts(date);
  const partMap: Record<string, string> = {};
  for (const part of parts) {
    partMap[part.type] = part.value;
  }

  const weekdayMap: Record<string, number> = {
    Mon: 1,
    Tue: 2,
    Wed: 3,
    Thu: 4,
    Fri: 5,
    Sat: 6,
    Sun: 7,
  };

  return {
    year: parseInt(partMap.year ?? '2026', 10),
    month: parseInt(partMap.month ?? '01', 10),
    day: parseInt(partMap.day ?? '01', 10),
    hour: parseInt(partMap.hour === '24' ? '00' : partMap.hour ?? '00', 10),
    minute: parseInt(partMap.minute ?? '00', 10),
    second: parseInt(partMap.second ?? '00', 10),
    weekday: weekdayMap[partMap.weekday ?? 'Mon'] ?? 1,
  };
}

/**
 * Resolves the scheduled period identifier string for a given run date and frequency.
 * Examples:
 * - daily: '2026-08-18'
 * - weekly: '2026-W34'
 * - monthly: '2026-08'
 */
export function resolveScheduledPeriod(
  date: Date = new Date(),
  frequency: AutomationFrequency,
  timezone = 'Africa/Lagos'
): string {
  const parts = getLocalTimeParts(date, timezone);
  const year = parts.year;
  const month = String(parts.month).padStart(2, '0');
  const day = String(parts.day).padStart(2, '0');

  switch (frequency) {
    case 'daily':
      return `${year}-${month}-${day}`;
    case 'weekly': {
      // Calculate ISO week number
      const localDate = new Date(Date.UTC(parts.year, parts.month - 1, parts.day));
      const dayNum = localDate.getUTCDay() || 7;
      localDate.setUTCDate(localDate.getUTCDate() + 4 - dayNum);
      const yearStart = new Date(Date.UTC(localDate.getUTCFullYear(), 0, 1));
      const weekNo = Math.ceil(((localDate.getTime() - yearStart.getTime()) / 86400000 + 1) / 7);
      return `${localDate.getUTCFullYear()}-W${String(weekNo).padStart(2, '0')}`;
    }
    case 'monthly':
      return `${year}-${month}`;
    case 'off':
    default:
      return `${year}-${month}-${day}-manual`;
  }
}

/**
 * Computes the next scheduled execution date (in UTC) for an automation.
 */
export function computeNextRunAt(config: ScheduleConfig, fromDate: Date = new Date()): Date | null {
  if (config.frequency === 'off') {
    return null;
  }

  const timezone = config.timezone || 'Africa/Lagos';
  const [hourStr, minStr] = (config.scheduleLocalTime || '08:00').split(':');
  const targetHour = parseInt(hourStr || '8', 10);
  const targetMin = parseInt(minStr || '0', 10);

  const local = getLocalTimeParts(fromDate, timezone);

  // Start with current local date
  let candidateYear = local.year;
  let candidateMonth = local.month;
  let candidateDay = local.day;

  // Has target time already passed today?
  const isTodayPassed =
    local.hour > targetHour || (local.hour === targetHour && local.minute >= targetMin);

  switch (config.frequency) {
    case 'daily': {
      if (isTodayPassed) {
        candidateDay += 1;
      }
      break;
    }
    case 'weekly': {
      const targetWeekday = config.scheduleWeekday ?? 1; // Default Monday
      let daysUntil = (targetWeekday - local.weekday + 7) % 7;
      if (daysUntil === 0 && isTodayPassed) {
        daysUntil = 7;
      }
      candidateDay += daysUntil;
      break;
    }
    case 'monthly': {
      const targetMonthday = Math.min(config.scheduleMonthday ?? 1, 28); // Cap at 28 for safe month wrapping
      if (local.day > targetMonthday || (local.day === targetMonthday && isTodayPassed)) {
        candidateMonth += 1;
        if (candidateMonth > 12) {
          candidateMonth = 1;
          candidateYear += 1;
        }
      }
      candidateDay = targetMonthday;
      break;
    }
    default:
      return null;
  }

  // Construct ISO string for the candidate in local time
  const pad = (n: number) => String(n).padStart(2, '0');
  const isoLocal = `${candidateYear}-${pad(candidateMonth)}-${pad(candidateDay)}T${pad(targetHour)}:${pad(targetMin)}:00`;

  // Determine timezone offset
  return parseLocalIsoInTimezone(isoLocal, timezone);
}

/**
 * Parses a local ISO timestamp string (YYYY-MM-DDTHH:MM:SS) in an IANA timezone into a UTC Date.
 */
export function parseLocalIsoInTimezone(isoString: string, timezone: string): Date {
  const [datePart, timePart] = isoString.split('T');
  if (!datePart || !timePart) return new Date();

  const [yStr, mStr, dStr] = datePart.split('-');
  const [hStr, minStr, sStr] = timePart.split(':');

  const year = parseInt(yStr || '2026', 10);
  const month = parseInt(mStr || '1', 10);
  const day = parseInt(dStr || '1', 10);
  const hour = parseInt(hStr || '0', 10);
  const minute = parseInt(minStr || '0', 10);
  const second = parseInt(sStr || '0', 10);

  // Form UTC date as initial guess
  const guessUtc = new Date(Date.UTC(year, month - 1, day, hour, minute, second));

  // Determine offset between guessUtc formatted in target timezone vs guessUtc in UTC
  const localParts = getLocalTimeParts(guessUtc, timezone);
  const localAsUtc = new Date(
    Date.UTC(localParts.year, localParts.month - 1, localParts.day, localParts.hour, localParts.minute, localParts.second)
  );

  const offsetMs = localAsUtc.getTime() - guessUtc.getTime();
  return new Date(guessUtc.getTime() - offsetMs);
}
