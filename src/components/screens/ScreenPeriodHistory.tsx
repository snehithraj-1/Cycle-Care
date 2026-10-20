import React, { useState } from 'react';
import {
  Calendar,
  Plus,
  Trash2,
  Edit3,
  Check,
  AlertCircle,
  Clock,
  ArrowRight,
  ChevronLeft,
  Sparkles,
  Info
} from 'lucide-react';
import type { PeriodEntry, CycleStats, UserProfile } from '../../types';
import {
  validatePeriodStartDate,
  getTodayDateStr,
  diffDays
} from '../../services/cycleEngine';

interface ScreenPeriodHistoryProps {
  periods: PeriodEntry[];
  stats: CycleStats;
  profile?: UserProfile;
  onAddPeriod: (entry: Omit<PeriodEntry, 'id' | 'createdAt'>) => Promise<void>;
  onUpdatePeriod: (id: number, entry: Omit<PeriodEntry, 'id' | 'createdAt'>) => Promise<void>;
  onDeletePeriod: (id: number) => Promise<void>;
  onDone: () => void;
}

export const ScreenPeriodHistory: React.FC<ScreenPeriodHistoryProps> = ({
  periods,
  stats,
  profile,
  onAddPeriod,
  onUpdatePeriod,
  onDeletePeriod,
  onDone
}) => {
  const [newStartDate, setNewStartDate] = useState<string>('');
  const [newFlowLevel, setNewFlowLevel] = useState<PeriodEntry['flowLevel']>('medium');
  const [newIsApproximate, setNewIsApproximate] = useState<boolean>(false);
  const [newNotes, setNewNotes] = useState<string>('');
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [successMessage, setSuccessMessage] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  // Editing state for an existing record
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editStartDate, setEditStartDate] = useState<string>('');
  const [editFlowLevel, setEditFlowLevel] = useState<PeriodEntry['flowLevel']>('medium');
  const [editIsApproximate, setEditIsApproximate] = useState<boolean>(false);
  const [editNotes, setEditNotes] = useState<string>('');

  // Sort periods newest first for display
  const sortedDisplayPeriods = [...periods].sort((a, b) => b.startDate.localeCompare(a.startDate));

  const handleAddNewEntry = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');
    setSuccessMessage('');

    const validation = validatePeriodStartDate(newStartDate, periods);
    if (!validation.valid) {
      setErrorMessage(validation.error || 'Invalid start date.');
      return;
    }

    setIsSubmitting(true);
    try {
      await onAddPeriod({
        startDate: newStartDate,
        flowLevel: newFlowLevel,
        isApproximate: newIsApproximate,
        notes: newNotes.trim() || undefined
      });
      setSuccessMessage(`Period starting ${newStartDate} recorded successfully.`);
      setNewStartDate('');
      setNewIsApproximate(false);
      setNewNotes('');
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (err) {
      console.error('Failed to add period:', err);
      setErrorMessage('Failed to save period date. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleStartEdit = (entry: PeriodEntry) => {
    setEditingId(entry.id!);
    setEditStartDate(entry.startDate);
    setEditFlowLevel(entry.flowLevel);
    setEditIsApproximate(Boolean(entry.isApproximate));
    setEditNotes(entry.notes || '');
    setErrorMessage('');
  };

  const handleSaveEdit = async (id: number) => {
    setErrorMessage('');
    const validation = validatePeriodStartDate(editStartDate, periods, id);
    if (!validation.valid) {
      setErrorMessage(validation.error || 'Invalid start date.');
      return;
    }

    try {
      await onUpdatePeriod(id, {
        startDate: editStartDate,
        flowLevel: editFlowLevel,
        isApproximate: editIsApproximate,
        notes: editNotes.trim() || undefined
      });
      setEditingId(null);
      setSuccessMessage('Entry updated successfully.');
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (err) {
      console.error('Failed to update period entry:', err);
      setErrorMessage('Failed to update period. Please try again.');
    }
  };

  const formatDateDisplay = (dateStr: string) => {
    const [y, m, d] = dateStr.split('-').map(Number);
    const date = new Date(y, m - 1, d);
    return date.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
  };

  return (
    <div className="screen-container">
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 22, flexWrap: 'wrap', gap: 12 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <button
            onClick={onDone}
            className="btn-icon"
            aria-label="Back"
            style={{ width: 40, height: 40 }}
          >
            <ChevronLeft size={20} />
          </button>
          <div>
            <h1 style={{ fontSize: '26px', color: '#30282B', fontWeight: 700 }}>
              Period History
            </h1>
            <p style={{ fontSize: '13px', color: '#81777B', marginTop: 2 }}>
              Add, edit, or delete previous period start dates
            </p>
          </div>
        </div>

        <button
          onClick={onDone}
          className="btn btn-primary"
          style={{ padding: '9px 18px', fontSize: '13px', borderRadius: 20 }}
        >
          Done
        </button>
      </div>

      {/* Messages */}
      {errorMessage && (
        <div
          style={{
            padding: '12px 16px',
            backgroundColor: '#FDECEF',
            color: '#C0394B',
            borderRadius: 14,
            fontSize: '13px',
            marginBottom: 16,
            display: 'flex',
            alignItems: 'center',
            gap: 8
          }}
        >
          <AlertCircle size={16} />
          <span>{errorMessage}</span>
        </div>
      )}

      {successMessage && (
        <div
          style={{
            padding: '12px 16px',
            backgroundColor: '#EEF3EC',
            color: '#4C7047',
            borderRadius: 14,
            fontSize: '13px',
            marginBottom: 16,
            display: 'flex',
            alignItems: 'center',
            gap: 8
          }}
        >
          <Check size={16} />
          <span>{successMessage}</span>
        </div>
      )}

      {/* 2-Column Responsive Layout */}
      <div className="calendar-layout">
        {/* Left Column: Input Form & Entry List */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          {/* Add Period Form Card */}
          <div className="card" style={{ padding: '24px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
              <div
                style={{
                  width: 36,
                  height: 36,
                  borderRadius: 12,
                  backgroundColor: '#FAF0F2',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
              >
                <Plus size={18} color="#6F3347" />
              </div>
              <div>
                <h2 style={{ fontSize: '16px', color: '#30282B', fontWeight: 600 }}>
                  Add a Period Start Date
                </h2>
                <div style={{ fontSize: '12px', color: '#81777B' }}>
                  Log when each previous period began
                </div>
              </div>
            </div>

            <form onSubmit={handleAddNewEntry}>
              <div className="form-group">
                <label className="form-label" htmlFor="new-period-start">
                  Start Date <span style={{ color: '#C0394B' }}>*</span>
                </label>
                <input
                  id="new-period-start"
                  type="date"
                  className="form-input"
                  value={newStartDate}
                  onChange={(e) => setNewStartDate(e.target.value)}
                  required
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: 12 }}>
                <div className="form-group">
                  <label className="form-label" htmlFor="new-period-flow">Flow</label>
                  <select
                    id="new-period-flow"
                    className="form-select"
                    value={newFlowLevel}
                    onChange={(e) => setNewFlowLevel(e.target.value as any)}
                  >
                    <option value="light">Light</option>
                    <option value="medium">Medium</option>
                    <option value="heavy">Heavy</option>
                    <option value="spotting">Spotting</option>
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label" htmlFor="new-period-note">Notes</label>
                  <input
                    id="new-period-note"
                    type="text"
                    className="form-input"
                    placeholder="e.g. Cramps"
                    value={newNotes}
                    onChange={(e) => setNewNotes(e.target.value)}
                  />
                </div>
              </div>

              {/* Approximate Date Toggle */}
              <label
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  fontSize: '13px',
                  color: '#6F3347',
                  cursor: 'pointer',
                  margin: '8px 0 12px 0'
                }}
              >
                <input
                  type="checkbox"
                  checked={newIsApproximate}
                  onChange={(e) => setNewIsApproximate(e.target.checked)}
                  style={{ accentColor: '#6F3347' }}
                />
                <span>I remember this date approximately (~ Approx)</span>
              </label>

              <button
                type="submit"
                disabled={isSubmitting || !newStartDate}
                className="btn btn-primary"
                style={{ width: '100%', marginTop: 8 }}
              >
                <Plus size={16} />
                {isSubmitting ? 'Recording...' : 'Add Period Start Date'}
              </button>
            </form>
          </div>

          {/* Historical Periods Recorded List */}
          <div className="card" style={{ padding: '24px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <Calendar size={18} color="#6F3347" />
                <h2 style={{ fontSize: '16px', color: '#30282B', fontWeight: 600 }}>
                  Recorded Entries ({periods.length})
                </h2>
              </div>
              <span style={{ fontSize: '12px', color: '#81777B' }}>
                Sorted chronologically
              </span>
            </div>

            {sortedDisplayPeriods.length > 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {sortedDisplayPeriods.map((entry, idx) => {
                  const isBeingEdited = editingId === entry.id;

                  // Find previous chronological entry to compute cycle length interval
                  const sortedChrono = [...periods].sort((a, b) => a.startDate.localeCompare(b.startDate));
                  const chronoIndex = sortedChrono.findIndex((p) => p.id === entry.id);
                  const prevChrono = chronoIndex > 0 ? sortedChrono[chronoIndex - 1] : null;
                  const cycleInterval = prevChrono ? diffDays(prevChrono.startDate, entry.startDate) : null;

                  return (
                    <div
                      key={entry.id}
                      style={{
                        padding: '14px 16px',
                        backgroundColor: '#FAF7F2',
                        borderRadius: 14,
                        border: '1px solid #EFE8DE',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: 8
                      }}
                    >
                      {isBeingEdited ? (
                        /* Editing Form */
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                          <div style={{ fontSize: '12px', fontWeight: 700, color: '#6F3347' }}>
                            Edit Entry
                          </div>
                          <input
                            type="date"
                            className="form-input"
                            value={editStartDate}
                            onChange={(e) => setEditStartDate(e.target.value)}
                            required
                          />
                          <div style={{ display: 'flex', gap: 8 }}>
                            <select
                              className="form-select"
                              value={editFlowLevel}
                              onChange={(e) => setEditFlowLevel(e.target.value as any)}
                            >
                              <option value="light">Light</option>
                              <option value="medium">Medium</option>
                              <option value="heavy">Heavy</option>
                              <option value="spotting">Spotting</option>
                            </select>
                            <input
                              type="text"
                              className="form-input"
                              placeholder="Notes"
                              value={editNotes}
                              onChange={(e) => setEditNotes(e.target.value)}
                            />
                          </div>
                          <label
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: 6,
                              fontSize: '12px',
                              color: '#6F3347',
                              cursor: 'pointer'
                            }}
                          >
                            <input
                              type="checkbox"
                              checked={editIsApproximate}
                              onChange={(e) => setEditIsApproximate(e.target.checked)}
                              style={{ accentColor: '#6F3347' }}
                            />
                            <span>Approximate date (~ Approx)</span>
                          </label>
                          <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', marginTop: 4 }}>
                            <button
                              type="button"
                              onClick={() => setEditingId(null)}
                              className="btn btn-secondary"
                              style={{ padding: '6px 12px', fontSize: '12px' }}
                            >
                              Cancel
                            </button>
                            <button
                              type="button"
                              onClick={() => handleSaveEdit(entry.id!)}
                              className="btn btn-primary"
                              style={{ padding: '6px 14px', fontSize: '12px' }}
                            >
                              Save Changes
                            </button>
                          </div>
                        </div>
                      ) : (
                        /* Read-only entry row */
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                              <span style={{ fontSize: '15px', fontWeight: 700, color: '#30282B' }}>
                                {formatDateDisplay(entry.startDate)}
                              </span>
                              {entry.isApproximate && (
                                <span
                                  style={{
                                    fontSize: '11px',
                                    fontWeight: 600,
                                    color: '#6F3347',
                                    backgroundColor: '#FAF0F2',
                                    padding: '2px 8px',
                                    borderRadius: 8,
                                    border: '1px solid #EFE8DE'
                                  }}
                                >
                                  ~ Approx
                                </span>
                              )}
                            </div>
                            <div style={{ fontSize: '12px', color: '#81777B', display: 'flex', alignItems: 'center', gap: 8, marginTop: 2 }}>
                              <span style={{ textTransform: 'capitalize' }}>{entry.flowLevel} flow</span>
                              {cycleInterval && (
                                <span style={{ fontWeight: 600, color: '#6F3347' }}>
                                  • {cycleInterval} days cycle
                                </span>
                              )}
                              {entry.notes && (
                                <span style={{ fontStyle: 'italic' }}>"{entry.notes}"</span>
                              )}
                            </div>
                          </div>

                          <div style={{ display: 'flex', gap: 6 }}>
                            <button
                              onClick={() => handleStartEdit(entry)}
                              className="btn-icon"
                              title="Edit date"
                              style={{ width: 32, height: 32 }}
                            >
                              <Edit3 size={14} color="#6F3347" />
                            </button>
                            <button
                              onClick={async () => {
                                if (window.confirm(`Delete recorded period from ${entry.startDate}?`)) {
                                  await onDeletePeriod(entry.id!);
                                }
                              }}
                              className="btn-icon"
                              title="Delete entry"
                              style={{ width: 32, height: 32 }}
                            >
                              <Trash2 size={14} color="#C0394B" />
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            ) : (
              <div style={{ textAlign: 'center', padding: '24px 16px', color: '#81777B', fontSize: '13px' }}>
                <Calendar size={32} color="#D99AA6" style={{ margin: '0 auto 10px auto', opacity: 0.8 }} />
                <div style={{ fontWeight: 600, color: '#30282B', marginBottom: 4 }}>
                  No Historical Periods Recorded
                </div>
                <p>Add at least one period start date above to generate predictions.</p>
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Prediction Engine Calculation Insight */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          {/* Prediction Status Card */}
          <div className="card card-rose" style={{ padding: '24px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
              <Sparkles size={18} color="#6F3347" />
              <h2 style={{ fontSize: '16px', color: '#30282B', fontWeight: 700 }}>
                Prediction Calculation
              </h2>
            </div>

            {stats.status === 'multiple_dates' ? (
              <div>
                <div style={{ fontSize: '13px', color: '#81777B', textTransform: 'uppercase', fontWeight: 700, letterSpacing: '0.6px' }}>
                  Next Predicted Period
                </div>
                <div
                  style={{
                    fontFamily: "'Playfair Display', serif",
                    fontSize: '28px',
                    fontWeight: 700,
                    color: '#6F3347',
                    margin: '6px 0 10px 0'
                  }}
                >
                  {stats.nextPeriodStartDate ? formatDateDisplay(stats.nextPeriodStartDate) : 'Estimating...'}
                </div>

                <div style={{ padding: '12px 14px', backgroundColor: 'rgba(255, 255, 255, 0.85)', borderRadius: 12, border: '1px solid #EFE8DE', marginBottom: 14 }}>
                  <div style={{ fontSize: '13px', fontWeight: 600, color: '#30282B', marginBottom: 4 }}>
                    How it was calculated:
                  </div>
                  <p style={{ fontSize: '12px', color: '#81777B', lineHeight: 1.5 }}>
                    {stats.explanationText}
                  </p>
                </div>

                {stats.isSubstantiallyVariable && (
                  <div
                    style={{
                      padding: '10px 12px',
                      backgroundColor: '#FFF5F5',
                      border: '1px solid #FFD1D1',
                      borderRadius: 12,
                      fontSize: '12px',
                      color: '#C0394B',
                      marginBottom: 12
                    }}
                  >
                    ⚠️ <strong>Substantial cycle variation:</strong> Cycles vary by ±{stats.cycleVariation} days. Predictions may be less reliable.
                  </div>
                )}

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, textAlign: 'center' }}>
                  <div style={{ padding: '10px', backgroundColor: '#FFFFFF', borderRadius: 12, border: '1px solid #EFE8DE' }}>
                    <div style={{ fontSize: '18px', fontWeight: 700, color: '#6F3347' }}>
                      {stats.averageCycleLength} days
                    </div>
                    <div style={{ fontSize: '11px', color: '#81777B' }}>Median Cycle Length</div>
                  </div>
                  <div style={{ padding: '10px', backgroundColor: '#FFFFFF', borderRadius: 12, border: '1px solid #EFE8DE' }}>
                    <div style={{ fontSize: '18px', fontWeight: 700, color: '#6F3347' }}>
                      {stats.totalCyclesRecorded}
                    </div>
                    <div style={{ fontSize: '11px', color: '#81777B' }}>Observed Intervals</div>
                  </div>
                </div>
              </div>
            ) : stats.status === 'single_date' ? (
              <div>
                <div style={{ fontSize: '13px', color: '#81777B', textTransform: 'uppercase', fontWeight: 700, letterSpacing: '0.6px' }}>
                  First Period Date Saved
                </div>
                <div
                  style={{
                    fontFamily: "'Playfair Display', serif",
                    fontSize: '24px',
                    fontWeight: 700,
                    color: '#6F3347',
                    margin: '6px 0 10px 0'
                  }}
                >
                  {stats.lastPeriodStartDate ? formatDateDisplay(stats.lastPeriodStartDate) : ''}
                </div>

                <div style={{ padding: '12px 14px', backgroundColor: 'rgba(255, 255, 255, 0.85)', borderRadius: 12, border: '1px solid #EFE8DE', marginBottom: 14 }}>
                  <div style={{ fontSize: '13px', fontWeight: 600, color: '#30282B', marginBottom: 4 }}>
                    Observed Length Status:
                  </div>
                  <p style={{ fontSize: '12px', color: '#81777B', lineHeight: 1.5 }}>
                    {stats.explanationText}
                  </p>
                </div>

                <div style={{ textAlign: 'center', padding: '10px', backgroundColor: '#FFFFFF', borderRadius: 12, border: '1px solid #EFE8DE' }}>
                  <div style={{ fontSize: '14px', fontWeight: 600, color: '#6F3347' }}>
                    Cycle Day {stats.currentCycleDay}
                  </div>
                  <div style={{ fontSize: '11px', color: '#81777B', marginTop: 2 }}>
                    Record your next period when it begins to calculate observed cycle length.
                  </div>
                </div>
              </div>
            ) : (
              <div style={{ textAlign: 'center', padding: '16px 0', color: '#81777B', fontSize: '13px' }}>
                <p>No start dates recorded yet.</p>
                <p style={{ marginTop: 6, fontSize: '12px' }}>
                  Add your previous period start dates to calculate your natural rhythm without fabricated data.
                </p>
              </div>
            )}
          </div>

          {/* Clinical Rules Notice */}
          <div className="card card-cream" style={{ padding: '20px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
              <Info size={16} color="#6F3347" />
              <span style={{ fontSize: '13px', fontWeight: 700, color: '#6F3347' }}>
                Cycle Prediction Rules
              </span>
            </div>
            <ul style={{ fontSize: '12px', color: '#81777B', paddingLeft: 18, lineHeight: 1.6, display: 'flex', flexDirection: 'column', gap: 4 }}>
              <li>Cycle lengths are calculated strictly from start date to start date.</li>
              <li>When multiple cycles exist, the median interval is used to minimize outlier distortion.</li>
              <li>Predictions are statistical estimates; dates may vary with stress and sleep.</li>
              <li>Data is saved locally on your device and remains completely private.</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};
