export interface UserProfile {
  id?: number;
  name: string;
  cycleLength?: number | null; // e.g. 28 days, or null if unknown
  periodLength?: number; // e.g. 5 days
  lastPeriodDate?: string; // YYYY-MM-DD
  periodMemoryChoice?: 'exact' | 'approximate' | 'dont_remember' | 'first_time';
  hasCompletedOnboarding: boolean;
  notificationsEnabled: boolean;
  alarmSound: 'chime' | 'gentle' | 'bell' | 'marimba';
  vibrationEnabled: boolean;
  snoozeDuration: number; // in minutes: 5, 10, 15, 20
  theme: 'light' | 'cream';
  createdAt: string;
}

export type FlowLevel = 'light' | 'medium' | 'heavy' | 'spotting';

export interface PeriodEntry {
  id?: number;
  startDate: string; // YYYY-MM-DD
  endDate?: string;   // YYYY-MM-DD
  flowLevel: FlowLevel;
  isApproximate?: boolean; // distinguishes exact from approximate dates
  notes?: string;
  createdAt: string;
}

export type ReminderFrequency = 'once' | 'daily' | 'multiple_daily' | 'selected_days' | 'custom';
export type ReminderType = 'notification' | 'alarm';

export interface ReminderItem {
  id?: number;
  name: string;
  description?: string;
  startDate: string; // YYYY-MM-DD
  endDate?: string;   // YYYY-MM-DD optional
  time: string;       // HH:mm (24-hour)
  frequency: ReminderFrequency;
  selectedDays?: number[]; // 0=Sunday, 1=Monday... 6=Saturday
  additionalTimes?: string[]; // extra times for multiple_daily
  reminderType: ReminderType;
  sound: string;
  vibration: boolean;
  snoozeMinutes: number;
  enabled: boolean;
  lastTakenDate?: string;
  lastTakenTime?: string;
  createdAt: string;
}

export interface ReminderLog {
  id?: number;
  reminderId: number;
  medicineName: string;
  scheduledDate: string; // YYYY-MM-DD
  scheduledTime: string; // HH:mm
  status: 'taken' | 'dismissed' | 'snoozed';
  actionTimestamp: string;
}

export interface CycleStats {
  status: 'no_data' | 'single_date' | 'multiple_dates';
  averageCycleLength: number | null;
  averagePeriodLength: number;
  lastPeriodStartDate: string | null;
  nextPeriodStartDate: string | null;
  nextPeriodEndDate: string | null;
  daysUntilNextPeriod: number | null;
  currentCycleDay: number | null;
  cycleVariation: number; // variation in days
  historicalCycles: {
    startDate: string;
    endDate?: string;
    length: number;
    isApproximate?: boolean;
  }[];
  isRegular: boolean;
  isSubstantiallyVariable: boolean;
  hasEnoughData: boolean;
  hasApproximateDates: boolean;
  calculationBasis: 'median_history' | 'expected_setting' | 'none';
  headline: string;
  explanationText: string;
  confidenceLevel: 'preliminary' | 'moderate' | 'high';
  totalCyclesRecorded: number;
}

export type AppScreen =
  | 'splash'
  | 'onboarding'
  | 'dashboard'
  | 'calendar'
  | 'log-period'
  | 'period-history'
  | 'insights'
  | 'reminders'
  | 'add-reminder'
  | 'alarm'
  | 'settings';
