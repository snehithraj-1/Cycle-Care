import React, { useState } from 'react';
import { ChevronLeft, ChevronRight, PlusCircle, Edit3, Trash2, Info } from 'lucide-react';
import type { PeriodEntry, CycleStats } from '../../types';
import { formatDateParts, parseDateParts, getTodayDateStr, getDateCycleClassification } from '../../services/cycleEngine';

interface Screen04PeriodCalendarProps {
  periods: PeriodEntry[];
  stats: CycleStats;
  onOpenLogPeriod: (prefillDate?: string, existingEntry?: PeriodEntry) => void;
  onDeletePeriod: (id: number) => void;
}

export const Screen04PeriodCalendar: React.FC<Screen04PeriodCalendarProps> = ({
  periods,
  stats,
  onOpenLogPeriod,
  onDeletePeriod
}) => {
  const todayStr = getTodayDateStr();
  const { year: currentYear, month: currentMonth } = parseDateParts(todayStr);

  const [viewYear, setViewYear] = useState<number>(currentYear);
  const [viewMonth, setViewMonth] = useState<number>(currentMonth); // 1-indexed
  const [selectedDateStr, setSelectedDateStr] = useState<string>(todayStr);

  const handlePrevMonth = () => {
    if (viewMonth === 1) {
      setViewYear(viewYear - 1);
      setViewMonth(12);
    } else {
      setViewMonth(viewMonth - 1);
    }
  };

  const handleNextMonth = () => {
    if (viewMonth === 12) {
      setViewYear(viewYear + 1);
      setViewMonth(1);
    } else {
      setViewMonth(viewMonth + 1);
    }
  };

  // Month title: "October 2026"
  const monthDate = new Date(viewYear, viewMonth - 1, 1);
  const monthName = monthDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });

  // Generate grid cells for calendar month
  // 1. First day of month (0 = Sun, 1 = Mon ... 6 = Sat)
  const firstDayOfWeek = new Date(viewYear, viewMonth - 1, 1).getDay();
  // 2. Days in current month
  const daysInMonth = new Date(viewYear, viewMonth, 0).getDate();
  // 3. Days in previous month for leading padding
  const daysInPrevMonth = new Date(viewYear, viewMonth - 1, 0).getDate();

  const calendarDays = [];

  // Previous month trailing days
  for (let i = firstDayOfWeek - 1; i >= 0; i--) {
    const day = daysInPrevMonth - i;
    const prevMonthNum = viewMonth === 1 ? 12 : viewMonth - 1;
    const prevYearNum = viewMonth === 1 ? viewYear - 1 : viewYear;
    const dateStr = formatDateParts(prevYearNum, prevMonthNum, day);
    calendarDays.push({
      day,
      dateStr,
      isCurrentMonth: false
    });
  }

  // Current month days
  for (let d = 1; d <= daysInMonth; d++) {
    const dateStr = formatDateParts(viewYear, viewMonth, d);
    calendarDays.push({
      day: d,
      dateStr,
      isCurrentMonth: true
    });
  }

  // Next month leading days to complete row (up to multiple of 7)
  const remainingCells = 7 - (calendarDays.length % 7);
  if (remainingCells < 7) {
    for (let d = 1; d <= remainingCells; d++) {
      const nextMonthNum = viewMonth === 12 ? 1 : viewMonth + 1;
      const nextYearNum = viewMonth === 12 ? viewYear + 1 : viewYear;
      const dateStr = formatDateParts(nextYearNum, nextMonthNum, d);
      calendarDays.push({
        day: d,
        dateStr,
        isCurrentMonth: false
      });
    }
  }

  // Selected date classification & details
  const selectedClassification = getDateCycleClassification(selectedDateStr, periods, stats);
  const selectedDateParts = parseDateParts(selectedDateStr);
  const formattedSelected = new Date(
    selectedDateParts.year,
    selectedDateParts.month - 1,
    selectedDateParts.day
  ).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' });

  const handleJumpToToday = () => {
    setViewYear(currentYear);
    setViewMonth(currentMonth);
    setSelectedDateStr(todayStr);
  };

  return (
    <div className="screen-container">
      {/* Screen Title */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20, flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h1 style={{ fontSize: '26px', color: '#30282B', fontWeight: 700 }}>
            Period Calendar
          </h1>
          <p style={{ fontSize: '13px', color: '#81777B', marginTop: 2 }}>
            Track your cycle patterns, view logged entries, and inspect upcoming estimates
          </p>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button
            onClick={handleJumpToToday}
            className="btn btn-secondary"
            style={{ padding: '8px 14px', fontSize: '12px', borderRadius: 20 }}
          >
            Today
          </button>
          <button
            onClick={() => onOpenLogPeriod(selectedDateStr)}
            className="btn btn-primary"
            style={{ padding: '8px 16px', fontSize: '13px', borderRadius: 20 }}
          >
            <PlusCircle size={15} />
            Log Period
          </button>
        </div>
      </div>

      {/* Responsive Calendar Layout */}
      <div className="calendar-layout">
        {/* Calendar Card Container */}
        <div className="card" style={{ padding: '24px 20px', marginBottom: 0 }}>
          {/* Month Navigation */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
            <button
              onClick={handlePrevMonth}
              className="btn-icon"
              aria-label="Previous Month"
              style={{ width: 38, height: 38 }}
            >
              <ChevronLeft size={18} />
            </button>
            <div style={{ textAlign: 'center' }}>
              <h2 style={{ fontSize: '18px', color: '#6F3347', fontWeight: 700 }}>
                {monthName}
              </h2>
            </div>
            <button
              onClick={handleNextMonth}
              className="btn-icon"
              aria-label="Next Month"
              style={{ width: 38, height: 38 }}
            >
              <ChevronRight size={18} />
            </button>
          </div>

          {/* Days of week header */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(7, 1fr)',
              textAlign: 'center',
              fontSize: '11px',
              fontWeight: 700,
              color: '#81777B',
              textTransform: 'uppercase',
              letterSpacing: '0.6px',
              marginBottom: 10
            }}
          >
            <span>Sun</span>
            <span>Mon</span>
            <span>Tue</span>
            <span>Wed</span>
            <span>Thu</span>
            <span>Fri</span>
            <span>Sat</span>
          </div>

          {/* Days Grid */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '6px' }}>
            {calendarDays.map((cell) => {
              const classInfo = getDateCycleClassification(cell.dateStr, periods, stats);
              const isSelected = cell.dateStr === selectedDateStr;
              const isToday = cell.dateStr === todayStr;

              // Styles based on classification
              let cellBg = 'transparent';
              let cellBorder = '1px solid transparent';
              let textColor = cell.isCurrentMonth ? '#30282B' : '#C4BCBE';
              let dotColor: string | null = null;
              let isPeriod = false;

              if (classInfo.isLoggedPeriod) {
                cellBg = 'linear-gradient(135deg, #F2D8DC 0%, #FADCE1 100%)';
                textColor = '#6F3347';
                dotColor = '#6F3347';
                isPeriod = true;
              } else if (classInfo.isPredictedPeriod) {
                cellBg = '#FAF0F2';
                cellBorder = '1px dashed #D99AA6';
                textColor = '#6F3347';
                dotColor = '#D99AA6';
              }

              if (isSelected) {
                cellBorder = '2px solid #6F3347';
                if (!classInfo.isLoggedPeriod && !classInfo.isPredictedPeriod) {
                  cellBg = '#FFFFFF';
                }
              }

              return (
                <button
                  key={cell.dateStr}
                  onClick={() => setSelectedDateStr(cell.dateStr)}
                  style={{
                    height: 48,
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    backgroundColor: cellBg,
                    border: cellBorder,
                    borderRadius: 14,
                    cursor: 'pointer',
                    position: 'relative',
                    outline: 'none',
                    transition: 'all 0.18s ease',
                    boxShadow: isSelected ? '0 2px 10px rgba(111, 51, 71, 0.15)' : 'none'
                  }}
                >
                  <span
                    style={{
                      fontSize: '14px',
                      fontWeight: isToday || isSelected || isPeriod ? 700 : 500,
                      color: textColor
                    }}
                  >
                    {cell.day}
                  </span>

                  {/* Status Dot / Today Indicator */}
                  {isToday && (
                    <span
                      style={{
                        position: 'absolute',
                        top: 4,
                        right: 4,
                        width: 6,
                        height: 6,
                        borderRadius: '50%',
                        backgroundColor: '#6F3347'
                      }}
                      title="Today"
                    />
                  )}

                  {dotColor && !isToday && (
                    <span
                      style={{
                        width: 4,
                        height: 4,
                        borderRadius: '50%',
                        backgroundColor: dotColor,
                        marginTop: 2
                      }}
                    />
                  )}
                </button>
              );
            })}
          </div>

          {/* Legend */}
          <div
            style={{
              marginTop: 22,
              paddingTop: 16,
              borderTop: '1px solid #EFE8DE',
              display: 'flex',
              flexWrap: 'wrap',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 18,
              fontSize: '12px',
              color: '#81777B'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <span style={{ width: 14, height: 14, borderRadius: 5, backgroundColor: '#F2D8DC', border: '1px solid #D99AA6' }} />
              <span>Logged Period</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <span style={{ width: 14, height: 14, borderRadius: 5, backgroundColor: '#FAF0F2', border: '1px dashed #D99AA6' }} />
              <span>Predicted Period</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <span style={{ width: 7, height: 7, borderRadius: '50%', backgroundColor: '#6F3347' }} />
              <span>Today</span>
            </div>
          </div>
        </div>

        {/* Selected Date Inspection Card */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div className="card card-cream" style={{ padding: '24px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
              <div>
                <div style={{ fontSize: '11px', textTransform: 'uppercase', color: '#81777B', fontWeight: 700, letterSpacing: '0.6px' }}>
                  Selected Date Details
                </div>
                <h3 style={{ fontSize: '18px', color: '#30282B', marginTop: 2, fontWeight: 700 }}>
                  {formattedSelected}
                </h3>
              </div>

              {selectedClassification.isLoggedPeriod && selectedClassification.periodEntry?.id && (
                <div style={{ display: 'flex', gap: 6 }}>
                  <button
                    onClick={() => onOpenLogPeriod(selectedDateStr, selectedClassification.periodEntry)}
                    className="btn-icon"
                    title="Edit entry"
                    style={{ width: 34, height: 34 }}
                  >
                    <Edit3 size={15} color="#6F3347" />
                  </button>
                  <button
                    onClick={() => {
                      if (window.confirm('Are you sure you want to delete this period entry?')) {
                        onDeletePeriod(selectedClassification.periodEntry!.id!);
                      }
                    }}
                    className="btn-icon"
                    title="Delete entry"
                    style={{ width: 34, height: 34 }}
                  >
                    <Trash2 size={15} color="#C0394B" />
                  </button>
                </div>
              )}
            </div>

            <div style={{ marginTop: 12, fontSize: '13px', color: '#81777B', lineHeight: 1.6 }}>
              {selectedClassification.isLoggedPeriod ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 8,
                      padding: '10px 14px',
                      borderRadius: 14,
                      backgroundColor: '#FAF0F2',
                      border: '1px solid #F2D8DC',
                      color: '#6F3347',
                      fontWeight: 600
                    }}
                  >
                    <span style={{ fontSize: '16px' }}>🌸</span>
                    <span>
                      Recorded period entry • <strong>{selectedClassification.periodEntry?.flowLevel || 'medium'} flow</strong>
                    </span>
                    {selectedClassification.periodEntry?.isApproximate && (
                      <span
                        style={{
                          fontSize: '11px',
                          backgroundColor: '#FFFFFF',
                          padding: '2px 8px',
                          borderRadius: 8,
                          border: '1px solid #EFE8DE'
                        }}
                      >
                        ~ Approximate
                      </span>
                    )}
                  </div>
                  {selectedClassification.periodEntry?.notes && (
                    <div style={{ fontSize: '13px', fontStyle: 'italic', backgroundColor: '#FFFFFF', padding: '10px 14px', borderRadius: 12, border: '1px solid #EFE8DE' }}>
                      "{selectedClassification.periodEntry.notes}"
                    </div>
                  )}
                  <div style={{ display: 'flex', gap: 8, marginTop: 4 }}>
                    <button
                      onClick={() => onOpenLogPeriod(selectedDateStr, selectedClassification.periodEntry)}
                      className="btn btn-secondary"
                      style={{ padding: '8px 16px', fontSize: '12px', width: '100%' }}
                    >
                      <Edit3 size={14} />
                      Edit Log
                    </button>
                  </div>
                </div>
              ) : selectedClassification.isPredictedPeriod ? (
                <div
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 8,
                    padding: '12px 14px',
                    borderRadius: 14,
                    backgroundColor: '#FAF0F2',
                    border: '1px dashed #D99AA6',
                    color: '#6F3347'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontWeight: 700 }}>
                    <Info size={16} />
                    <span>Predicted Period Window</span>
                  </div>
                  <p style={{ fontSize: '12px', color: '#81777B', lineHeight: 1.5 }}>
                    {stats.status === 'multiple_dates'
                      ? `Estimated period window based on observed median cycle length (${stats.averageCycleLength} days). Dates naturally adjust to lifestyle & stress.`
                      : `Preliminary guide based on standard rhythm. Once your next period begins, this will update to your verified cycle length.`}
                  </p>
                  <button
                    onClick={() => onOpenLogPeriod(selectedDateStr)}
                    className="btn btn-primary"
                    style={{ padding: '8px 14px', fontSize: '12px', marginTop: 4 }}
                  >
                    <PlusCircle size={14} />
                    Started Today? Log Period
                  </button>
                </div>
              ) : (
                <div style={{ textAlign: 'center', padding: '16px 0' }}>
                  <p style={{ marginBottom: 12 }}>No period recorded for this date.</p>
                  <button
                    onClick={() => onOpenLogPeriod(selectedDateStr)}
                    className="btn btn-secondary"
                    style={{ padding: '8px 18px', fontSize: '12px' }}
                  >
                    <PlusCircle size={14} />
                    Log Period on this Date
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Quick Cycle Tip */}
          <div className="card" style={{ padding: '20px' }}>
            <h4 style={{ fontSize: '14px', color: '#6F3347', fontWeight: 700, marginBottom: 6 }}>
              📅 Calendar Tracking Tip
            </h4>
            <p style={{ fontSize: '12px', color: '#81777B', lineHeight: 1.55 }}>
              Tap any date on the calendar to inspect or adjust entries. CycleCare never sends your private cycle calendar data over the internet.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
