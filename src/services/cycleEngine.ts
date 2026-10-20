import type { PeriodEntry, UserProfile, CycleStats } from '../types';

/**
 * Parses YYYY-MM-DD string into integer year, month (1-indexed), and day numbers.
 * Completely immune to timezone UTC conversion errors.
 */
export function parseDateParts(dateStr: string): { year: number; month: number; day: number } {
  const parts = dateStr.split('-').map(Number);
  return {
    year: parts[0],
    month: parts[1],
    day: parts[2]
  };
}

/**
 * Formats year, month (1-indexed), day into standard YYYY-MM-DD.
 */
export function formatDateParts(year: number, month: number, day: number): string {
  const y = String(year).padStart(4, '0');
  const m = String(month).padStart(2, '0');
  const d = String(day).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

/**
 * Returns today's date in local YYYY-MM-DD format.
 */
export function getTodayDateStr(): string {
  const now = new Date();
  return formatDateParts(now.getFullYear(), now.getMonth() + 1, now.getDate());
}

/**
 * Validates whether a YYYY-MM-DD string represents a real calendar date,
 * correctly checking leap years and month lengths.
 */
export function isValidCalendarDate(dateStr: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) return false;
  const { year, month, day } = parseDateParts(dateStr);
  if (year < 1900 || year > 2100) return false;
  if (month < 1 || month > 12) return false;

  const daysInMonth = new Date(year, month, 0).getDate();
  return day >= 1 && day <= daysInMonth;
}

/**
 * Adds an integer number of days to a YYYY-MM-DD date string.
 * Uses local calendar date math to correctly cross month/year/leap-year boundaries.
 */
export function addDays(dateStr: string, daysToAdd: number): string {
  const { year, month, day } = parseDateParts(dateStr);
  // Using noon local time avoids daylight saving clock shift jumps
  const d = new Date(year, month - 1, day, 12, 0, 0, 0);
  d.setDate(d.getDate() + daysToAdd);
  return formatDateParts(d.getFullYear(), d.getMonth() + 1, d.getDate());
}

/**
 * Calculates calendar day difference between dateStrB and dateStrA (B - A).
 * Example: '2026-08-10' to '2026-09-07' returns 28 days.
 */
export function diffDays(dateStrA: string, dateStrB: string): number {
  const a = parseDateParts(dateStrA);
  const b = parseDateParts(dateStrB);
  const da = new Date(a.year, a.month - 1, a.day, 12, 0, 0);
  const db = new Date(b.year, b.month - 1, b.day, 12, 0, 0);
  const msDiff = db.getTime() - da.getTime();
  return Math.round(msDiff / (1000 * 60 * 60 * 24));
}

/**
 * Computes median of an array of numbers.
 */
export function calculateMedian(numbers: number[]): number {
  if (numbers.length === 0) return 0;
  const sorted = [...numbers].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  if (sorted.length % 2 !== 0) {
    return sorted[mid];
  }
  return Math.round((sorted[mid - 1] + sorted[mid]) / 2);
}

/**
 * Computes sample variation / standard deviation in days.
 */
export function calculateVariation(numbers: number[]): number {
  if (numbers.length <= 1) return 0;
  const avg = numbers.reduce((a, b) => a + b, 0) / numbers.length;
  const variance = numbers.reduce((sum, n) => sum + Math.pow(n - avg, 2), 0) / (numbers.length - 1);
  return Math.round(Math.sqrt(variance) * 10) / 10;
}

/**
 * Validates a period start date entry against duplicate entries and invalid calendar dates.
 */
