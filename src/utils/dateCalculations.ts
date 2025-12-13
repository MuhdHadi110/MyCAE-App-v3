import { format, startOfWeek, endOfWeek, addWeeks, startOfMonth, endOfMonth, addMonths, differenceInDays, isWithinInterval } from 'date-fns';

/**
 * Get week number in YYYY-W## format
 */
export const getWeekNumber = (date: Date): string => {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() + 4 - (d.getDay() || 7));
  const yearStart = new Date(d.getFullYear(), 0, 1);
  const weekNo = Math.ceil((((d.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
  return `${d.getFullYear()}-W${String(weekNo).padStart(2, '0')}`;
};

/**
 * Get date range for a given week
 */
export const getWeekDateRange = (weekNumber: string): { start: Date; end: Date } => {
  const [year, week] = weekNumber.split('-W');
  const weekNum = parseInt(week, 10);
  const jan4 = new Date(parseInt(year, 10), 0, 4);
  const firstMonday = new Date(jan4);
  firstMonday.setDate(firstMonday.getDate() - jan4.getDay() + 1);
  const startDate = new Date(firstMonday);
  startDate.setDate(startDate.getDate() + (weekNum - 1) * 7);
  const endDate = new Date(startDate);
  endDate.setDate(endDate.getDate() + 6);
  return { start: startDate, end: endDate };
};

/**
 * Get weeks between two dates
 */
export const getWeeksBetween = (startDate: Date, endDate: Date): string[] => {
  const weeks: string[] = [];
  let currentDate = new Date(startDate);

  while (currentDate <= endDate) {
    weeks.push(getWeekNumber(currentDate));
    currentDate.setDate(currentDate.getDate() + 7);
  }

  return [...new Set(weeks)]; // Remove duplicates
};

/**
 * Get month date range
 */
export const getMonthDateRange = (date: Date): { start: Date; end: Date } => {
  return {
    start: startOfMonth(date),
    end: endOfMonth(date),
  };
};

/**
 * Format date for display in charts
 */
export const formatChartDate = (date: Date, type: 'short' | 'medium' | 'long' = 'short'): string => {
  const formats = {
    short: 'MMM dd',
    medium: 'MMM dd, yyyy',
    long: 'EEEE, MMMM dd, yyyy',
  };
  return format(date, formats[type]);
};

/**
 * Get date range label (e.g., "Jan 1 - Jan 7")
 */
export const getDateRangeLabel = (startDate: Date, endDate: Date): string => {
  const start = format(startDate, 'MMM dd');
  const end = format(endDate, 'MMM dd, yyyy');
  return `${start} - ${end}`;
};

/**
 * Check if date is today
 */
export const isToday = (date: Date): boolean => {
  const today = new Date();
  return date.toDateString() === today.toDateString();
};

/**
 * Get percentage of time elapsed in a date range
 */
export const getElapsedPercentage = (startDate: Date, endDate: Date): number => {
  const now = new Date();

  if (now < startDate) return 0;
  if (now > endDate) return 100;

  const total = differenceInDays(endDate, startDate);
  const elapsed = differenceInDays(now, startDate);

  return Math.round((elapsed / total) * 100);
};

/**
 * Get last N weeks from today
 */
export const getLastNWeeks = (n: number): { start: Date; end: Date } => {
  const end = new Date();
  const start = new Date();
  start.setDate(start.getDate() - n * 7);
  return { start, end };
};

/**
 * Get last N months from today
 */
export const getLastNMonths = (n: number): { start: Date; end: Date } => {
  const end = new Date();
  const start = addMonths(end, -n);
  return { start, end };
};

/**
 * Get comparison period (previous vs current)
 */
export const getComparisonPeriods = (
  currentStart: Date,
  currentEnd: Date
): { current: { start: Date; end: Date }; previous: { start: Date; end: Date } } => {
  const duration = differenceInDays(currentEnd, currentStart);
  const previousEnd = new Date(currentStart);
  previousEnd.setDate(previousEnd.getDate() - 1);
  const previousStart = new Date(previousEnd);
  previousStart.setDate(previousStart.getDate() - duration);

  return {
    current: { start: currentStart, end: currentEnd },
    previous: { start: previousStart, end: previousEnd },
  };
};

/**
 * Get days until date
 */
export const getDaysUntil = (date: Date): number => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const target = new Date(date);
  target.setHours(0, 0, 0, 0);
  const diff = differenceInDays(target, today);
  return diff;
};

/**
 * Check if date is overdue
 */
export const isOverdue = (date: Date): boolean => {
  return getDaysUntil(date) < 0;
};

/**
 * Check if date is coming up soon (within N days)
 */
export const isComingSoon = (date: Date, daysThreshold: number = 7): boolean => {
  const daysUntil = getDaysUntil(date);
  return daysUntil >= 0 && daysUntil <= daysThreshold;
};
