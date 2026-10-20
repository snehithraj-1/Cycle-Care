import type { ReminderItem, ReminderLog } from '../types';
import { db } from '../db';
import { getTodayDateStr } from './cycleEngine';

class ReminderEngine {
  private audioCtx: AudioContext | null = null;
  private activeIntervalId: number | null = null;

  /**
   * Request browser notification permissions safely.
   */
  async requestNotificationPermission(): Promise<{ granted: boolean; status: NotificationPermission | 'unsupported' }> {
    if (!('Notification' in window)) {
      return { granted: false, status: 'unsupported' };
    }

    if (Notification.permission === 'granted') {
      return { granted: true, status: 'granted' };
    }

    if (Notification.permission !== 'denied') {
      try {
        const result = await Notification.requestPermission();
        return { granted: result === 'granted', status: result };
      } catch (err) {
        console.warn('Error requesting notification permission:', err);
        return { granted: false, status: Notification.permission };
      }
    }

    return { granted: false, status: Notification.permission };
  }

  /**
   * Get current notification permission state
   */
  getNotificationPermissionStatus(): NotificationPermission | 'unsupported' {
    if (!('Notification' in window)) return 'unsupported';
    return Notification.permission;
  }

  /**
   * Triggers a system web notification if granted
   */
  dispatchNotification(reminder: ReminderItem, title?: string, body?: string) {
    if ('Notification' in window && Notification.permission === 'granted') {
      try {
        new Notification(title || `Reminder: ${reminder.name}`, {
          body: body || reminder.description || `Scheduled for ${reminder.time}`,
          icon: '/favicon.svg',
          tag: `cyclecare-reminder-${reminder.id}`
        });
      } catch (err) {
        console.warn('Web notification dispatch failed:', err);
      }
    }
  }

