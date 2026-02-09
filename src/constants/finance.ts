/**
 * Finance Constants
 * Fixed rates and calculations for finance overview
 */

// Daily base cost rate in MYR
export const DAILY_BASE_COST = 3500;

// Hours per working day
export const HOURS_PER_DAY = 8;

// Fixed hourly rate (3500 / 8 = 437.50 MYR/hour)
export const FIXED_HOURLY_RATE = DAILY_BASE_COST / HOURS_PER_DAY;

/**
 * Calculate base cost based on hours worked
 * @param hours - Total hours worked
 * @returns Cost in MYR
 */
export function calculateBaseCost(hours: number): number {
  return hours * FIXED_HOURLY_RATE;
}
