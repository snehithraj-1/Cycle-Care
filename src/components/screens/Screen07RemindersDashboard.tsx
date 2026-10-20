import React, { useState } from 'react';
import { Bell, Plus, Clock, CheckCircle2, Edit3, Trash2, Check } from 'lucide-react';
import type { ReminderItem, ReminderLog } from '../../types';
import { reminderEngine } from '../../services/reminderEngine';
import { getTodayDateStr } from '../../services/cycleEngine';

interface Screen07RemindersDashboardProps {
  reminders: ReminderItem[];
  reminderLogs: ReminderLog[];
  onOpenAddReminder: (existing?: ReminderItem) => void;
  onToggleReminder: (id: number, enabled: boolean) => Promise<void>;
  onDeleteReminder: (id: number) => Promise<void>;
  onMarkTaken: (reminder: ReminderItem) => Promise<void>;
  onSimulateAlarm: (reminder: ReminderItem) => void;
}

export const Screen07RemindersDashboard: React.FC<Screen07RemindersDashboardProps> = ({
  reminders,
  reminderLogs,
  onOpenAddReminder,
  onToggleReminder,
  onDeleteReminder,
  onMarkTaken,
  onSimulateAlarm
}) => {
  const [activeTab, setActiveTab] = useState<'all' | 'today' | 'completed' | 'paused'>('all');
  const todayStr = getTodayDateStr();

  // Filtered lists
  const enabledReminders = reminders.filter((r) => r.enabled);
  const pausedReminders = reminders.filter((r) => !r.enabled);

  // Today taken logs
  const todayTakenLogs = reminderLogs.filter(
    (log) => log.scheduledDate === todayStr && log.status === 'taken'
  );

  let displayedReminders = reminders;
  if (activeTab === 'today') {
    displayedReminders = enabledReminders;
  } else if (activeTab === 'paused') {
    displayedReminders = pausedReminders;
  }

  const formatFrequencyLabel = (freq: string, selectedDays?: number[]) => {
    if (freq === 'daily') return 'Every day';
    if (freq === 'once') return 'One-time';
    if (freq === 'selected_days' && selectedDays) {
      const dayLetters = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];
      return selectedDays.map((d) => dayLetters[d]).join(', ');
    }
    return freq;
  };

  const totalDueToday = enabledReminders.length;
  const takenCount = todayTakenLogs.length;
  const adherencePercent = totalDueToday > 0 ? Math.min(100, Math.round((takenCount / totalDueToday) * 100)) : 100;

  return (
    <div className="screen-container">
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20, flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h1 style={{ fontSize: '26px', color: '#30282B', fontWeight: 700 }}>
            Medicine Reminders
          </h1>
          <p style={{ fontSize: '13px', color: '#81777B', marginTop: 2 }}>
            Manage daily medicines, vitamins, routines, and custom alarm alerts
          </p>
        </div>
        <button
          onClick={() => onOpenAddReminder()}
          className="btn btn-primary"
          style={{ padding: '9px 18px', fontSize: '13px', borderRadius: 20 }}
        >
          <Plus size={16} />
          Add Reminder
        </button>
      </div>

      {/* Daily Adherence Banner */}
      {totalDueToday > 0 && (
        <div
          className="card card-cream"
          style={{
            padding: '16px 20px',
            marginBottom: 20,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: 14,
            border: '1px solid #EFE8DE'
          }}
        >
          <div style={{ flex: '1 1 240px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
              <span style={{ fontSize: '13px', fontWeight: 700, color: '#30282B' }}>
                Today's Adherence
              </span>
              <span style={{ fontSize: '13px', fontWeight: 700, color: '#6F3347' }}>
                {takenCount} of {totalDueToday} taken ({adherencePercent}%)
              </span>
            </div>
            <div style={{ height: 8, backgroundColor: '#EFE8DE', borderRadius: 10, overflow: 'hidden' }}>
              <div
                style={{
                  height: '100%',
                  width: `${adherencePercent}%`,
                  background: 'linear-gradient(90deg, #D99AA6 0%, #6F3347 100%)',
                  borderRadius: 10,
                  transition: 'width 0.5s ease'
                }}
              />
            </div>
          </div>
          <div style={{ fontSize: '12px', color: '#81777B' }}>
            {adherencePercent === 100 && takenCount > 0 ? '✨ Great job, all scheduled doses taken!' : 'Keep your routine consistent.'}
          </div>
        </div>
      )}

      {/* Filter Tabs */}
      <div
        style={{
          display: 'flex',
          gap: 8,
          marginBottom: 20,
          overflowX: 'auto',
          paddingBottom: 4,
          scrollbarWidth: 'none'
        }}
      >
        {[
          { id: 'all', label: `All (${reminders.length})` },
          { id: 'today', label: `Active (${enabledReminders.length})` },
          { id: 'completed', label: `Taken Today (${todayTakenLogs.length})` },
          { id: 'paused', label: `Paused (${pausedReminders.length})` }
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            style={{
              padding: '8px 16px',
              borderRadius: 20,
              fontSize: '12px',
              fontWeight: 600,
              border: activeTab === tab.id ? '1px solid #6F3347' : '1px solid #EFE8DE',
              backgroundColor: activeTab === tab.id ? '#6F3347' : '#FFFFFF',
              color: activeTab === tab.id ? '#FFFFFF' : '#81777B',
              cursor: 'pointer',
              whiteSpace: 'nowrap',
              transition: 'all 0.18s ease',
              boxShadow: activeTab === tab.id ? 'var(--shadow-sm)' : 'none'
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Responsive Reminders Layout */}
      <div className="reminders-layout">
        {/* Left: Cards List */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>

      {/* Completed Today Section (When Completed tab is selected) */}
      {activeTab === 'completed' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {todayTakenLogs.length > 0 ? (
            todayTakenLogs.map((log) => (
              <div
                key={log.id}
                className="card"
                style={{
                  padding: '14px 16px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  backgroundColor: '#FAF7F2'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <div
                    style={{
                      width: 36,
                      height: 36,
                      borderRadius: '50%',
                      backgroundColor: '#EEF3EC',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}
                  >
                    <Check size={18} color="#4C7047" />
                  </div>
                  <div>
                    <div style={{ fontSize: '14px', fontWeight: 600, color: '#30282B' }}>
                      {log.medicineName}
                    </div>
                    <div style={{ fontSize: '12px', color: '#81777B' }}>
                      Confirmed taken at {new Date(log.actionTimestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </div>
                  </div>
                </div>
                <span style={{ fontSize: '12px', color: '#4C7047', fontWeight: 600 }}>
                  Recorded
                </span>
              </div>
            ))
          ) : (
            <div
              className="card card-cream"
              style={{ padding: '32px 16px', textAlign: 'center' }}
            >
              <CheckCircle2 size={32} color="#81777B" style={{ margin: '0 auto 10px auto' }} />
              <div style={{ fontSize: '14px', fontWeight: 600, color: '#30282B' }}>
                No Medicines Logged Yet Today
              </div>
              <p style={{ fontSize: '12px', color: '#81777B', marginTop: 4 }}>
                When you take a scheduled dose, tap "Mark as Taken" to confirm it in your daily log.
              </p>
            </div>
          )}
        </div>
      )}

      {/* Standard Reminders List (All, Today, or Paused) */}
      {activeTab !== 'completed' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {displayedReminders.length > 0 ? (
            displayedReminders.map((reminder) => {
              const nextOccur = reminderEngine.getNextOccurrence(reminder);
              const isTakenToday = reminder.lastTakenDate === todayStr;

              return (
                <div
                  key={reminder.id}
                  className="card"
                  style={{
                    padding: '16px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 12,
                    opacity: reminder.enabled ? 1 : 0.65
                  }}
                >
                  {/* Top line: Icon, Name, Enabled switch */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                      <div
                        style={{
                          width: 42,
                          height: 42,
                          borderRadius: 14,
                          backgroundColor: reminder.reminderType === 'alarm' ? '#FAF0F2' : '#F4F1FA',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center'
                        }}
                      >
                        <Bell
                          size={20}
                          color={reminder.reminderType === 'alarm' ? '#6F3347' : '#5E4A7D'}
                        />
                      </div>
                      <div>
                        <div style={{ fontSize: '15px', fontWeight: 600, color: '#30282B' }}>
                          {reminder.name}
                        </div>
                        {reminder.description && (
                          <div style={{ fontSize: '12px', color: '#81777B', marginTop: 1 }}>
                            {reminder.description}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Enable/Pause Toggle */}
                    <label className="toggle-switch" title={reminder.enabled ? 'Pause reminder' : 'Resume reminder'}>
                      <input
                        type="checkbox"
                        checked={reminder.enabled}
                        onChange={(e) => onToggleReminder(reminder.id!, e.target.checked)}
                      />
                      <span className="toggle-slider" />
                    </label>
                  </div>

                  {/* Schedule Details Row */}
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '8px 12px',
                      backgroundColor: '#FAF7F2',
                      borderRadius: 10,
                      fontSize: '12px',
                      color: '#81777B'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <Clock size={13} color="#6F3347" />
                      <span style={{ fontWeight: 600, color: '#30282B' }}>
                        {reminderEngine.formatTime12h(reminder.time)}
                      </span>
                      <span>• {formatFrequencyLabel(reminder.frequency, reminder.selectedDays)}</span>
                    </div>

                    <span
                      style={{
                        padding: '2px 8px',
                        borderRadius: 10,
                        backgroundColor: reminder.reminderType === 'alarm' ? '#F2D8DC' : '#EAE6F5',
                        color: reminder.reminderType === 'alarm' ? '#6F3347' : '#5E4A7D',
                        fontSize: '11px',
                        fontWeight: 600
                      }}
                    >
                      {reminder.reminderType === 'alarm' ? 'Alarm' : 'Notification'}
                    </span>
                  </div>

                  {/* Bottom Action Bar */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: 4 }}>
                    <div style={{ fontSize: '12px', color: '#81777B' }}>
                      Next: <strong style={{ color: '#6F3347' }}>{nextOccur.display}</strong>
                    </div>

                    <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                      {/* Alarm simulation preview */}
                      <button
                        onClick={() => onSimulateAlarm(reminder)}
                        className="btn-soft"
                        title="Test Alarm Experience"
                        style={{ padding: '6px 10px', fontSize: '11px', borderRadius: 12, border: 'none', cursor: 'pointer' }}
                      >
                        Test Alert
                      </button>

                      {/* Edit Button */}
                      <button
                        onClick={() => onOpenAddReminder(reminder)}
                        className="btn-icon"
                        title="Edit reminder"
                        style={{ width: 32, height: 32 }}
                      >
                        <Edit3 size={14} color="#6F3347" />
                      </button>

                      {/* Delete Button */}
                      <button
                        onClick={async () => {
                          if (window.confirm(`Delete reminder for "${reminder.name}"?`)) {
                            await onDeleteReminder(reminder.id!);
                          }
                        }}
                        className="btn-icon"
                        title="Delete reminder"
                        style={{ width: 32, height: 32 }}
                      >
                        <Trash2 size={14} color="#C0394B" />
                      </button>

                      {/* Mark Taken Button */}
                      <button
                        onClick={() => onMarkTaken(reminder)}
                        className={`btn ${isTakenToday ? 'btn-secondary' : 'btn-primary'}`}
                        style={{ padding: '6px 12px', fontSize: '12px', borderRadius: 16 }}
                      >
                        <Check size={14} />
                        {isTakenToday ? 'Taken' : 'Mark Taken'}
                      </button>
                    </div>
                  </div>
                </div>
              );
            })
          ) : (
            <div
              className="card card-cream"
              style={{ padding: '36px 20px', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center' }}
            >
              <div
                style={{
                  width: 56,
                  height: 56,
                  borderRadius: '50%',
                  backgroundColor: '#FAF0F2',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginBottom: 14
                }}
              >
                <Bell size={26} color="#6F3347" />
              </div>
              <h2 style={{ fontSize: '17px', color: '#30282B', marginBottom: 6 }}>
                No Reminders in this View
              </h2>
              <p style={{ fontSize: '13px', color: '#81777B', maxWidth: '280px', marginBottom: 16 }}>
                Keep your health routines consistent by creating regular tablet or supplement notifications.
              </p>
              <button
                onClick={() => onOpenAddReminder()}
                className="btn btn-primary"
                style={{ padding: '9px 18px', fontSize: '13px' }}
              >
                Add Medicine Reminder
              </button>
            </div>
          )}
        </div>
      )}
      </div>

      {/* Right Column: Contextual Overview & Stats */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        <div className="card" style={{ padding: '22px' }}>
          <h2 style={{ fontSize: '16px', color: '#30282B', fontWeight: 700, marginBottom: 14 }}>
            Reminders Summary
          </h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10, textAlign: 'center' }}>
            <div style={{ padding: '12px 6px', backgroundColor: '#FAF7F2', borderRadius: 12, border: '1px solid #EFE8DE' }}>
              <div style={{ fontSize: '20px', fontWeight: 700, color: '#6F3347' }}>{enabledReminders.length}</div>
              <div style={{ fontSize: '11px', color: '#81777B', marginTop: 2 }}>Active</div>
            </div>
            <div style={{ padding: '12px 6px', backgroundColor: '#EEF3EC', borderRadius: 12, border: '1px solid #D2E2CE' }}>
              <div style={{ fontSize: '20px', fontWeight: 700, color: '#4C7047' }}>{todayTakenLogs.length}</div>
              <div style={{ fontSize: '11px', color: '#4C7047', marginTop: 2 }}>Taken</div>
            </div>
            <div style={{ padding: '12px 6px', backgroundColor: '#FAF7F2', borderRadius: 12, border: '1px solid #EFE8DE' }}>
              <div style={{ fontSize: '20px', fontWeight: 700, color: '#81777B' }}>{pausedReminders.length}</div>
              <div style={{ fontSize: '11px', color: '#81777B', marginTop: 2 }}>Paused</div>
            </div>
          </div>

          <div style={{ marginTop: 18, paddingTop: 14, borderTop: '1px solid #EFE8DE' }}>
            <div style={{ fontSize: '12px', color: '#81777B', lineHeight: 1.5 }}>
              CycleCare ensures medicine reminders operate locally and privately. Reminders distinguish dismissing an alert from confirming medicine was taken.
            </div>
            <button
              onClick={() => onOpenAddReminder()}
              className="btn btn-primary"
              style={{ width: '100%', marginTop: 14, fontSize: '13px', padding: '10px' }}
            >
              + Add New Reminder
            </button>
          </div>
        </div>

        <div className="card card-cream" style={{ padding: '18px' }}>
          <div style={{ fontSize: '13px', fontWeight: 700, color: '#6F3347', marginBottom: 4 }}>
            💡 Tip: Exact Android Alarms
          </div>
          <div style={{ fontSize: '12px', color: '#81777B', lineHeight: 1.45 }}>
            To guarantee alarms sound when your screen is locked on Android, disable battery optimization for CycleCare in device settings.
          </div>
        </div>
      </div>
    </div>
  </div>
);
};
