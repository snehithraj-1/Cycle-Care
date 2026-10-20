import React from 'react';
import {
  Calendar as CalendarIcon,
  PlusCircle,
  Bell,
  Settings,
  ChevronRight,
  CheckCircle2,
  Clock,
  Sparkles,
  AlertCircle,
  Heart,
  Droplet,
  ShieldCheck
} from 'lucide-react';
import type { UserProfile, PeriodEntry, ReminderItem, CycleStats } from '../../types';
import { WreathCircle, FloralBranch } from '../illustrations/BotanicalDecor';
import { reminderEngine } from '../../services/reminderEngine';

interface Screen03HomeDashboardProps {
  profile?: UserProfile;
  stats: CycleStats;
  periods: PeriodEntry[];
  reminders: ReminderItem[];
  onNavigate: (screen: any) => void;
  onOpenLogPeriod: () => void;
  onOpenAddReminder: () => void;
  onMarkReminderTaken: (reminder: ReminderItem) => void;
  onTriggerAlarmTest: (reminder: ReminderItem) => void;
}

export const Screen03HomeDashboard: React.FC<Screen03HomeDashboardProps> = ({
  profile,
  stats,
  periods,
  reminders,
  onNavigate,
  onOpenLogPeriod,
  onOpenAddReminder,
  onMarkReminderTaken,
  onTriggerAlarmTest
}) => {
  const hour = new Date().getHours();
  let greeting = 'Good morning';
  if (hour >= 12 && hour < 17) greeting = 'Good afternoon';
  else if (hour >= 17) greeting = 'Good evening';

  const userName = profile?.name || 'there';

  const todayFormatted = new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'short',
    day: 'numeric'
  });

  const formatEstimatedDate = (dateStr: string | null) => {
    if (!dateStr) return '';
    const [y, m, d] = dateStr.split('-').map(Number);
    const date = new Date(y, m - 1, d);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  const cycleDay = stats.currentCycleDay || 1;
  const cycleLen = stats.averageCycleLength || 28;
  const progressRatio = Math.min(1, Math.max(0.05, cycleDay / cycleLen));

  const upcomingReminders = reminders.filter((r) => r.enabled).slice(0, 4);

  // Compute Phase info
  const getCyclePhase = (day: number, avgLen: number) => {
    if (day <= 5) {
      return {
        name: 'Menstrual Phase',
        color: '#D99AA6',
        bg: '#FBF0F2',
        border: '#F2D8DC',
        desc: 'Hormones resting at baseline. Gentle pacing, iron nourishment, and warm comfort are supportive today.'
      };
    }
    const ovulationDay = Math.round(avgLen / 2);
    if (day < ovulationDay - 2) {
      return {
        name: 'Follicular Phase',
        color: '#7B6DA8',
        bg: '#F4F1FA',
        border: '#DCD7EF',
        desc: 'Estrogen is gently ascending. You may notice rising clarity, steady focus, and creative vitality.'
      };
    }
    if (day <= ovulationDay + 2) {
      return {
        name: 'Ovulatory Window',
        color: '#5C7A52',
        bg: '#EEF3EC',
        border: '#B8C6B0',
        desc: 'Estrogen reaches peak synergy. High communicative energy and natural body rhythm balance.'
      };
    }
    return {
      name: 'Luteal Phase',
      color: '#B06F39',
      bg: '#FBF4EC',
      border: '#E8D5C4',
      desc: 'Progesterone sustains your rhythm. Restorative sleep, hydration, and mindful balance support ease.'
    };
  };

  const currentPhase = getCyclePhase(cycleDay, cycleLen);

  return (
    <div className="screen-container" style={{ position: 'relative' }}>
      {/* Decorative Botanical Foliage in corner */}
      <div style={{ position: 'absolute', top: -14, right: -10, opacity: 0.15, pointerEvents: 'none' }}>
        <FloralBranch size={170} color="#D99AA6" />
      </div>

      {/* Top Banner (Visible on all sizes) */}
      <header style={{ marginBottom: 24, zIndex: 2, position: 'relative' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 12 }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ fontSize: '12px', color: '#81777B', fontWeight: 600, letterSpacing: '0.5px', textTransform: 'uppercase' }}>
                {todayFormatted}
              </span>
              <span style={{ width: 4, height: 4, borderRadius: '50%', backgroundColor: '#D99AA6' }} />
              <span style={{ fontSize: '12px', color: '#6F3347', fontWeight: 600 }}>
                {stats.status === 'multiple_dates' || stats.status === 'single_date' ? currentPhase.name : 'Cycle Care'}
              </span>
            </div>
            <h1 style={{ fontSize: '28px', color: '#30282B', marginTop: 3, fontWeight: 700, letterSpacing: '-0.3px' }}>
              {greeting}, {userName} 🌸
            </h1>
          </div>

          {/* Quick action buttons */}
          <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
            <button
              onClick={onOpenLogPeriod}
              className="btn btn-primary"
              style={{ padding: '9px 18px', fontSize: '13px' }}
            >
              <PlusCircle size={15} />
              Log Period
            </button>
            <button
              onClick={() => onNavigate('settings')}
              className="btn-icon"
              aria-label="Settings"
            >
              <Settings size={18} color="#6F3347" />
            </button>
          </div>
        </div>
      </header>

      {/* Main Responsive Grid Layout */}
      <div className="dashboard-grid">
        {/* LEFT / MAIN COLUMN */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
          {/* CASE 1: No actual period dates available */}
          {stats.status === 'no_data' && (
            <section
              className="card card-cream"
              style={{
                padding: '40px 24px',
                textAlign: 'center',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                border: '1px solid #EFE8DE',
                boxShadow: 'var(--shadow-md)'
              }}
            >
              <div
                style={{
                  width: 72,
                  height: 72,
                  borderRadius: '50%',
                  backgroundColor: '#FAF0F2',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginBottom: 18,
                  boxShadow: '0 8px 20px rgba(217, 154, 166, 0.2)'
                }}
              >
                <CalendarIcon size={34} color="#6F3347" />
              </div>
              <h2 style={{ fontSize: '24px', color: '#30282B', marginBottom: 10, fontWeight: 700 }}>
                Track Your Next Period
              </h2>
              <p style={{ fontSize: '14px', color: '#81777B', maxWidth: 420, marginBottom: 24, lineHeight: 1.6 }}>
                No period dates recorded yet. Whenever your next period arrives, record it here to begin observing your natural rhythm. All your records stay privately in this device.
              </p>
              <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', justifyContent: 'center' }}>
                <button
                  onClick={onOpenLogPeriod}
                  className="btn btn-primary"
                  style={{ padding: '12px 26px', fontSize: '14px' }}
                >
                  <PlusCircle size={16} />
                  Log Period
                </button>
                <button
                  onClick={() => onNavigate('period-history')}
                  className="btn btn-secondary"
                  style={{ padding: '12px 22px', fontSize: '14px' }}
                >
                  Add Period History
                </button>
              </div>
              <div
                style={{
                  marginTop: 22,
                  fontSize: '12px',
                  color: '#81777B',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 6,
                  padding: '7px 16px',
                  borderRadius: 24,
                  backgroundColor: '#FFFFFF',
                  border: '1px solid #EFE8DE'
                }}
              >
                <ShieldCheck size={14} color="#6F3347" />
                <span>Zero fabricated data. Predictions activate once you record periods.</span>
              </div>
            </section>
          )}

          {/* CASE 2: Exactly one actual period start date available */}
          {stats.status === 'single_date' && (
            <section
              className="card card-rose"
              style={{
                position: 'relative',
                overflow: 'hidden',
                padding: '32px 24px',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                textAlign: 'center'
              }}
            >
              {/* Phase Chip Badge */}
              <div
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 6,
                  padding: '5px 14px',
                  borderRadius: 20,
                  backgroundColor: currentPhase.bg,
                  border: `1px solid ${currentPhase.border}`,
                  color: currentPhase.color,
                  fontSize: '12px',
                  fontWeight: 700,
                  marginBottom: 12
                }}
              >
                <Sparkles size={13} />
                <span>{currentPhase.name}</span>
              </div>

              {/* Cycle Day Ring */}
              <div style={{ position: 'relative', width: 220, height: 220, margin: '4px 0 16px 0' }}>
                <WreathCircle size={220} progress={0.4} />
                <div
                  style={{
                    position: 'absolute',
                    inset: 0,
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    textAlign: 'center'
                  }}
                >
                  <span style={{ fontSize: '12px', color: '#81777B', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.8px' }}>
                    Cycle Day
                  </span>
                  <span
                    style={{
                      fontFamily: "'Playfair Display', serif",
                      fontSize: '48px',
                      fontWeight: 700,
                      color: '#6F3347',
                      lineHeight: 1.1
                    }}
                  >
                    {stats.currentCycleDay}
                  </span>
                  <span style={{ fontSize: '12px', color: '#6F3347', fontWeight: 600 }}>
                    1st date saved
                  </span>
                </div>
              </div>

              <div style={{ width: '100%', maxWidth: 460 }}>
                <div style={{ fontSize: '19px', fontWeight: 700, color: '#30282B' }}>
                  First Period Date Saved
                </div>

                <p style={{ fontSize: '13px', color: '#81777B', marginTop: 4 }}>
                  Started on <strong>{formatEstimatedDate(stats.lastPeriodStartDate)}</strong>
                </p>

                {stats.hasApproximateDates && (
                  <div
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 5,
                      marginTop: 8,
                      padding: '4px 12px',
                      borderRadius: 14,
                      backgroundColor: '#FAF7F2',
                      border: '1px solid #EFE8DE',
                      fontSize: '11px',
                      color: '#6F3347'
                    }}
                  >
                    <Clock size={12} />
                    <span>~ Approximate date recorded</span>
                  </div>
                )}

                <div
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 6,
                    marginTop: 14,
                    padding: '14px 18px',
                    borderRadius: 18,
                    backgroundColor: 'rgba(255, 255, 255, 0.92)',
                    border: '1px solid #EFE8DE',
                    fontSize: '12px',
                    textAlign: 'center',
                    boxShadow: 'var(--shadow-xs)'
                  }}
                >
                  <div style={{ color: '#30282B', fontWeight: 600 }}>
                    {stats.explanationText}
                  </div>
                  <div style={{ color: '#81777B', fontSize: '11px', marginTop: 2 }}>
                    Another actual start date is needed to calculate your observed cycle length. Medicine reminders and all other features are fully active.
                  </div>
                </div>

                {stats.nextPeriodStartDate && (
                  <div style={{ fontSize: '12px', color: '#81777B', marginTop: 12 }}>
                    Preliminary guide: <strong>{formatEstimatedDate(stats.nextPeriodStartDate)}</strong> (will update to observed length when your next cycle begins).
                  </div>
                )}

                <button
                  onClick={onOpenLogPeriod}
                  className="btn btn-primary"
                  style={{ marginTop: 16, padding: '11px 22px', fontSize: '13px' }}
                >
                  <PlusCircle size={15} />
                  Log Next Period When It Arrives
                </button>
              </div>
            </section>
          )}

          {/* CASE 3: Two or more actual period start dates available */}
          {stats.status === 'multiple_dates' && (
            <section
              className="card card-rose"
              style={{
                position: 'relative',
                overflow: 'hidden',
                padding: '32px 24px',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                textAlign: 'center'
              }}
            >
              {/* Phase Chip Badge */}
              <div
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 6,
                  padding: '5px 14px',
                  borderRadius: 20,
                  backgroundColor: currentPhase.bg,
                  border: `1px solid ${currentPhase.border}`,
                  color: currentPhase.color,
                  fontSize: '12px',
                  fontWeight: 700,
                  marginBottom: 10
                }}
              >
                <Sparkles size={13} />
                <span>{currentPhase.name}</span>
              </div>

              {/* Circular Cycle Progress Ring with ambient glow */}
              <div style={{ position: 'relative', width: 220, height: 220, margin: '4px 0 16px 0' }}>
                <div
                  style={{
                    position: 'absolute',
                    inset: 15,
                    borderRadius: '50%',
                    backgroundColor: 'rgba(217, 154, 166, 0.12)',
                    filter: 'blur(16px)',
                    zIndex: 0
                  }}
                />
                <WreathCircle size={220} progress={progressRatio} />
                <div
                  style={{
                    position: 'absolute',
                    inset: 0,
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    textAlign: 'center',
                    zIndex: 2
                  }}
                >
                  <span style={{ fontSize: '12px', color: '#81777B', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.8px' }}>
                    Cycle Day
                  </span>
                  <span
                    style={{
                      fontFamily: "'Playfair Display', serif",
                      fontSize: '50px',
                      fontWeight: 700,
                      color: '#6F3347',
                      lineHeight: 1.1
                    }}
                  >
                    {stats.currentCycleDay}
                  </span>
                  <span style={{ fontSize: '13px', color: '#6F3347', fontWeight: 600 }}>
                    of ~{stats.averageCycleLength} days
                  </span>
                </div>
              </div>

              {/* 4-Phase Micro Progression Timeline */}
              <div style={{ width: '100%', maxWidth: 440, marginBottom: 16 }}>
                <div style={{ display: 'flex', gap: 4, height: 6, borderRadius: 10, overflow: 'hidden', backgroundColor: '#F3EDE5' }}>
                  <div style={{ flex: 5, backgroundColor: cycleDay <= 5 ? '#D99AA6' : '#E8D5C4', transition: 'all 0.3s' }} title="Menstrual: Days 1-5" />
                  <div style={{ flex: 7, backgroundColor: cycleDay > 5 && cycleDay <= 12 ? '#7B6DA8' : '#E8D5C4', transition: 'all 0.3s' }} title="Follicular: Days 6-12" />
                  <div style={{ flex: 4, backgroundColor: cycleDay > 12 && cycleDay <= 16 ? '#5C7A52' : '#E8D5C4', transition: 'all 0.3s' }} title="Ovulatory: Days 13-16" />
                  <div style={{ flex: 12, backgroundColor: cycleDay > 16 ? '#B06F39' : '#E8D5C4', transition: 'all 0.3s' }} title="Luteal: Days 17+" />
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10px', color: '#81777B', marginTop: 4, fontWeight: 600 }}>
                  <span>Menstrual</span>
                  <span>Follicular</span>
                  <span>Ovulatory</span>
                  <span>Luteal</span>
                </div>
              </div>

              {/* Prediction details */}
              <div style={{ width: '100%', maxWidth: 460 }}>
                <div style={{ fontSize: '19px', fontWeight: 700, color: '#30282B' }}>
                  {stats.daysUntilNextPeriod !== null && stats.daysUntilNextPeriod > 0 ? (
                    <>Next period estimated in <span style={{ color: '#6F3347' }}>{stats.daysUntilNextPeriod} days</span></>
                  ) : stats.daysUntilNextPeriod === 0 ? (
                    <span style={{ color: '#6F3347' }}>Period expected today</span>
                  ) : (
                    <>Next cycle estimating soon</>
                  )}
                </div>

                <p style={{ fontSize: '14px', color: '#81777B', marginTop: 4 }}>
                  Estimated start date: <strong>{formatEstimatedDate(stats.nextPeriodStartDate)}</strong>
                </p>

                {/* Badges for approximate or substantially variable dates */}
                <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: 6, marginTop: 10 }}>
                  {stats.hasApproximateDates && (
                    <div
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: 4,
                        padding: '4px 12px',
                        borderRadius: 14,
                        backgroundColor: '#FAF7F2',
                        border: '1px solid #EFE8DE',
                        fontSize: '11px',
                        color: '#6F3347'
                      }}
                    >
                      <Clock size={12} />
                      <span>~ Includes approximate historical dates</span>
                    </div>
                  )}
                  {stats.isSubstantiallyVariable && (
                    <div
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: 4,
                        padding: '4px 12px',
                        borderRadius: 14,
                        backgroundColor: '#FFF5F5',
                        border: '1px solid #FFD1D1',
                        fontSize: '11px',
                        color: '#C0394B'
                      }}
                    >
                      <AlertCircle size={12} />
                      <span>Cycles vary substantially (±{stats.cycleVariation}d)</span>
                    </div>
                  )}
                </div>

                {/* Gentle phase insight card */}
                <div
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 6,
                    marginTop: 14,
                    padding: '14px 18px',
                    borderRadius: 18,
                    backgroundColor: 'rgba(255, 255, 255, 0.92)',
                    border: '1px solid #EFE8DE',
                    fontSize: '12px',
                    textAlign: 'center',
                    boxShadow: 'var(--shadow-xs)'
                  }}
                >
                  <div style={{ color: '#30282B', fontWeight: 600 }}>
                    {currentPhase.desc}
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'center', gap: 14, color: '#81777B', fontSize: '11px', marginTop: 3 }}>
                    <span>Last period: <strong style={{ color: '#6F3347' }}>{stats.lastPeriodStartDate ? formatEstimatedDate(stats.lastPeriodStartDate) : 'None'}</strong></span>
                    <span>•</span>
                    <span>Recorded cycles: <strong style={{ color: '#6F3347' }}>{stats.totalCyclesRecorded}</strong></span>
                  </div>
                </div>

                <div
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 6,
                    marginTop: 12,
                    padding: '6px 14px',
                    borderRadius: 18,
                    backgroundColor: 'rgba(255, 255, 255, 0.75)',
                    border: '1px solid #EFE8DE',
                    fontSize: '11px',
                    color: '#81777B'
                  }}
                >
                  <AlertCircle size={13} color="#D99AA6" />
                  <span>Prediction — dates may adjust with sleep, stress, and lifestyle</span>
                </div>
              </div>
            </section>
          )}

          {/* Quick Metrics / Cycle Insights Summary */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 14 }}>
            <div className="card card-interactive" onClick={() => onNavigate('insights')} style={{ padding: '20px' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                <span style={{ fontSize: '11px', color: '#81777B', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.4px' }}>
                  Observed Cycle
                </span>
                <div style={{ width: 30, height: 30, borderRadius: 10, backgroundColor: '#FAF0F2', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Droplet size={15} color="#6F3347" />
                </div>
              </div>
              <div style={{ fontSize: '28px', fontWeight: 700, color: '#6F3347', margin: '2px 0' }}>
                {stats.averageCycleLength ? (
                  <>{stats.averageCycleLength} <span style={{ fontSize: '14px', fontWeight: 500, color: '#81777B' }}>days</span></>
                ) : (
                  <span style={{ fontSize: '20px', fontWeight: 600 }}>Observing</span>
                )}
              </div>
              <div style={{ fontSize: '12px', color: '#81777B', marginTop: 4 }}>
                {stats.status === 'multiple_dates'
                  ? (stats.isRegular ? 'Regular variation' : 'Variable interval')
                  : stats.status === 'single_date'
                  ? 'Awaiting 2nd period date'
                  : 'Awaiting first period date'}
              </div>
            </div>

            <div className="card card-interactive" onClick={() => onNavigate('period-history')} style={{ padding: '20px' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                <span style={{ fontSize: '11px', color: '#81777B', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.4px' }}>
                  Logged Periods
                </span>
                <div style={{ width: 30, height: 30, borderRadius: 10, backgroundColor: '#F4F1FA', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <CalendarIcon size={15} color="#7B6DA8" />
                </div>
              </div>
              <div style={{ fontSize: '28px', fontWeight: 700, color: '#6F3347', margin: '2px 0' }}>
                {periods.length} <span style={{ fontSize: '14px', fontWeight: 500, color: '#81777B' }}>{periods.length === 1 ? 'entry' : 'entries'}</span>
              </div>
              <div style={{ fontSize: '12px', color: '#81777B', marginTop: 4 }}>
                {periods.length >= 2 ? 'Trend chart active' : 'Log 2+ for trend chart'}
              </div>
            </div>

            <div
              onClick={() => onNavigate('insights')}
              className="card card-cream card-interactive"
              style={{ padding: '20px', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', color: '#6F3347', fontWeight: 700, fontSize: '14px' }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <Sparkles size={16} color="#6F3347" />
                  Cycle Insights
                </span>
                <ChevronRight size={16} />
              </div>
              <div style={{ fontSize: '12px', color: '#81777B', marginTop: 6, lineHeight: 1.45 }}>
                Inspect rhythm variation, phase timelines, and cycle regularity
              </div>
            </div>
          </div>
        </div>

        {/* RIGHT / CONTEXTUAL COLUMN */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          {/* Quick Actions Bar */}
          <div className="card" style={{ padding: '22px' }}>
            <h2 style={{ fontSize: '16px', color: '#30282B', marginBottom: 14, fontWeight: 700 }}>
              Quick Actions
            </h2>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10 }}>
              <button
                onClick={onOpenLogPeriod}
                className="btn btn-secondary card-interactive"
                style={{ flexDirection: 'column', padding: '14px 8px', borderRadius: 16, gap: 6, width: '100%' }}
              >
                <div style={{ width: 34, height: 34, borderRadius: 10, backgroundColor: '#FAF0F2', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Droplet size={18} color="#6F3347" />
                </div>
                <span style={{ fontSize: '11px', fontWeight: 600 }}>Log Period</span>
              </button>

              <button
                onClick={() => onNavigate('calendar')}
                className="btn btn-secondary card-interactive"
                style={{ flexDirection: 'column', padding: '14px 8px', borderRadius: 16, gap: 6, width: '100%' }}
              >
                <div style={{ width: 34, height: 34, borderRadius: 10, backgroundColor: '#F4F1FA', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <CalendarIcon size={18} color="#7B6DA8" />
                </div>
                <span style={{ fontSize: '11px', fontWeight: 600 }}>Calendar</span>
              </button>

              <button
                onClick={onOpenAddReminder}
                className="btn btn-secondary card-interactive"
                style={{ flexDirection: 'column', padding: '14px 8px', borderRadius: 16, gap: 6, width: '100%' }}
              >
                <div style={{ width: 34, height: 34, borderRadius: 10, backgroundColor: '#EEF3EC', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Bell size={18} color="#5C7A52" />
                </div>
                <span style={{ fontSize: '11px', fontWeight: 600 }}>Add Pill</span>
              </button>
            </div>
          </div>

          {/* Upcoming Reminders Card */}
          <div className="card" style={{ padding: '22px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <div style={{ width: 32, height: 32, borderRadius: 10, backgroundColor: '#FAF0F2', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Bell size={16} color="#6F3347" />
                </div>
                <div>
                  <h2 style={{ fontSize: '16px', color: '#30282B', fontWeight: 700 }}>
                    Reminders
                  </h2>
                </div>
              </div>
              <button
                onClick={() => onNavigate('reminders')}
                style={{ background: 'none', border: 'none', color: '#6F3347', fontSize: '13px', fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 2 }}
              >
                All ({reminders.length})
                <ChevronRight size={14} />
              </button>
            </div>

            {upcomingReminders.length > 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {upcomingReminders.map((reminder) => {
                  const nextOccur = reminderEngine.getNextOccurrence(reminder);
                  return (
                    <div
                      key={reminder.id}
                      style={{
                        padding: '12px 14px',
                        borderRadius: 16,
                        backgroundColor: '#FAF7F2',
                        border: '1px solid #EFE8DE',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        gap: 10,
                        transition: 'all 0.2s ease'
                      }}
                    >
                      <div style={{ minWidth: 0 }}>
                        <div style={{ fontSize: '14px', fontWeight: 700, color: '#30282B', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          {reminder.name}
                        </div>
                        <div style={{ fontSize: '12px', color: '#81777B', display: 'flex', alignItems: 'center', gap: 4, marginTop: 2 }}>
                          <Clock size={12} />
                          {nextOccur.display}
                        </div>
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0 }}>
                        <button
                          onClick={() => onTriggerAlarmTest(reminder)}
                          className="btn-soft"
                          title="Simulate alarm ring"
                          style={{ padding: '6px 10px', fontSize: '11px', borderRadius: 12, cursor: 'pointer' }}
                        >
                          Ring
                        </button>
                        <button
                          onClick={() => onMarkReminderTaken(reminder)}
                          className="btn-icon"
                          title="Mark as taken"
                          style={{ width: 34, height: 34 }}
                        >
                          <CheckCircle2 size={17} color="#6F3347" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div style={{ textAlign: 'center', padding: '20px 0', color: '#81777B', fontSize: '13px' }}>
                <p>No active reminders scheduled.</p>
                <button
                  onClick={onOpenAddReminder}
                  className="btn btn-secondary"
                  style={{ marginTop: 12, fontSize: '12px', padding: '8px 16px' }}
                >
                  + Add Reminder
                </button>
              </div>
            )}
          </div>

          {/* Daily Wellness / Rhythm Wisdom Note */}
          <div
            className="card card-cream"
            style={{
              padding: '22px',
              borderLeft: '4px solid #D99AA6'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
              <Heart size={16} color="#6F3347" />
              <span style={{ fontSize: '13px', fontWeight: 700, color: '#6F3347' }}>
                Daily Rhythm Wisdom
              </span>
            </div>
            <p style={{ fontSize: '13px', color: '#786C72', lineHeight: 1.6 }}>
              Staying hydrated, honoring regular sleep schedules, and noting gentle bodily shifts harmonize your vitality. CycleCare encrypts and keeps all your tracking local to you.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
