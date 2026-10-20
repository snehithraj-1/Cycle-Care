// Automated Test Suite for CycleCare Adaptive Prediction Engine
import assert from 'node:assert';

// Pure Date Functions matching src/services/cycleEngine.ts
function parseDateParts(dateStr) {
  const parts = dateStr.split('-').map(Number);
  return { year: parts[0], month: parts[1], day: parts[2] };
}

function formatDateParts(year, month, day) {
  const y = String(year).padStart(4, '0');
  const m = String(month).padStart(2, '0');
  const d = String(day).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

function isValidCalendarDate(dateStr) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) return false;
  const { year, month, day } = parseDateParts(dateStr);
  if (year < 1900 || year > 2100) return false;
  if (month < 1 || month > 12) return false;
  const daysInMonth = new Date(year, month, 0).getDate();
  return day >= 1 && day <= daysInMonth;
}

function addDays(dateStr, daysToAdd) {
  const { year, month, day } = parseDateParts(dateStr);
  const d = new Date(year, month - 1, day, 12, 0, 0, 0);
  d.setDate(d.getDate() + daysToAdd);
  return formatDateParts(d.getFullYear(), d.getMonth() + 1, d.getDate());
}

function diffDays(dateStrA, dateStrB) {
  const a = parseDateParts(dateStrA);
  const b = parseDateParts(dateStrB);
  const da = new Date(a.year, a.month - 1, a.day, 12, 0, 0);
  const db = new Date(b.year, b.month - 1, b.day, 12, 0, 0);
  const msDiff = db.getTime() - da.getTime();
  return Math.round(msDiff / (1000 * 60 * 60 * 24));
}

function calculateMedian(numbers) {
  if (numbers.length === 0) return 0;
  const sorted = [...numbers].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  if (sorted.length % 2 !== 0) return sorted[mid];
  return Math.round((sorted[mid - 1] + sorted[mid]) / 2);
}

function calculateVariation(numbers) {
  if (numbers.length <= 1) return 0;
  const avg = numbers.reduce((a, b) => a + b, 0) / numbers.length;
  const variance = numbers.reduce((sum, n) => sum + Math.pow(n - avg, 2), 0) / (numbers.length - 1);
  return Math.round(Math.sqrt(variance) * 10) / 10;
}

