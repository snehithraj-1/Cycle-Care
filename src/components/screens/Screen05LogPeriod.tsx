import React, { useState, useEffect } from 'react';
import { X, Calendar, Trash2, Check } from 'lucide-react';
import type { PeriodEntry, FlowLevel } from '../../types';
import { getTodayDateStr, diffDays, addDays, validatePeriodStartDate } from '../../services/cycleEngine';

interface Screen05LogPeriodProps {
  initialDate?: string;
  existingEntry?: PeriodEntry | null;
  periods?: PeriodEntry[];
  onSave: (entry: Omit<PeriodEntry, 'id' | 'createdAt'>, existingId?: number) => Promise<void>;
  onDelete?: (id: number) => Promise<void>;
  onCancel: () => void;
}

export const Screen05LogPeriod: React.FC<Screen05LogPeriodProps> = ({
  initialDate,
  existingEntry,
  periods = [],
  onSave,
  onDelete,
  onCancel
}) => {
  const [startDate, setStartDate] = useState<string>(
    existingEntry?.startDate || initialDate || getTodayDateStr()
  );
  const [endDate, setEndDate] = useState<string>(existingEntry?.endDate || '');
  const [flowLevel, setFlowLevel] = useState<FlowLevel>(existingEntry?.flowLevel || 'medium');
  const [isApproximate, setIsApproximate] = useState<boolean>(Boolean(existingEntry?.isApproximate));
  const [notes, setNotes] = useState<string>(existingEntry?.notes || '');
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  useEffect(() => {
    if (existingEntry) {
      setStartDate(existingEntry.startDate);
      setEndDate(existingEntry.endDate || '');
      setFlowLevel(existingEntry.flowLevel);
      setIsApproximate(Boolean(existingEntry.isApproximate));
      setNotes(existingEntry.notes || '');
    }
  }, [existingEntry]);

  const handleQuickDuration = (days: number) => {
    if (startDate) {
      setEndDate(addDays(startDate, days - 1));
    }
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');

    const validation = validatePeriodStartDate(startDate, periods, existingEntry?.id);
    if (!validation.valid) {
      setErrorMessage(validation.error || 'Invalid period start date.');
      return;
    }

    if (endDate) {
      const days = diffDays(startDate, endDate);
      if (days < 0) {
        setErrorMessage('Period end date cannot be earlier than start date.');
        return;
      }
      if (days > 14) {
        setErrorMessage('Period duration exceeds 14 days. Please verify the dates entered.');
        return;
      }
    }

    setIsSubmitting(true);
    try {
      await onSave(
        {
          startDate,
          endDate: endDate || undefined,
          flowLevel,
          isApproximate,
          notes: notes.trim() || undefined
        },
        existingEntry?.id
      );
    } catch (err) {
      console.error('Failed to save period entry:', err);
      setErrorMessage('Failed to save entry. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const flowOptions: { id: FlowLevel; label: string; desc: string }[] = [
    { id: 'light', label: 'Light', desc: 'Minimal bleeding' },
    { id: 'medium', label: 'Medium', desc: 'Standard regular flow' },
    { id: 'heavy', label: 'Heavy', desc: 'Full frequent flow' },
    { id: 'spotting', label: 'Spotting', desc: 'Very light droplets' }
  ];

  return (
    <div className="modal-overlay" onClick={onCancel}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
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
              <Calendar size={18} color="#6F3347" />
            </div>
            <h2 style={{ fontSize: '20px', color: '#30282B', fontWeight: 700 }}>
              {existingEntry ? 'Edit Period Entry' : 'Log Period'}
            </h2>
          </div>
          <button
            onClick={onCancel}
            className="btn-icon"
            style={{ width: 34, height: 34 }}
            aria-label="Close"
          >
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

        <form onSubmit={handleFormSubmit}>
          {/* Start Date */}
          <div className="form-group">
            <label className="form-label" htmlFor="period-start-date">
              Start Date <span style={{ color: '#C0394B' }}>*</span>
            </label>
            <input
              id="period-start-date"
              type="date"
              className="form-input"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              required
            />
          </div>

          {/* End Date */}
          <div className="form-group">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <label className="form-label" htmlFor="period-end-date">End Date (optional)</label>
              {startDate && (
                <div style={{ display: 'flex', gap: 6 }}>
                  {[4, 5, 6].map((days) => (
                    <button
                      key={days}
                      type="button"
                      onClick={() => handleQuickDuration(days)}
                      style={{
                        background: 'none',
                        border: '1px solid #EFE8DE',
                        borderRadius: 8,
                        padding: '2px 6px',
                        fontSize: '11px',
                        color: '#6F3347',
                        cursor: 'pointer'
                      }}
                    >
                      {days}d
                    </button>
                  ))}
                </div>
              )}
            </div>
            <input
              id="period-end-date"
              type="date"
              className="form-input"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
            />
          </div>

          {/* Flow Level Selection */}
          <div className="form-group">
            <label className="form-label">Flow Intensity</label>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
              {flowOptions.map((opt) => (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => setFlowLevel(opt.id)}
                  style={{
                    padding: '10px',
                    borderRadius: 12,
                    border: flowLevel === opt.id ? '2px solid #6F3347' : '1px solid #EFE8DE',
                    backgroundColor: flowLevel === opt.id ? '#FAF0F2' : '#FFFFFF',
                    textAlign: 'left',
                    cursor: 'pointer',
                    transition: 'all 0.15s ease'
                  }}
                >
                  <div style={{ fontSize: '13px', fontWeight: 600, color: '#30282B' }}>
                    {opt.label}
                  </div>
                  <div style={{ fontSize: '11px', color: '#81777B', marginTop: 2 }}>
                    {opt.desc}
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Notes */}
          <div className="form-group">
            <label className="form-label" htmlFor="period-notes">Personal Notes (optional)</label>
            <textarea
              id="period-notes"
              className="form-textarea"
              rows={2}
              placeholder="e.g. Mild headache, took warm herbal tea..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
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
              marginBottom: 16
            }}
          >
            <input
              type="checkbox"
              checked={isApproximate}
              onChange={(e) => setIsApproximate(e.target.checked)}
              style={{ accentColor: '#6F3347' }}
            />
            <span>I remember this date approximately (~ Approx)</span>
          </label>

          {/* Actions */}
          <div style={{ display: 'flex', gap: 10, marginTop: 20 }}>
            {existingEntry?.id && onDelete && (
              <button
                type="button"
                onClick={async () => {
                  if (window.confirm('Delete this period entry? This action cannot be undone.')) {
                    await onDelete(existingEntry.id!);
                    onCancel();
                  }
                }}
                className="btn btn-secondary"
                style={{ padding: '12px', color: '#C0394B' }}
                title="Delete entry"
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
              {isSubmitting ? 'Saving...' : 'Save Period'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