  /**
   * Synthesizes an elegant, soothing harmonic chime chord (F5, A5, C6) via Web Audio API.
   * Eliminates the need for external MP3 assets and works reliably offline.
   */
  playChime(soundType: string = 'chime') {
    try {
      const AudioCtxClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (!this.audioCtx) {
        this.audioCtx = new AudioCtxClass();
      }
      if (this.audioCtx.state === 'suspended') {
        this.audioCtx.resume();
      }

      const now = this.audioCtx.currentTime;
      let freqs = [698.46, 880.0, 1046.5]; // F5, A5, C6 major triad

      if (soundType === 'gentle') {
        freqs = [523.25, 659.25, 783.99]; // C5, E5, G5 soft chord
      } else if (soundType === 'bell') {
        freqs = [783.99, 987.77, 1174.66]; // G5, B5, D6 high bell
      } else if (soundType === 'marimba') {
        freqs = [440.0, 554.37, 659.25]; // A4, C#5, E5 warm wooden chime
      }

      freqs.forEach((freq, idx) => {
        const osc = this.audioCtx!.createOscillator();
        const gain = this.audioCtx!.createGain();

        osc.type = soundType === 'marimba' ? 'triangle' : 'sine';
        osc.frequency.setValueAtTime(freq, now + idx * 0.12);

        gain.gain.setValueAtTime(0.0001, now + idx * 0.12);
        gain.gain.exponentialRampToValueAtTime(0.2, now + idx * 0.12 + 0.04);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + idx * 0.12 + 1.2);

        osc.connect(gain);
        gain.connect(this.audioCtx!.destination);

        osc.start(now + idx * 0.12);
        osc.stop(now + idx * 0.12 + 1.25);
      });
    } catch (e) {
      console.warn('Web Audio playback failed or blocked by autoplay policy:', e);
    }
  }

  /**
   * Haptic vibration feedback on supported devices (Android Capacitor / mobile browsers)
   */
  vibrate(pattern: number[] = [200, 100, 200, 100, 400]) {
    if ('vibrate' in navigator) {
      try {
        navigator.vibrate(pattern);
      } catch (err) {
        console.warn('Vibration API error:', err);
      }
    }
  }

  /**
   * Calculates next occurrence timestamp string for a reminder
   */
  getNextOccurrence(reminder: ReminderItem): { date: string; time: string; display: string } {
    const today = getTodayDateStr();
    const [remH, remM] = reminder.time.split(':').map(Number);
    const now = new Date();
    const currentH = now.getHours();
    const currentM = now.getMinutes();

    const isLaterToday = remH > currentH || (remH === currentH && remM > currentM);

    if (reminder.frequency === 'daily') {
      if (isLaterToday) {
        return { date: today, time: reminder.time, display: `Today at ${this.formatTime12h(reminder.time)}` };
      }
      return { date: 'tomorrow', time: reminder.time, display: `Tomorrow at ${this.formatTime12h(reminder.time)}` };
    }

    if (reminder.frequency === 'once') {
      if (reminder.startDate === today && isLaterToday) {
        return { date: today, time: reminder.time, display: `Today at ${this.formatTime12h(reminder.time)}` };
      }
      return { date: reminder.startDate, time: reminder.time, display: `${reminder.startDate} at ${this.formatTime12h(reminder.time)}` };
    }

    if (reminder.frequency === 'selected_days' && reminder.selectedDays && reminder.selectedDays.length > 0) {
      const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
      const todayDayOfWeek = now.getDay();

      if (reminder.selectedDays.includes(todayDayOfWeek) && isLaterToday) {
        return { date: today, time: reminder.time, display: `Today at ${this.formatTime12h(reminder.time)}` };
      }

      // Find next matching day
      for (let i = 1; i <= 7; i++) {
        const nextDay = (todayDayOfWeek + i) % 7;
        if (reminder.selectedDays.includes(nextDay)) {
          const name = i === 1 ? 'Tomorrow' : dayNames[nextDay];
          return { date: name, time: reminder.time, display: `${name} at ${this.formatTime12h(reminder.time)}` };
        }
      }
    }

    return { date: reminder.startDate, time: reminder.time, display: `${reminder.time}` };
  }

  /**
   * Formats 24h '14:30' into 12h '2:30 PM'
   */
  formatTime12h(time24: string): string {
    const [h, m] = time24.split(':').map(Number);
    const period = h >= 12 ? 'PM' : 'AM';
    const h12 = h % 12 || 12;
    const mStr = String(m).padStart(2, '0');
    return `${h12}:${mStr} ${period}`;
  }

  /**
   * Logs an action: Taken, Dismissed, or Snoozed.
   * Distinguishes explicitly between dismissing an alert and confirming taken!
   */
  async logReminderAction(reminder: ReminderItem, status: 'taken' | 'dismissed' | 'snoozed'): Promise<void> {
    const today = getTodayDateStr();
    const nowTime = new Date().toTimeString().substring(0, 5);

    const logEntry: ReminderLog = {
      reminderId: reminder.id || 0,
      medicineName: reminder.name,
      scheduledDate: today,
      scheduledTime: reminder.time,
      status,
      actionTimestamp: new Date().toISOString()
    };

    await db.reminderLogs.add(logEntry);

    // If marked taken, update lastTaken fields on the reminder item
    if (status === 'taken' && reminder.id) {
      await db.reminders.update(reminder.id, {
        lastTakenDate: today,
        lastTakenTime: nowTime
      });
    }
  }

  /**
   * Explains native Android vs Web platform capabilities and limitations.
   */
  getPlatformCapabilityInfo() {
    return {
      isAndroidSupported: 'Capacitor' in window || /Android/i.test(navigator.userAgent),
      exactAlarmNote: 'On Android 12+, exact alarms require the SCHEDULE_EXACT_ALARM permission and unrestricted battery setting.',
      backgroundLimitNote: 'Browser web apps cannot ring alarms when the browser is terminated or background execution is restricted by the OS.',
      offlineReady: 'All reminder schedules and medication logs are stored locally in IndexedDB and never depend on network connectivity.'
    };
  }
}

export const reminderEngine = new ReminderEngine();
