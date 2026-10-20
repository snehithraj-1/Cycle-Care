import Dexie, { type Table } from 'dexie';
import type { UserProfile, PeriodEntry, ReminderItem, ReminderLog } from '../types';

export class CycleCareDB extends Dexie {
  profile!: Table<UserProfile, number>;
  periods!: Table<PeriodEntry, number>;
  reminders!: Table<ReminderItem, number>;
  reminderLogs!: Table<ReminderLog, number>;

  constructor() {
    super('CycleCareDB_v1');
    this.version(1).stores({
      profile: '++id',
      periods: '++id, startDate, endDate',
      reminders: '++id, frequency, enabled',
      reminderLogs: '++id, reminderId, scheduledDate, status'
    });
  }
}

export const db = new CycleCareDB();

/**
 * Loads realistic sample data for demonstration / evaluation purposes.
 */
export async function seedSampleData() {
  await db.transaction('rw', [db.profile, db.periods, db.reminders, db.reminderLogs], async () => {
    // 1. Profile
    await db.profile.clear();
    await db.profile.add({
      name: 'Elena',
      cycleLength: 28,
      periodLength: 5,
      lastPeriodDate: '2026-09-28',
      hasCompletedOnboarding: true,
      notificationsEnabled: true,
      alarmSound: 'chime',
      vibrationEnabled: true,
      snoozeDuration: 10,
      theme: 'light',
      createdAt: new Date().toISOString()
    });

    // 2. Periods (realistic previous cycles with YYYY-MM-DD date-only strings)
    await db.periods.clear();
    await db.periods.bulkAdd([
      {
        startDate: '2026-07-06',
        endDate: '2026-07-10',
        flowLevel: 'medium',
        notes: 'Normal flow, mild cramps on day 1.',
        createdAt: '2026-07-06T08:00:00Z'
      },
      {
        startDate: '2026-08-03',
        endDate: '2026-08-07',
        flowLevel: 'medium',
        notes: 'Light headache in morning.',
        createdAt: '2026-08-03T08:00:00Z'
      },
      {
        startDate: '2026-08-31',
        endDate: '2026-09-04',
        flowLevel: 'heavy',
        notes: 'Slightly heavier flow on days 2 and 3.',
        createdAt: '2026-08-31T08:00:00Z'
      },
      {
        startDate: '2026-09-28',
        endDate: '2026-10-02',
        flowLevel: 'medium',
        notes: 'Felt well, regular 28-day spacing.',
        createdAt: '2026-09-28T08:00:00Z'
      }
    ]);

    // 3. Reminders
    await db.reminders.clear();
    const today = new Date().toISOString().split('T')[0];
    await db.reminders.bulkAdd([
      {
        name: 'Iron & Folic Acid',
        description: 'Take after breakfast with a glass of water',
        startDate: today,
        time: '09:00',
        frequency: 'daily',
        reminderType: 'alarm',
        sound: 'chime',
        vibration: true,
        snoozeMinutes: 10,
        enabled: true,
        createdAt: new Date().toISOString()
      },
      {
        name: 'Evening Magnesium',
        description: 'Supports calm muscles and restful sleep',
        startDate: today,
        time: '21:30',
        frequency: 'daily',
        reminderType: 'notification',
        sound: 'gentle',
        vibration: true,
        snoozeMinutes: 15,
        enabled: true,
        createdAt: new Date().toISOString()
      },
      {
        name: 'Vitamin D3 Drops',
        description: 'Weekly supplement dose with healthy fats',
        startDate: today,
        time: '11:00',
        frequency: 'selected_days',
        selectedDays: [0], // Sunday
        reminderType: 'notification',
        sound: 'bell',
        vibration: false,
        snoozeMinutes: 10,
        enabled: true,
        createdAt: new Date().toISOString()
      }
    ]);

    // 4. Sample completed log
    await db.reminderLogs.clear();
    await db.reminderLogs.add({
      reminderId: 1,
      medicineName: 'Iron & Folic Acid',
      scheduledDate: today,
      scheduledTime: '09:00',
      status: 'taken',
      actionTimestamp: new Date().toISOString()
    });
  });
}

/**
 * Clear all data for a completely blank initial state or data deletion.
 */
export async function clearAllUserData() {
  await db.transaction('rw', [db.profile, db.periods, db.reminders, db.reminderLogs], async () => {
    await db.profile.clear();
    await db.periods.clear();
    await db.reminders.clear();
    await db.reminderLogs.clear();
  });
}
