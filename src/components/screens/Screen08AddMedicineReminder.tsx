import React, { useState, useEffect } from 'react';
import { X, Bell, Clock, Volume2, Smartphone, Trash2, Check, AlertCircle } from 'lucide-react';
import type { ReminderItem, ReminderFrequency, ReminderType } from '../../types';
import { getTodayDateStr } from '../../services/cycleEngine';
import { reminderEngine } from '../../services/reminderEngine';

interface Screen08AddMedicineReminderProps {
  existingReminder?: ReminderItem | null;
  onSave: (reminder: Omit<ReminderItem, 'id' | 'createdAt'>, existingId?: number) => Promise<void>;
  onDelete?: (id: number) => Promise<void>;
  onCancel: () => void;
}

export const Screen08AddMedicineReminder: React.FC<Screen08AddMedicineReminderProps> = ({
  existingReminder,
  onSave,
  onDelete,
  onCancel
}) => {
  const [name, setName] = useState<string>(existingReminder?.name || '');
  const [description, setDescription] = useState<string>(existingReminder?.description || '');
  const [startDate, setStartDate] = useState<string>(
    existingReminder?.startDate || getTodayDateStr()
  );
  const [endDate, setEndDate] = useState<string>(existingReminder?.endDate || '');
  const [time, setTime] = useState<string>(existingReminder?.time || '09:00');
  const [frequency, setFrequency] = useState<ReminderFrequency>(
    existingReminder?.frequency || 'daily'
  );
  const [selectedDays, setSelectedDays] = useState<number[]>(
    existingReminder?.selectedDays || [1, 2, 3, 4, 5] // default weekdays
  );
  const [reminderType, setReminderType] = useState<ReminderType>(
    existingReminder?.reminderType || 'alarm'
  );
  const [sound, setSound] = useState<string>(existingReminder?.sound || 'chime');
  const [vibration, setVibration] = useState<boolean>(
    existingReminder?.vibration !== undefined ? existingReminder.vibration : true
  );
  const [snoozeMinutes, setSnoozeMinutes] = useState<number>(
    existingReminder?.snoozeMinutes || 10
  );
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [permissionState, setPermissionState] = useState<NotificationPermission | 'unsupported'>('default');

  useEffect(() => {
    setPermissionState(reminderEngine.getNotificationPermissionStatus());
  }, []);

  const handleDayToggle = (dayIndex: number) => {
    if (selectedDays.includes(dayIndex)) {
      if (selectedDays.length === 1) {
        setErrorMessage('Please select at least one day for weekly schedule.');
        return;
      }
      setSelectedDays(selectedDays.filter((d) => d !== dayIndex));
    } else {
      setSelectedDays([...selectedDays, dayIndex].sort());
      setErrorMessage('');
    }
  };

  const handlePlaySoundPreview = () => {
    reminderEngine.playChime(sound);
    if (vibration) {
      reminderEngine.vibrate([100, 50, 100]);
    }
  };

  const handleRequestPermission = async () => {
    const res = await reminderEngine.requestNotificationPermission();
    setPermissionState(res.status);
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');

    if (!name.trim()) {
      setErrorMessage('Please provide a tablet or medicine name.');
      return;
    }

    if (!time) {
      setErrorMessage('Please select a reminder time.');
      return;
    }

    if (frequency === 'selected_days' && selectedDays.length === 0) {
      setErrorMessage('Please choose at least one day of the week.');
      return;
    }

    // Request notification permission if not yet decided
    if (permissionState === 'default') {
      await handleRequestPermission();
    }

    setIsSubmitting(true);
    try {
      await onSave(
        {
          name: name.trim(),
          description: description.trim() || undefined,
          startDate,
          endDate: endDate || undefined,
          time,
          frequency,
          selectedDays: frequency === 'selected_days' ? selectedDays : undefined,
          reminderType,
          sound,
          vibration,
          snoozeMinutes,
          enabled: true
        },
        existingReminder?.id
      );
    } catch (err) {
      console.error('Failed to save reminder:', err);
      setErrorMessage('Failed to save reminder. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const weekDayLabels = [
    { idx: 0, label: 'S' },
    { idx: 1, label: 'M' },
    { idx: 2, label: 'T' },
    { idx: 3, label: 'W' },
    { idx: 4, label: 'T' },
    { idx: 5, label: 'F' },
    { idx: 6, label: 'S' }
  ];

  return (
    <div className="modal-overlay" onClick={onCancel}>
      <div
        className="modal-content"
        style={{ maxHeight: '90vh', overflowY: 'auto' }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Mobile drag handle */}
        <div style={{ width: 44, height: 4, borderRadius: 2, backgroundColor: '#E2DBD4', margin: '-8px auto 18px auto' }} />

        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div
              style={{
                width: 38,
                height: 38,
                borderRadius: '50%',
                backgroundColor: '#FAF0F2',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              <Bell size={18} color="#6F3347" />
            </div>
            <h2 style={{ fontSize: '20px', color: '#30282B', fontWeight: 700 }}>
              {existingReminder ? 'Edit Reminder' : 'Add Medicine Reminder'}
            </h2>
          </div>
          <button onClick={onCancel} className="btn-icon" style={{ width: 34, height: 34 }} aria-label="Close">
            <X size={16} />
          </button>
        </div>

        {errorMessage && (
          <div
            style={{
              padding: '10px 14px',
              backgroundColor: '#FDECEF',
              color: '#C0394B',
              borderRadius: 12,
              fontSize: '13px',
              marginBottom: 16
            }}
          >
            {errorMessage}
          </div>
        )}

        {/* Permission status prompt if denied or default */}
        {permissionState !== 'granted' && permissionState !== 'unsupported' && (
          <div
            style={{
              padding: '10px 14px',
              backgroundColor: '#FFF8E6',
              border: '1px solid #FFE0A3',
              borderRadius: 12,
              fontSize: '12px',
              color: '#8A6D3B',
              marginBottom: 16,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: 8
            }}
          >
            <div>
              <strong>Notifications {permissionState === 'denied' ? 'Disabled' : 'Pending'}:</strong> Enable system alerts for on-time reminders.
            </div>
            {permissionState === 'default' && (
              <button
                type="button"
                onClick={handleRequestPermission}
                style={{
                  padding: '4px 8px',
                  backgroundColor: '#8A6D3B',
                  color: 'white',
                  borderRadius: 6,
                  border: 'none',
                  fontSize: '11px',
                  cursor: 'pointer',
                  flexShrink: 0
                }}
              >
                Allow
              </button>
            )}
          </div>
        )}

        <form onSubmit={handleFormSubmit}>
          {/* Medicine Name */}
          <div className="form-group">
            <label className="form-label" htmlFor="med-name">
              Medicine or Tablet Name <span style={{ color: '#C0394B' }}>*</span>
            </label>
            <input
              id="med-name"
              type="text"
              className="form-input"
              placeholder="e.g. Iron & Folic Acid, Magnesium, Vitamin D"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </div>

          {/* Description */}
          <div className="form-group">
            <label className="form-label" htmlFor="med-desc">Instructions or Purpose (optional)</label>
            <input
              id="med-desc"
              type="text"
              className="form-input"
              placeholder="e.g. Take with food, drink full glass of water"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>

          {/* Time & Frequency */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div className="form-group">
              <label className="form-label" htmlFor="med-time">Time</label>
              <input
                id="med-time"
                type="time"
                className="form-input"
                value={time}
                onChange={(e) => setTime(e.target.value)}
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="med-freq">Repeat</label>
              <select
                id="med-freq"
                className="form-select"
                value={frequency}
                onChange={(e) => setFrequency(e.target.value as ReminderFrequency)}
              >
                <option value="daily">Daily</option>
                <option value="once">Once</option>
                <option value="selected_days">Selected Days</option>
              </select>
            </div>
          </div>

          {/* Day selection if selected_days */}
          {frequency === 'selected_days' && (
            <div className="form-group">
              <label className="form-label">Days of the Week</label>
              <div style={{ display: 'flex', justifyContent: 'space-between', gap: 4 }}>
                {weekDayLabels.map((day) => {
                  const isSelected = selectedDays.includes(day.idx);
                  return (
                    <button
                      key={day.idx}
                      type="button"
                      onClick={() => handleDayToggle(day.idx)}
                      style={{
                        width: 36,
                        height: 36,
                        borderRadius: '50%',
                        border: isSelected ? '1px solid #6F3347' : '1px solid #EFE8DE',
                        backgroundColor: isSelected ? '#6F3347' : '#FFFFFF',
                        color: isSelected ? '#FFFFFF' : '#30282B',
                        fontSize: '12px',
                        fontWeight: 600,
                        cursor: 'pointer',
                        transition: 'all 0.15s ease'
                      }}
                    >
                      {day.label}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Reminder Style: Notification vs Alarm */}
          <div className="form-group">
            <label className="form-label">Reminder Style</label>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
              <button
                type="button"
                onClick={() => setReminderType('alarm')}
                style={{
                  padding: '10px',
                  borderRadius: 12,
                  border: reminderType === 'alarm' ? '2px solid #6F3347' : '1px solid #EFE8DE',
                  backgroundColor: reminderType === 'alarm' ? '#FAF0F2' : '#FFFFFF',
                  textAlign: 'left',
                  cursor: 'pointer'
                }}
              >
                <div style={{ fontSize: '13px', fontWeight: 600, color: '#30282B' }}>
                  Alarm Alert
                </div>
                <div style={{ fontSize: '11px', color: '#81777B', marginTop: 2 }}>
                  Full screen sound & chime
                </div>
              </button>

              <button
                type="button"
                onClick={() => setReminderType('notification')}
                style={{
                  padding: '10px',
                  borderRadius: 12,
                  border: reminderType === 'notification' ? '2px solid #6F3347' : '1px solid #EFE8DE',
                  backgroundColor: reminderType === 'notification' ? '#F4F1FA' : '#FFFFFF',
                  textAlign: 'left',
                  cursor: 'pointer'
                }}
              >
                <div style={{ fontSize: '13px', fontWeight: 600, color: '#30282B' }}>
                  Notification
                </div>
                <div style={{ fontSize: '11px', color: '#81777B', marginTop: 2 }}>
                  Standard quiet banner
                </div>
              </button>
            </div>
          </div>

          {/* Sound & Snooze Details */}
          <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 0.8fr', gap: 12 }}>
            <div className="form-group">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <label className="form-label" htmlFor="med-sound">Sound Chime</label>
                <button
                  type="button"
                  onClick={handlePlaySoundPreview}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: '#6F3347',
                    fontSize: '11px',
                    fontWeight: 600,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 3
                  }}
                >
                  <Volume2 size={12} />
                  Preview
                </button>
              </div>
              <select
                id="med-sound"
                className="form-select"
                value={sound}
                onChange={(e) => setSound(e.target.value)}
              >
                <option value="chime">Harmonic Chime</option>
                <option value="gentle">Gentle Chord</option>
                <option value="bell">Soft Bell</option>
                <option value="marimba">Warm Marimba</option>
              </select>
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="med-snooze">Snooze</label>
              <select
                id="med-snooze"
                className="form-select"
                value={snoozeMinutes}
                onChange={(e) => setSnoozeMinutes(Number(e.target.value))}
              >
                <option value={5}>5 min</option>
                <option value={10}>10 min</option>
                <option value={15}>15 min</option>
                <option value={20}>20 min</option>
              </select>
            </div>
          </div>

          {/* Vibration Switch */}
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              padding: '8px 0 16px 0',
              borderBottom: '1px solid #EFE8DE',
              marginBottom: 16
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <Smartphone size={16} color="#6F3347" />
              <span style={{ fontSize: '13px', fontWeight: 600, color: '#30282B' }}>
                Vibration Haptic Alert
              </span>
            </div>
            <label className="toggle-switch">
              <input
                type="checkbox"
                checked={vibration}
                onChange={(e) => setVibration(e.target.checked)}
              />
              <span className="toggle-slider" />
            </label>
          </div>

          {/* Actions */}
          <div style={{ display: 'flex', gap: 10 }}>
            {existingReminder?.id && onDelete && (
              <button
                type="button"
                onClick={async () => {
                  if (window.confirm('Delete this reminder?')) {
                    await onDelete(existingReminder.id!);
                    onCancel();
                  }
                }}
                className="btn btn-secondary"
                style={{ padding: '12px', color: '#C0394B' }}
                title="Delete reminder"
              >
                <Trash2 size={16} />
              </button>
            )}

            <button
              type="button"
              onClick={onCancel}
              className="btn btn-secondary"
              style={{ flex: 1 }}
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={isSubmitting}
              className="btn btn-primary"
              style={{ flex: 2 }}
            >
              <Check size={16} />
              {isSubmitting ? 'Saving...' : 'Save Reminder'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