export function validatePeriodStartDate(
  newStartDate: string,
  existingPeriods: PeriodEntry[],
  currentEditingId?: number
): { valid: boolean; error?: string } {
  if (!newStartDate || !newStartDate.trim()) {
    return { valid: false, error: 'Please select a period start date.' };
  }

  if (!isValidCalendarDate(newStartDate)) {
    return { valid: false, error: 'Please enter a valid calendar date in YYYY-MM-DD format.' };
  }

  // Prevent duplicate start-date entries
  const duplicate = existingPeriods.find(
    (p) => p.startDate === newStartDate && p.id !== currentEditingId
  );
  if (duplicate) {
    return {
      valid: false,
      error: `A period entry starting on ${newStartDate} already exists. Duplicate start dates are not permitted.`
    };
  }

  return { valid: true };
}

/**
 * Computes comprehensive cycle metrics, predictions, and uncertainty.
 * Follows exact clinical and adaptive logic:
 * 1. Does not require users to know their cycle length.
 * 2. If 0 dates: do not fabricate data, no personalized prediction, invite user to record next period.
 * 3. If 1 date: save date, current cycle day, explain another actual start date is needed.
 * 4. If 2+ dates: calculate observed intervals, use median, communicate uncertainty.
 * 5. Distinguishes exact dates from approximate dates.
 * 6. Detects substantial variation (std dev >= 4.5 days or range >= 8 days) and notes less reliable predictions.
 */