function validatePeriodStartDate(newStartDate, existingPeriods, currentEditingId) {
  if (!newStartDate || !newStartDate.trim()) {
    return { valid: false, error: 'Please select a period start date.' };
  }
  if (!isValidCalendarDate(newStartDate)) {
    return { valid: false, error: 'Please enter a valid calendar date in YYYY-MM-DD format.' };
  }
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

function calculateCycleStats(profile, periods = [], referenceDateStr = '2026-10-20') {
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
    const knownCycleLength = profile?.cycleLength && profile.cycleLength > 0 ? profile.cycleLength : null;

    let nextPeriodStartDate = null;
    let nextPeriodEndDate = null;
    let daysUntilNextPeriod = null;
    let calculationBasis = 'none';

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

  const cycleIntervals = [];
  const historicalCycles = [];

  for (let i = 1; i < sortedPeriods.length; i++) {
    const prevEntry = sortedPeriods[i - 1];
    const currEntry = sortedPeriods[i];
    const intervalDays = diffDays(prevEntry.startDate, currEntry.startDate);
    const isPairApprox = Boolean(prevEntry.isApproximate || currEntry.isApproximate);

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

  const observedMedianLength = calculateMedian(cycleIntervals);
  const cycleVariation = calculateVariation(cycleIntervals);
  const minInterval = Math.min(...cycleIntervals);
  const maxInterval = Math.max(...cycleIntervals);
  const range = maxInterval - minInterval;

  const isSubstantiallyVariable = cycleIntervals.length >= 2 && (cycleVariation >= 4.5 || range >= 8);
  const isRegular = !isSubstantiallyVariable;
  const hasEnoughData = cycleIntervals.length >= 2;

  const nextPeriodStartDate = addDays(lastStartDate, observedMedianLength);
  const nextPeriodEndDate = addDays(nextPeriodStartDate, estimatedPeriodLength - 1);
  const daysUntilNextPeriod = diffDays(referenceDateStr, nextPeriodStartDate);

  let headline = `Observed Rhythm (~${observedMedianLength} days)`;
  let confidenceLevel = 'moderate';
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

// ========================
// TEST SUITE EXECUTION
// ========================
console.log('--- STARTING CYCLECARE ADAPTIVE PREDICTION ENGINE TESTS ---');

// Test 1: August 10 -> September 7 = 28 days
const interval1 = diffDays('2026-08-10', '2026-09-07');
assert.strictEqual(interval1, 28, 'August 10 -> September 7 must be exactly 28 days');
console.log('✓ Test 1 Passed: August 10 → September 7 = 28 days');

// Test 2: September 7 -> October 5 = 28 days
const interval2 = diffDays('2026-09-07', '2026-10-05');
assert.strictEqual(interval2, 28, 'September 7 -> October 5 must be exactly 28 days');
console.log('✓ Test 2 Passed: September 7 → October 5 = 28 days');

// Test 3: Prompt prediction example: October 5, 2026 + 28 days = November 2, 2026
const predictedNov2 = addDays('2026-10-05', 28);
assert.strictEqual(predictedNov2, '2026-11-02', 'October 5 + 28 days must be November 2, 2026');
console.log('✓ Test 3 Passed: October 5, 2026 + 28 days = November 2, 2026');

// Test 4: Year boundary transition: December 15, 2026 + 28 days = January 12, 2027
const predictedNextYear = addDays('2026-12-15', 28);
assert.strictEqual(predictedNextYear, '2027-01-12', 'Year transition from Dec 2026 to Jan 2027');
console.log('✓ Test 4 Passed: December 15, 2026 + 28 days = January 12, 2027 (Year Boundary)');

// Test 5: Leap year handling: February 10, 2028 vs February 10, 2027
const leapYear2028 = addDays('2028-02-10', 28);
assert.strictEqual(leapYear2028, '2028-03-09', 'Leap year Feb 29 shifts March arrival to March 9');
console.log('✓ Test 5 Passed: February 10, 2028 (Leap Year) + 28 days = March 9, 2028');

const nonLeapYear2027 = addDays('2027-02-10', 28);
assert.strictEqual(nonLeapYear2027, '2027-03-10', 'Non-leap year arrives on March 10');
console.log('✓ Test 6 Passed: February 10, 2027 (Non-Leap) + 28 days = March 10, 2027');

// Test 7: Duplicate start date prevention
const testPeriods = [
  { id: 1, startDate: '2026-10-05', flowLevel: 'medium' },
  { id: 2, startDate: '2026-08-10', flowLevel: 'medium' },
  { id: 3, startDate: '2026-09-07', flowLevel: 'heavy' }
];
const dupCheck = validatePeriodStartDate('2026-10-05', testPeriods);
assert.strictEqual(dupCheck.valid, false, 'Duplicate start date must be rejected');
console.log('✓ Test 7 Passed: Duplicate start dates rejected');

// Test 8: Calendar date validation
assert.strictEqual(isValidCalendarDate('2026-02-29'), false, 'Feb 29 on non-leap year 2026 is invalid');
assert.strictEqual(isValidCalendarDate('2028-02-29'), true, 'Feb 29 on leap year 2028 is valid');
console.log('✓ Test 8 Passed: Calendar date validation');

// Test 9: Case 1 - No actual period dates available (0 dates, unknown cycle length)
// Requirements:
// - Do not fabricate historical data
// - Do not display a personalized prediction
// - Invite the user to record their next period
const zeroStats = calculateCycleStats({ cycleLength: null }, []);
assert.strictEqual(zeroStats.status, 'no_data');
assert.strictEqual(zeroStats.lastPeriodStartDate, null);
assert.strictEqual(zeroStats.nextPeriodStartDate, null);
assert.strictEqual(zeroStats.daysUntilNextPeriod, null);
assert.strictEqual(zeroStats.averageCycleLength, null);
assert.strictEqual(zeroStats.calculationBasis, 'none');
assert.ok(zeroStats.explanationText.includes('Whenever your next period arrives'));
console.log('✓ Test 9 Passed: Zero period dates correctly produce no_data status, zero predictions, and invite logging');

// Test 10: Case 2 - Exactly one actual period start date available, unknown cycle length
// Requirements:
// - Save the date
// - Explain that another actual start date is needed to calculate observed cycle length
// - Allow user to continue using other app features
const singleStatsUnknown = calculateCycleStats(
  { cycleLength: null },
  [{ id: 1, startDate: '2026-10-05', flowLevel: 'medium' }],
  '2026-10-20'
);
assert.strictEqual(singleStatsUnknown.status, 'single_date');
assert.strictEqual(singleStatsUnknown.lastPeriodStartDate, '2026-10-05');
assert.strictEqual(singleStatsUnknown.currentCycleDay, 16); // Day 16 on Oct 20
assert.strictEqual(singleStatsUnknown.nextPeriodStartDate, null);
assert.strictEqual(singleStatsUnknown.averageCycleLength, null);
assert.ok(singleStatsUnknown.explanationText.includes('Another actual start date is needed'));
console.log('✓ Test 10 Passed: Single period date without known cycle length computes cycle day and explains another start date is needed');

// Test 11: Case 2b - Exactly one period date with optional known setting
const singleStatsKnown = calculateCycleStats(
  { cycleLength: 28 },
  [{ id: 1, startDate: '2026-10-05', flowLevel: 'medium' }],
  '2026-10-20'
);
assert.strictEqual(singleStatsKnown.status, 'single_date');
assert.strictEqual(singleStatsKnown.averageCycleLength, 28);
assert.strictEqual(singleStatsKnown.nextPeriodStartDate, '2026-11-02');
assert.strictEqual(singleStatsKnown.calculationBasis, 'expected_setting');
assert.ok(singleStatsKnown.explanationText.includes('Another actual start date is needed'));
console.log('✓ Test 11 Passed: Single period date with optional setting provides preliminary date while explaining observed length needs 2nd date');

// Test 12: Case 3 - Two or more period dates with median calculation
const multiStats = calculateCycleStats(
  { cycleLength: null },
  [
    { id: 1, startDate: '2026-10-05', flowLevel: 'medium' },
    { id: 2, startDate: '2026-08-10', flowLevel: 'medium' },
    { id: 3, startDate: '2026-09-07', flowLevel: 'heavy' }
  ],
  '2026-10-20'
);
assert.strictEqual(multiStats.status, 'multiple_dates');
assert.strictEqual(multiStats.averageCycleLength, 28);
assert.strictEqual(multiStats.nextPeriodStartDate, '2026-11-02');
assert.strictEqual(multiStats.daysUntilNextPeriod, 13);
assert.strictEqual(multiStats.calculationBasis, 'median_history');
assert.strictEqual(multiStats.hasApproximateDates, false);
assert.strictEqual(multiStats.isSubstantiallyVariable, false);
console.log('✓ Test 12 Passed: Two or more periods compute observed intervals and median prediction (28 days)');

// Test 13: Distinguish exact dates from approximate dates
// Requirements:
// - Distinguish exact dates from approximate dates
// - Do not treat approximate dates as equally reliable observations
const approxPeriods = [
  { id: 1, startDate: '2026-08-10', flowLevel: 'medium', isApproximate: true },
  { id: 2, startDate: '2026-09-07', flowLevel: 'medium', isApproximate: false },
  { id: 3, startDate: '2026-10-05', flowLevel: 'medium', isApproximate: false }
];
const approxStats = calculateCycleStats({ cycleLength: null }, approxPeriods, '2026-10-20');
assert.strictEqual(approxStats.hasApproximateDates, true);
assert.strictEqual(approxStats.confidenceLevel, 'preliminary');
assert.ok(approxStats.explanationText.includes('approximate'));
console.log('✓ Test 13 Passed: Approximate dates distinguished, lower confidence level assigned, uncertainty explained');

// Test 14: Substantial cycle variability detection
// Requirements:
// - If cycles vary substantially, explain that predictions may be less reliable
const variablePeriods = [
  { id: 1, startDate: '2026-07-01', flowLevel: 'medium' },
  { id: 2, startDate: '2026-07-25', flowLevel: 'medium' }, // 24 days
  { id: 3, startDate: '2026-08-29', flowLevel: 'medium' }, // 35 days
  { id: 4, startDate: '2026-09-22', flowLevel: 'medium' }  // 24 days
];
const variableStats = calculateCycleStats({ cycleLength: null }, variablePeriods, '2026-10-20');
assert.strictEqual(variableStats.isSubstantiallyVariable, true);
assert.strictEqual(variableStats.isRegular, false);
assert.ok(variableStats.explanationText.includes('vary substantially'));
assert.ok(variableStats.explanationText.includes('less reliable'));
console.log('✓ Test 14 Passed: Substantial cycle variability detected (range >= 8 days) and uncertainty clearly stated');

console.log('\nALL 14 TESTS PASSED PERFECTLY! 🚀✨');
