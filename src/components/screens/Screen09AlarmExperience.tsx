import React, { useEffect, useState } from 'react';
import { Bell, Check, Clock, Volume2, ShieldAlert, X } from 'lucide-react';
import type { ReminderItem } from '../../types';
import { reminderEngine } from '../../services/reminderEngine';

interface Screen09AlarmExperienceProps {
  reminder: ReminderItem;
  onMarkTaken: () => void;
  onSnooze: (minutes: number) => void;
  onDismiss: () => void;
}

export const Screen09AlarmExperience: React.FC<Screen09AlarmExperienceProps> = ({
  reminder,
  onMarkTaken,
  onSnooze,
  onDismiss
}) => {
  const [currentTimeStr, setCurrentTimeStr] = useState<string>('');

  // Live clock
  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setCurrentTimeStr(
        now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      );
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  // Play gentle chime on mount & trigger vibration
  useEffect(() => {
    reminderEngine.playChime(reminder.sound || 'chime');
    if (reminder.vibration) {
      reminderEngine.vibrate([300, 150, 300, 150, 600]);
    }
  }, [reminder]);

  const snoozeMins = reminder.snoozeMinutes || 10;

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: '#2C141D',
        color: '#FFFFFF',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        padding: '60px 24px 44px 24px',
        zIndex: 200,
        animation: 'fadeIn 0.3s ease'
      }}
    >
      {/* Top Header info */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: '#D99AA6', fontSize: '13px' }}>
          <Clock size={16} />
          <span>Scheduled for {reminderEngine.formatTime12h(reminder.time)}</span>
        </div>

        <button
          onClick={onDismiss}
          className="btn-icon"
          style={{ backgroundColor: 'rgba(255, 255, 255, 0.1)', borderColor: 'transparent', color: '#FFFFFF' }}
          title="Dismiss without marking taken"
          aria-label="Dismiss alert"
        >
          <X size={18} />
        </button>
      </div>

      {/* Main Alarm Content */}
      <div style={{ textAlign: 'center', margin: 'auto 0' }}>
        {/* Pulsing Bell Icon */}
        <div
          style={{
            width: 100,
            height: 100,
            borderRadius: '50%',
            backgroundColor: '#3E1D2A',
            border: '2px solid #D99AA6',
            margin: '0 auto 28px auto',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 0 32px rgba(217, 154, 166, 0.35)'
          }}
        >
          <Bell size={44} color="#F2D8DC" />
        </div>

        {/* Live Clock Display */}
        <div
          style={{
            fontFamily: "'Playfair Display', serif",
            fontSize: '52px',
            fontWeight: 700,
            color: '#FFFFFF',
            lineHeight: 1.1,
            letterSpacing: '-1px',
            marginBottom: 8
          }}
        >
          {currentTimeStr}
        </div>

        {/* Medicine Name */}
        <h1
          style={{
            fontFamily: "'Plus Jakarta Sans', sans-serif",
            fontSize: '26px',
            fontWeight: 700,
            color: '#F2D8DC',
            marginBottom: 8
          }}
        >
          {reminder.name}
        </h1>

        {reminder.description && (
          <p style={{ color: '#DCD7EF', fontSize: '15px', maxWidth: '300px', margin: '0 auto' }}>
            {reminder.description}
          </p>
        )}

        <div style={{ marginTop: 20 }}>
          <button
            onClick={() => reminderEngine.playChime(reminder.sound || 'chime')}
            style={{
              background: 'none',
              border: 'none',
              color: '#D99AA6',
              fontSize: '12px',
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: 4
            }}
          >
            <Volume2 size={14} />
            Replay Chime
          </button>
        </div>
      </div>

      {/* Primary Action Buttons */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {/* Mark As Taken Primary Button */}
        <button
          onClick={onMarkTaken}
          className="btn"
          style={{
            backgroundColor: '#D99AA6',
            color: '#2C141D',
            fontSize: '16px',
            fontWeight: 700,
            padding: '16px',
            borderRadius: '30px',
            width: '100%',
            boxShadow: '0 8px 24px rgba(217, 154, 166, 0.4)'
          }}
        >
          <Check size={20} />
          Mark as Taken
        </button>

        {/* Snooze & Dismiss Row */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          <button
            onClick={() => onSnooze(snoozeMins)}
            className="btn"
            style={{
              backgroundColor: 'rgba(255, 255, 255, 0.12)',
              color: '#FFFFFF',
              border: '1px solid rgba(255, 255, 255, 0.2)',
              borderRadius: '24px',
              padding: '12px'
            }}
          >
            Snooze ({snoozeMins}m)
          </button>

          <button
            onClick={onDismiss}
            className="btn"
            style={{
              backgroundColor: 'transparent',
              color: '#D99AA6',
              border: '1px solid rgba(217, 154, 166, 0.4)',
              borderRadius: '24px',
              padding: '12px'
            }}
          >
            Dismiss
          </button>
        </div>

        {/* Platform Notes Disclaimer */}
        <div
          style={{
            marginTop: 10,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 6,
            fontSize: '11px',
            color: 'rgba(255, 255, 255, 0.55)',
            textAlign: 'center'
          }}
        >
          <ShieldAlert size={12} />
          <span>Android exact alarms require unrestricted battery & alarm permissions.</span>
        </div>
      </div>
    </div>
  );
};