export function calculateCycleStats(
  profile?: UserProfile,
  periods: PeriodEntry[] = [],
  referenceDateStr: string = getTodayDateStr()
): CycleStats {
  // Sort periods strictly chronologically by startDate
  const sortedPeriods = [...periods].sort((a, b) => a.startDate.localeCompare(b.startDate));
  const estimatedPeriodLength = profile?.periodLength || 5;

  // Case 1: No actual period dates available
  if (sortedPeriods.length === 0) {
    return {
      status: 'no_data',
      averageCycleLength: profile?.cycleLength ?? null,
      averagePeriodLength: estimatedPeriodLength,
      lastPeriodStartDate: null,
      nextPeriodStartDate: null,
      nextPeriodEndDate: null,
      daysUntilNextPeriod: null,
      currentCycleDay: null,
      cycleVariation: 0,
      historicalCycles: [],
      isRegular: true,
      isSubstantiallyVariable: false,
      hasEnoughData: false,
      hasApproximateDates: false,
      calculationBasis: 'none',
      headline: 'Track Your Next Period',
      explanationText:
        'No period dates recorded yet. Whenever your next period arrives, record it here to begin observing your natural rhythm.',
      confidenceLevel: 'preliminary',
      totalCyclesRecorded: 0
    };
  }

  // Case 2: Exactly one actual period start date available
  if (sortedPeriods.length === 1) {
    const singleEntry = sortedPeriods[0];
    const lastStartDate = singleEntry.startDate;
    const daysSinceLastPeriod = diffDays(lastStartDate, referenceDateStr);
    const currentCycleDay = daysSinceLastPeriod >= 0 ? daysSinceLastPeriod + 1 : 1;
    const hasApprox = Boolean(singleEntry.isApproximate);

    // If the user provided a known typical cycle length in their profile,
    // we can calculate a preliminary reference estimate, but clearly communicate that
    // another actual start date is needed to calculate their observed cycle length.
    const knownCycleLength = profile?.cycleLength && profile.cycleLength > 0 ? profile.cycleLength : null;

    let nextPeriodStartDate: string | null = null;
    let nextPeriodEndDate: string | null = null;
    let daysUntilNextPeriod: number | null = null;
    let calculationBasis: CycleStats['calculationBasis'] = 'none';

    if (knownCycleLength) {
      nextPeriodStartDate = addDays(lastStartDate, knownCycleLength);
      nextPeriodEndDate = addDays(nextPeriodStartDate, estimatedPeriodLength - 1);
      daysUntilNextPeriod = diffDays(referenceDateStr, nextPeriodStartDate);
      calculationBasis = 'expected_setting';
    }

    const explanationText = hasApprox
      ? 'First period start date recorded (~ approximate). Another actual start date is needed to observe your personal cycle length.'
      : 'First period start date recorded. Another actual start date is needed to calculate your observed cycle length.';

    return {
      status: 'single_date',
      averageCycleLength: knownCycleLength,
      averagePeriodLength: estimatedPeriodLength,
      lastPeriodStartDate: lastStartDate,
      nextPeriodStartDate,
      nextPeriodEndDate,
      daysUntilNextPeriod,
      currentCycleDay,
      cycleVariation: 0,
      historicalCycles: [],
      isRegular: true,
      isSubstantiallyVariable: false,
      hasEnoughData: false,
      hasApproximateDates: hasApprox,
      calculationBasis,
      headline: 'First Period Saved',
      explanationText,
      confidenceLevel: 'preliminary',
      totalCyclesRecorded: 0
    };
  }

  // Case 3: Two or more actual period start dates available
  const lastPeriod = sortedPeriods[sortedPeriods.length - 1];
  const lastStartDate = lastPeriod.startDate;
  const daysSinceLastPeriod = diffDays(lastStartDate, referenceDateStr);
  const currentCycleDay = daysSinceLastPeriod >= 0 ? daysSinceLastPeriod + 1 : 1;

  // Calculate actual cycle intervals between consecutive start dates
  const cycleIntervals: number[] = [];
  const historicalCycles: CycleStats['historicalCycles'] = [];
  let hasApproximateInterval = false;

  for (let i = 1; i < sortedPeriods.length; i++) {
    const prevEntry = sortedPeriods[i - 1];
    const currEntry = sortedPeriods[i];
    const intervalDays = diffDays(prevEntry.startDate, currEntry.startDate);
    const isPairApprox = Boolean(prevEntry.isApproximate || currEntry.isApproximate);

    if (isPairApprox) {
      hasApproximateInterval = true;
    }

    // Physiologically plausible cycle range: 18 - 60 days
    if (intervalDays >= 18 && intervalDays <= 60) {
      cycleIntervals.push(intervalDays);
      historicalCycles.push({
        startDate: prevEntry.startDate,
        endDate: prevEntry.endDate,
        length: intervalDays,
        isApproximate: isPairApprox
      });
    }
  }

  const hasAnyApproximateDate = sortedPeriods.some((p) => Boolean(p.isApproximate));

  // If none of the intervals fell within 18-60 days (e.g. gaps of multiple months),
  // handle gracefully without fabricating data:
  if (cycleIntervals.length === 0) {
    const fallbackLength = profile?.cycleLength ?? null;
    return {
      status: 'single_date',
      averageCycleLength: fallbackLength,
      averagePeriodLength: estimatedPeriodLength,
      lastPeriodStartDate: lastStartDate,
      nextPeriodStartDate: fallbackLength ? addDays(lastStartDate, fallbackLength) : null,
      nextPeriodEndDate: fallbackLength
        ? addDays(addDays(lastStartDate, fallbackLength), estimatedPeriodLength - 1)
        : null,
      daysUntilNextPeriod: fallbackLength
        ? diffDays(referenceDateStr, addDays(lastStartDate, fallbackLength))
        : null,
      currentCycleDay,
      cycleVariation: 0,
      historicalCycles: [],
      isRegular: true,
      isSubstantiallyVariable: false,
      hasEnoughData: false,
      hasApproximateDates: hasAnyApproximateDate,
      calculationBasis: fallbackLength ? 'expected_setting' : 'none',
      headline: 'Cycles Irregular or Spaced Apart',
      explanationText:
        'Recorded periods are more than 60 days apart. Log your next period to establish a continuous rhythm.',
      confidenceLevel: 'preliminary',
      totalCyclesRecorded: 0
    };
  }

  // Observed cycle calculation: median of observed intervals
  const observedMedianLength = calculateMedian(cycleIntervals);
  const cycleVariation = calculateVariation(cycleIntervals);
  const minInterval = Math.min(...cycleIntervals);
  const maxInterval = Math.max(...cycleIntervals);
  const range = maxInterval - minInterval;

  // Substantial variation: standard deviation >= 4.5 days or range >= 8 days
  const isSubstantiallyVariable = cycleIntervals.length >= 2 && (cycleVariation >= 4.5 || range >= 8);
  const isRegular = !isSubstantiallyVariable;
  const hasEnoughData = cycleIntervals.length >= 2;

  // Predict next start date by adding median observed cycle length to the latest actual start date
  const nextPeriodStartDate = addDays(lastStartDate, observedMedianLength);
  const nextPeriodEndDate = addDays(nextPeriodStartDate, estimatedPeriodLength - 1);
  const daysUntilNextPeriod = diffDays(referenceDateStr, nextPeriodStartDate);

  // Determine explanation and confidence level based on reliability & variability
  let headline = `Observed Rhythm (~${observedMedianLength} days)`;
  let confidenceLevel: CycleStats['confidenceLevel'] = 'moderate';
  let explanationText = '';

  if (hasAnyApproximateDate) {
    headline = `Estimated Rhythm (~${observedMedianLength} days)`;
    confidenceLevel = 'preliminary';
    explanationText = `Estimated from your history (median: ${observedMedianLength} days). Because approximate dates were recorded, timing is an approximate guide rather than an exact date.`;
  } else if (isSubstantiallyVariable) {
    headline = `Variable Cycle Rhythm (~${observedMedianLength} days)`;
    confidenceLevel = 'moderate';
    explanationText = `Your observed cycles vary by ±${cycleVariation} days (${minInterval}–${maxInterval} days). Because your cycles vary substantially, predictions may be less reliable.`;
  } else if (cycleIntervals.length === 1) {
    confidenceLevel = 'moderate';
    explanationText = `Based on your single observed cycle interval of ${observedMedianLength} days. Future predictions will refine as more periods are recorded.`;
  } else {
    confidenceLevel = cycleIntervals.length >= 3 ? 'high' : 'moderate';
    explanationText = `Based on the median of your ${cycleIntervals.length} recorded cycle intervals (${observedMedianLength} days). Predictions are statistical estimates.`;
  }

  return {
    status: 'multiple_dates',
    averageCycleLength: observedMedianLength,
    averagePeriodLength: estimatedPeriodLength,
    lastPeriodStartDate: lastStartDate,
    nextPeriodStartDate,
    nextPeriodEndDate,
    daysUntilNextPeriod,
    currentCycleDay,
    cycleVariation,
    historicalCycles,
    isRegular,
    isSubstantiallyVariable,
    hasEnoughData,
    hasApproximateDates: hasAnyApproximateDate,
    calculationBasis: 'median_history',
    headline,
    explanationText,
    confidenceLevel,
    totalCyclesRecorded: cycleIntervals.length
  };
}

