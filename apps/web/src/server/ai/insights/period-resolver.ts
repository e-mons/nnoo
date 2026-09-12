import 'server-only';
import type {
  BusinessSummaryType,
  BusinessSummaryPeriod,
  BusinessSummaryPeriodComparison,
} from '@nnoo/contracts';

/**
 * Resolves calendar dates deterministically in business-local timezone.
 * Handles:
 * - 'today': Current business calendar date, compared with yesterday.
 * - 'this_week': Current business week (Monday to today), compared with prior full week.
 * - 'this_month': Current business month (1st of month to today), compared with prior calendar month.
 * - 'custom': User-specified date range, compared with an equal duration preceding period.
 */
export class BusinessPeriodResolver {
  /**
   * Returns current formatted date string (YYYY-MM-DD) in the specified timezone.
   */
  public static getLocalDate(timezone: string = 'Africa/Lagos', date: Date = new Date()): string {
    const formatter = new Intl.DateTimeFormat('en-CA', {
      timeZone: timezone,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    });
    return formatter.format(date);
  }

  /**
   * Resolves the primary period and the deterministic comparison period.
   */
  public static resolvePeriod(
    summaryType: BusinessSummaryType,
    timezone: string = 'Africa/Lagos',
    customStart?: string,
    customEnd?: string,
    now: Date = new Date()
  ): BusinessSummaryPeriodComparison {
    const todayStr = this.getLocalDate(timezone, now);
    const [yearStr, monthStr, dayStr] = todayStr.split('-');
    const currentYear = parseInt(yearStr, 10);
    const currentMonth = parseInt(monthStr, 10); // 1-12
    const currentDay = parseInt(dayStr, 10);

    if (summaryType === 'today') {
      const currentPeriod: BusinessSummaryPeriod = {
        start: todayStr,
        end: todayStr,
        timezone,
        label: `Today (${todayStr})`,
      };

      // Previous comparison day
      const yesterday = new Date(Date.UTC(currentYear, currentMonth - 1, currentDay - 1));
      const prevDateStr = this.getLocalDate(timezone, yesterday);
      const previousPeriod: BusinessSummaryPeriod = {
        start: prevDateStr,
        end: prevDateStr,
        timezone,
        label: `Yesterday (${prevDateStr})`,
      };

      return {
        current: currentPeriod,
        previous: previousPeriod,
        isComparable: true,
      };
    }

    if (summaryType === 'this_week') {
      // Find Monday of the current week in business timezone
      const localDate = new Date(Date.UTC(currentYear, currentMonth - 1, currentDay));
      const dayOfWeek = localDate.getUTCDay(); // 0 = Sunday, 1 = Monday, ..., 6 = Saturday
      const diffToMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1;

      const monday = new Date(Date.UTC(currentYear, currentMonth - 1, currentDay - diffToMonday));
      const mondayStr = this.getLocalDate(timezone, monday);

      const currentPeriod: BusinessSummaryPeriod = {
        start: mondayStr,
        end: todayStr,
        timezone,
        label: `This Week (${mondayStr} to ${todayStr})`,
      };

      // Previous full week (Monday - Sunday)
      const prevMonday = new Date(Date.UTC(currentYear, currentMonth - 1, currentDay - diffToMonday - 7));
      const prevSunday = new Date(Date.UTC(currentYear, currentMonth - 1, currentDay - diffToMonday - 1));
      const prevMondayStr = this.getLocalDate(timezone, prevMonday);
      const prevSundayStr = this.getLocalDate(timezone, prevSunday);

      const previousPeriod: BusinessSummaryPeriod = {
        start: prevMondayStr,
        end: prevSundayStr,
        timezone,
        label: `Previous Week (${prevMondayStr} to ${prevSundayStr})`,
      };

      return {
        current: currentPeriod,
        previous: previousPeriod,
        isComparable: true,
      };
    }

    if (summaryType === 'this_month') {
      const monthStartStr = `${yearStr}-${monthStr}-01`;
      const currentPeriod: BusinessSummaryPeriod = {
        start: monthStartStr,
        end: todayStr,
        timezone,
        label: `This Month (${monthStartStr} to ${todayStr})`,
      };

      // Previous calendar month (full month)
      const prevMonthYear = currentMonth === 1 ? currentYear - 1 : currentYear;
      const prevMonthNum = currentMonth === 1 ? 12 : currentMonth - 1;
      const prevMonthStr = prevMonthNum < 10 ? `0${prevMonthNum}` : `${prevMonthNum}`;
      const prevMonthDays = new Date(Date.UTC(prevMonthYear, prevMonthNum, 0)).getUTCDate();
      const prevMonthStartStr = `${prevMonthYear}-${prevMonthStr}-01`;
      const prevMonthEndStr = `${prevMonthYear}-${prevMonthStr}-${prevMonthDays < 10 ? `0${prevMonthDays}` : prevMonthDays}`;

      const previousPeriod: BusinessSummaryPeriod = {
        start: prevMonthStartStr,
        end: prevMonthEndStr,
        timezone,
        label: `Previous Month (${prevMonthStartStr} to ${prevMonthEndStr})`,
      };

      return {
        current: currentPeriod,
        previous: previousPeriod,
        isComparable: true,
      };
    }

    if (summaryType === 'custom') {
      if (!customStart || !customEnd) {
        throw new Error('Custom summary requires valid startDate and endDate');
      }
      if (customStart > customEnd) {
        throw new Error('Start date cannot be after end date');
      }

      const currentPeriod: BusinessSummaryPeriod = {
        start: customStart,
        end: customEnd,
        timezone,
        label: `Custom Period (${customStart} to ${customEnd})`,
      };

      // Calculate duration in days
      const sDate = new Date(customStart);
      const eDate = new Date(customEnd);
      const diffDays = Math.round((eDate.getTime() - sDate.getTime()) / (1000 * 60 * 60 * 24)) + 1;

      // Bound custom duration to max 366 days
      if (diffDays > 366) {
        throw new Error('Custom summary range cannot exceed 366 days');
      }

      // Preceding equal-duration comparison period
      const prevEndDate = new Date(sDate.getTime() - 1000 * 60 * 60 * 24);
      const prevStartDate = new Date(prevEndDate.getTime() - (diffDays - 1) * 1000 * 60 * 60 * 24);
      const prevStartStr = prevStartDate.toISOString().split('T')[0];
      const prevEndStr = prevEndDate.toISOString().split('T')[0];

      const previousPeriod: BusinessSummaryPeriod = {
        start: prevStartStr,
        end: prevEndStr,
        timezone,
        label: `Prior Period (${prevStartStr} to ${prevEndStr})`,
      };

      return {
        current: currentPeriod,
        previous: previousPeriod,
        isComparable: true,
      };
    }

    throw new Error(`Unsupported summary type: ${summaryType}`);
  }
}