/**
 * Checks whether a given YYYY-MM-DD date falls within a predicted or logged period.
 */
export function getDateCycleClassification(
  dateStr: string,
  periods: PeriodEntry[],
  stats: CycleStats
): {
  isLoggedPeriod: boolean;
  isPredictedPeriod: boolean;
  isToday: boolean;
  periodEntry?: PeriodEntry;
} {
  const todayStr = getTodayDateStr();
  const isToday = dateStr === todayStr;

  // Check logged periods
  for (const entry of periods) {
    const start = entry.startDate;
    const end = entry.endDate || addDays(entry.startDate, (stats.averagePeriodLength || 5) - 1);
    if (dateStr >= start && dateStr <= end) {
      return {
        isLoggedPeriod: true,
        isPredictedPeriod: false,
        isToday,
        periodEntry: entry
      };
    }
  }

  // Check predicted period
  if (stats.nextPeriodStartDate && stats.nextPeriodEndDate) {
    if (dateStr >= stats.nextPeriodStartDate && dateStr <= stats.nextPeriodEndDate) {
      return {
        isLoggedPeriod: false,
        isPredictedPeriod: true,
        isToday
      };
    }
  }

  return {
    isLoggedPeriod: false,
    isPredictedPeriod: false,
    isToday
  };
}
