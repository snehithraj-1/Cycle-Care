import React, { useState } from 'react';
import {
  Calendar,
  Bell,
  Heart,
  ArrowLeft,
  ArrowRight,
  Check,
  Plus,
  Trash2,
  Sparkles,
  HelpCircle,
  AlertCircle,
  Clock
} from 'lucide-react';
import { db } from '../../db';
import type { UserProfile, PeriodEntry } from '../../types';
import { isValidCalendarDate } from '../../services/cycleEngine';

interface Screen02OnboardingProps {
  onComplete: () => void;
  onSkip?: () => void;
}

type PeriodMemoryChoice = 'exact' | 'approximate' | 'dont_remember' | 'first_time';

export const Screen02Onboarding: React.FC<Screen02OnboardingProps> = ({
  onComplete,
  onSkip
}) => {
  const [step, setStep] = useState<number>(1);

  // User name
  const [name, setName] = useState<string>('');

  // Period memory choice (4 required options)
  const [memoryChoice, setMemoryChoice] = useState<PeriodMemoryChoice | null>(null);

  // Dynamic list of historical period start dates entered by user
  const [enteredDates, setEnteredDates] = useState<string[]>(['']);

  // Cycle length preference (never forced, default unknown / null)
  const [knowsCycleLength, setKnowsCycleLength] = useState<boolean>(false);
  const [cycleLength, setCycleLength] = useState<number>(28);
  const [periodLength, setPeriodLength] = useState<number>(5);

  const [dateErrors, setDateErrors] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  const handleNext = () => {
    if (step < 4) {
      setStep(step + 1);
    } else {
      handleSaveProfile();
    }
  };

  const handleBack = () => {
    if (step > 1) {
      setStep(step - 1);
    }
  };

  // Date list management
  const handleDateChange = (index: number, value: string) => {
    const updated = [...enteredDates];
    updated[index] = value;
    setEnteredDates(updated);
    setDateErrors('');
  };

  const handleAddDateInput = () => {
    setEnteredDates([...enteredDates, '']);
  };

  const handleRemoveDateInput = (index: number) => {
    if (enteredDates.length > 1) {
      const updated = enteredDates.filter((_, i) => i !== index);
      setEnteredDates(updated);
      setDateErrors('');
    }
  };

  const handleSaveProfile = async () => {
    setDateErrors('');

    // If exact or approximate was selected and user entered dates, validate them
    const filteredDates = enteredDates.map((d) => d.trim()).filter(Boolean);
    const isApproximate = memoryChoice === 'approximate';

    if (memoryChoice === 'exact' || memoryChoice === 'approximate') {
      // Validate dates
      for (const d of filteredDates) {
        if (!isValidCalendarDate(d)) {
          setDateErrors(`"${d}" is not a valid calendar date (format: YYYY-MM-DD).`);
          return;
        }
      }

      // Check duplicates among entered dates
      const uniqueDates = new Set(filteredDates);
      if (uniqueDates.size !== filteredDates.length) {
        setDateErrors('Duplicate dates detected. Please ensure each period start date is unique.');
        return;
      }
    }

    setIsSubmitting(true);
    try {
      // Determine latest period start date if any
      const sortedEntered = [...filteredDates].sort((a, b) => a.localeCompare(b));
      const latestPeriodDate = sortedEntered.length > 0 ? sortedEntered[sortedEntered.length - 1] : undefined;

      const profile: UserProfile = {
        name: name.trim() || 'Friend',
        cycleLength: knowsCycleLength ? Number(cycleLength) || 28 : null,
        periodLength: Number(periodLength) || 5,
        lastPeriodDate: latestPeriodDate,
        periodMemoryChoice: memoryChoice || undefined,
        hasCompletedOnboarding: true,
        notificationsEnabled: true,
        alarmSound: 'chime',
        vibrationEnabled: true,
        snoozeDuration: 10,
        theme: 'light',
        createdAt: new Date().toISOString()
      };

      await db.profile.clear();
      await db.profile.add(profile);

      // If user recorded actual dates, add them to Dexie periods table
      if (filteredDates.length > 0) {
        await db.periods.clear();
        for (const dateStr of filteredDates) {
          await db.periods.add({
            startDate: dateStr,
            flowLevel: 'medium',
            isApproximate,
            notes: isApproximate ? 'Recorded as approximate during onboarding' : 'Recorded during onboarding',
            createdAt: new Date().toISOString()
          });
        }
      }

      onComplete();
    } catch (err) {
      console.error('Error saving onboarding profile:', err);
      onComplete();
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      style={{
        minHeight: '100%',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        padding: '12px 4px 16px 4px'
      }}
    >
      {/* Top Header Bar */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', minHeight: 44 }}>
        {step > 1 ? (
          <button
            onClick={handleBack}
            className="btn-icon"
            aria-label="Back"
            style={{ width: 38, height: 38 }}
          >
            <ArrowLeft size={18} />
          </button>
        ) : (
          <div style={{ width: 38 }} />
        )}

        {/* Step Progress Dots */}
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          {[1, 2, 3, 4].map((i) => (
            <div
              key={i}
              style={{
                width: step === i ? 24 : 8,
                height: 8,
                borderRadius: 4,
                backgroundColor: step === i ? '#6F3347' : '#EFE8DE',
                transition: 'all 0.3s ease'
              }}
            />
          ))}
        </div>

        {step < 4 ? (
          <button
            onClick={onSkip || (() => setStep(4))}
            style={{
              background: 'none',
              border: 'none',
              color: '#81777B',
              fontSize: '14px',
              fontWeight: 500,
              cursor: 'pointer',
              padding: '8px'
            }}
          >
            Skip
          </button>
        ) : (
          <div style={{ width: 38 }} />
        )}
      </div>

      {/* Step Content */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', padding: '16px 0' }}>
        {step === 1 && (
          <div style={{ textAlign: 'center', animation: 'fadeIn 0.3s ease' }}>
            <div
              style={{
                width: 90,
                height: 90,
                borderRadius: '50%',
                backgroundColor: '#FAF0F2',
                margin: '0 auto 24px auto',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 8px 24px rgba(217, 154, 166, 0.2)'
              }}
            >
              <Heart size={44} color="#6F3347" strokeWidth={1.8} />
            </div>
            <h1 style={{ fontSize: '28px', color: '#6F3347', marginBottom: '14px' }}>
              Welcome to CycleCare
            </h1>
            <p style={{ color: '#81777B', fontSize: '15px', lineHeight: 1.6, maxWidth: '300px', margin: '0 auto' }}>
              A gentle, dignified space designed to help you listen to your body, understand your natural rhythm, and care for yourself every day.
            </p>
          </div>
        )}

        {step === 2 && (
          <div style={{ textAlign: 'center', animation: 'fadeIn 0.3s ease' }}>
            <div
              style={{
                width: 90,
                height: 90,
                borderRadius: '50%',
                backgroundColor: '#FAF0F2',
                margin: '0 auto 24px auto',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 8px 24px rgba(217, 154, 166, 0.2)'
              }}
            >
              <Calendar size={44} color="#6F3347" strokeWidth={1.8} />
            </div>
            <h1 style={{ fontSize: '28px', color: '#6F3347', marginBottom: '14px' }}>
              Cycle Tracking & Predictions
            </h1>
            <p style={{ color: '#81777B', fontSize: '15px', lineHeight: 1.6, maxWidth: '310px', margin: '0 auto' }}>
              Accurately track your periods and see clear, respectful estimates of your next cycle. All calculations stay strictly on your device.
            </p>
          </div>
        )}

        {step === 3 && (
          <div style={{ textAlign: 'center', animation: 'fadeIn 0.3s ease' }}>
            <div
              style={{
                width: 90,
                height: 90,
                borderRadius: '50%',
                backgroundColor: '#FAF0F2',
                margin: '0 auto 24px auto',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 8px 24px rgba(217, 154, 166, 0.2)'
              }}
            >
              <Bell size={44} color="#6F3347" strokeWidth={1.8} />
            </div>
            <h1 style={{ fontSize: '28px', color: '#6F3347', marginBottom: '14px' }}>
              Private Medicine Reminders
            </h1>
            <p style={{ color: '#81777B', fontSize: '15px', lineHeight: 1.6, maxWidth: '310px', margin: '0 auto' }}>
              Gentle notifications and alarm alerts for iron, vitamins, birth control, or daily tablets with simple snooze and confirmation actions.
            </p>
          </div>
        )}

        {step === 4 && (
          <div style={{ animation: 'fadeIn 0.3s ease', maxWidth: 520, margin: '0 auto', width: '100%' }}>
            <div style={{ textAlign: 'center', marginBottom: 20 }}>
              <h2 style={{ fontSize: '24px', color: '#6F3347', marginBottom: '6px' }}>
                Set Up Your Cycle
              </h2>
              <p style={{ color: '#81777B', fontSize: '13px' }}>
                All questions are completely optional. CycleCare adapts to what you know.
              </p>
            </div>

            {dateErrors && (
              <div
                style={{
                  padding: '12px 14px',
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
                <AlertCircle size={16} style={{ flexShrink: 0 }} />
                <span>{dateErrors}</span>
              </div>
            )}

            <div className="card card-cream" style={{ padding: '20px', borderRadius: 20 }}>
              {/* Optional Name */}
              <div className="form-group">
                <label className="form-label" htmlFor="user-name">What should we call you? (optional)</label>
                <input
                  id="user-name"
                  type="text"
                  className="form-input"
                  placeholder="e.g. Priya or Elena"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
              </div>

              {/* Core Requirement: Period Memory Question */}
              <div className="form-group" style={{ marginBottom: 16 }}>
                <label className="form-label" style={{ fontSize: '14px', color: '#30282B', fontWeight: 600 }}>
                  Do you remember your previous period start date?
                </label>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 8 }}>
                  {/* Option 1: Exact date */}
                  <button
                    type="button"
                    onClick={() => {
                      setMemoryChoice('exact');
                      setDateErrors('');
                    }}
                    style={{
                      padding: '12px 14px',
                      borderRadius: 14,
                      border: memoryChoice === 'exact' ? '2px solid #6F3347' : '1px solid #EFE8DE',
                      backgroundColor: memoryChoice === 'exact' ? '#FAF0F2' : '#FFFFFF',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 12,
                      cursor: 'pointer',
                      textAlign: 'left',
                      transition: 'all 0.2s ease'
                    }}
                  >
                    <div
                      style={{
                        width: 32,
                        height: 32,
                        borderRadius: 10,
                        backgroundColor: memoryChoice === 'exact' ? '#6F3347' : '#FAF7F2',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0
                      }}
                    >
                      <Calendar size={16} color={memoryChoice === 'exact' ? '#FFFFFF' : '#6F3347'} />
                    </div>
                    <div>
                      <div style={{ fontSize: '14px', fontWeight: 600, color: '#30282B' }}>
                        I remember the exact date
                      </div>
                      <div style={{ fontSize: '11px', color: '#81777B', marginTop: 1 }}>
                        Enter one or more known start dates
                      </div>
                    </div>
                  </button>

                  {/* Option 2: Approximately */}
                  <button
                    type="button"
                    onClick={() => {
                      setMemoryChoice('approximate');
                      setDateErrors('');
                    }}
                    style={{
                      padding: '12px 14px',
                      borderRadius: 14,
                      border: memoryChoice === 'approximate' ? '2px solid #6F3347' : '1px solid #EFE8DE',
                      backgroundColor: memoryChoice === 'approximate' ? '#FAF0F2' : '#FFFFFF',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 12,
                      cursor: 'pointer',
                      textAlign: 'left',
                      transition: 'all 0.2s ease'
                    }}
                  >
                    <div
                      style={{
                        width: 32,
                        height: 32,
                        borderRadius: 10,
                        backgroundColor: memoryChoice === 'approximate' ? '#6F3347' : '#FAF7F2',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0
                      }}
                    >
                      <Clock size={16} color={memoryChoice === 'approximate' ? '#FFFFFF' : '#6F3347'} />
                    </div>
                    <div>
                      <div style={{ fontSize: '14px', fontWeight: 600, color: '#30282B' }}>
                        I remember approximately
                      </div>
                      <div style={{ fontSize: '11px', color: '#81777B', marginTop: 1 }}>
                        Saved as approximate reference dates
                      </div>
                    </div>
                  </button>

                  {/* Option 3: Don't remember */}
                  <button
                    type="button"
                    onClick={() => {
                      setMemoryChoice('dont_remember');
                      setDateErrors('');
                    }}
                    style={{
                      padding: '12px 14px',
                      borderRadius: 14,
                      border: memoryChoice === 'dont_remember' ? '2px solid #6F3347' : '1px solid #EFE8DE',
                      backgroundColor: memoryChoice === 'dont_remember' ? '#FAF0F2' : '#FFFFFF',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 12,
                      cursor: 'pointer',
                      textAlign: 'left',
                      transition: 'all 0.2s ease'
                    }}
                  >
                    <div
                      style={{
                        width: 32,
                        height: 32,
                        borderRadius: 10,
                        backgroundColor: memoryChoice === 'dont_remember' ? '#6F3347' : '#FAF7F2',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0
                      }}
                    >
                      <HelpCircle size={16} color={memoryChoice === 'dont_remember' ? '#FFFFFF' : '#6F3347'} />
                    </div>
                    <div>
                      <div style={{ fontSize: '14px', fontWeight: 600, color: '#30282B' }}>
                        I don't remember
                      </div>
                      <div style={{ fontSize: '11px', color: '#81777B', marginTop: 1 }}>
                        No guessing required — start from your next period
                      </div>
                    </div>
                  </button>

                  {/* Option 4: First time tracking */}
                  <button
                    type="button"
                    onClick={() => {
                      setMemoryChoice('first_time');
                      setDateErrors('');
                    }}
                    style={{
                      padding: '12px 14px',
                      borderRadius: 14,
                      border: memoryChoice === 'first_time' ? '2px solid #6F3347' : '1px solid #EFE8DE',
                      backgroundColor: memoryChoice === 'first_time' ? '#FAF0F2' : '#FFFFFF',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 12,
                      cursor: 'pointer',
                      textAlign: 'left',
                      transition: 'all 0.2s ease'
                    }}
                  >
                    <div
                      style={{
                        width: 32,
                        height: 32,
                        borderRadius: 10,
                        backgroundColor: memoryChoice === 'first_time' ? '#6F3347' : '#FAF7F2',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0
                      }}
                    >
                      <Sparkles size={16} color={memoryChoice === 'first_time' ? '#FFFFFF' : '#6F3347'} />
                    </div>
                    <div>
                      <div style={{ fontSize: '14px', fontWeight: 600, color: '#30282B' }}>
                        This is my first time tracking
                      </div>
                      <div style={{ fontSize: '11px', color: '#81777B', marginTop: 1 }}>
                        Welcome! We'll start fresh from your very next period
                      </div>
                    </div>
                  </button>
                </div>
              </div>

              {/* Dynamic Entry Inputs when user remembers dates */}
              {(memoryChoice === 'exact' || memoryChoice === 'approximate') && (
                <div
                  style={{
                    padding: '14px',
                    borderRadius: 14,
                    backgroundColor: '#FFFFFF',
                    border: '1px solid #EFE8DE',
                    marginBottom: 16
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                    <label className="form-label" style={{ marginBottom: 0, fontSize: '13px', color: '#30282B' }}>
                      {memoryChoice === 'exact' ? 'Previous Period Start Dates' : 'Approximate Start Dates'}
                    </label>
                    <span style={{ fontSize: '11px', color: '#81777B' }}>
                      Add as many as you know
                    </span>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    {enteredDates.map((dateVal, idx) => (
                      <div key={idx} style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                        <input
                          type="date"
                          className="form-input"
                          value={dateVal}
                          onChange={(e) => handleDateChange(idx, e.target.value)}
                          placeholder="YYYY-MM-DD"
                        />
                        {enteredDates.length > 1 && (
                          <button
                            type="button"
                            onClick={() => handleRemoveDateInput(idx)}
                            className="btn-icon"
                            title="Remove date"
                            style={{ width: 34, height: 34, flexShrink: 0 }}
                          >
                            <Trash2 size={14} color="#C0394B" />
                          </button>
                        )}
                      </div>
                    ))}
                  </div>

                  <button
                    type="button"
                    onClick={handleAddDateInput}
                    style={{
                      background: 'none',
                      border: 'none',
                      color: '#6F3347',
                      fontSize: '12px',
                      fontWeight: 600,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 4,
                      marginTop: 10,
                      padding: 0
                    }}
                  >
                    <Plus size={14} />
                    Add another past period date
                  </button>

                  <div style={{ fontSize: '11px', color: '#81777B', marginTop: 8 }}>
                    {memoryChoice === 'exact'
                      ? 'Dates will be treated as verified exact observations.'
                      : 'Dates will be marked with "~ Approx" to distinguish them from exact observations.'}
                  </div>
                </div>
              )}

              {/* Reassuring Notes for "Don't Remember" and "First Time" */}
              {memoryChoice === 'dont_remember' && (
                <div
                  style={{
                    padding: '12px 14px',
                    borderRadius: 12,
                    backgroundColor: '#FAF0F2',
                    border: '1px solid #EFE8DE',
                    fontSize: '12px',
                    color: '#6F3347',
                    lineHeight: 1.5,
                    marginBottom: 16
                  }}
                >
                  🌸 <strong>No guessing needed:</strong> CycleCare will invite you to record your next period whenever it arrives. Your medicine reminders are ready to use immediately!
                </div>
              )}

              {memoryChoice === 'first_time' && (
                <div
                  style={{
                    padding: '12px 14px',
                    borderRadius: 12,
                    backgroundColor: '#FAF0F2',
                    border: '1px solid #EFE8DE',
                    fontSize: '12px',
                    color: '#6F3347',
                    lineHeight: 1.5,
                    marginBottom: 16
                  }}
                >
                  🌱 <strong>Welcome to tracking:</strong> You don't need any history to get started. When your next period begins, tap "Log Period" to start your personal journey.
                </div>
              )}

              {/* Cycle Length Setting (Optional, never forced) */}
              <div
                style={{
                  padding: '14px',
                  borderRadius: 14,
                  backgroundColor: '#FFFFFF',
                  border: '1px solid #EFE8DE',
                  marginBottom: 14
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div>
                    <div style={{ fontSize: '13px', fontWeight: 600, color: '#30282B' }}>
                      Typical Cycle Length
                    </div>
                    <div style={{ fontSize: '11px', color: '#81777B' }}>
                      Never guess — only enter if you already know it
                    </div>
                  </div>
                  <label
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 6,
                      fontSize: '12px',
                      color: '#6F3347',
                      cursor: 'pointer',
                      fontWeight: 500
                    }}
                  >
                    <input
                      type="checkbox"
                      checked={knowsCycleLength}
                      onChange={(e) => setKnowsCycleLength(e.target.value === 'true' || e.target.checked)}
                      style={{ accentColor: '#6F3347' }}
                    />
                    I know it
                  </label>
                </div>

                {knowsCycleLength ? (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 12 }}>
                    <input
                      type="number"
                      min={18}
                      max={60}
                      className="form-input"
                      style={{ width: 100 }}
                      value={cycleLength}
                      onChange={(e) => setCycleLength(Number(e.target.value))}
                    />
                    <span style={{ fontSize: '13px', color: '#81777B' }}>days</span>
                  </div>
                ) : (
                  <div style={{ fontSize: '12px', color: '#81777B', marginTop: 8, fontStyle: 'italic' }}>
                    CycleCare will calculate your observed cycle length automatically once you log two or more periods.
                  </div>
                )}
              </div>

              {/* Typical Period Duration (Optional) */}
              <div className="form-group" style={{ marginBottom: 4 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <label className="form-label" htmlFor="period-length" style={{ marginBottom: 0 }}>
                    Period Duration (optional)
                  </label>
                  <span style={{ fontSize: '11px', color: '#81777B' }}>usually 3–7 days</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 6 }}>
                  <input
                    id="period-length"
                    type="number"
                    min={2}
                    max={12}
                    className="form-input"
                    style={{ width: 100 }}
                    value={periodLength}
                    onChange={(e) => setPeriodLength(Number(e.target.value))}
                  />
                  <span style={{ fontSize: '13px', color: '#81777B' }}>days of bleeding</span>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Bottom Action Button */}
      <div style={{ maxWidth: 520, margin: '0 auto', width: '100%' }}>
        <button
          onClick={handleNext}
          disabled={isSubmitting}
          className="btn btn-primary"
          style={{
            width: '100%',
            padding: '15px',
            fontSize: '16px',
            borderRadius: '30px'
          }}
        >
          {step === 4 ? (
            <>
              <Check size={18} />
              {isSubmitting ? 'Saving...' : 'Get Started'}
            </>
          ) : (
            <>
              Continue
              <ArrowRight size={18} />
            </>
          )}
        </button>

        {step === 4 && (
          <button
            onClick={onSkip || handleSaveProfile}
            style={{
              width: '100%',
              background: 'none',
              border: 'none',
              color: '#81777B',
              fontSize: '13px',
              padding: '10px',
              cursor: 'pointer',
              marginTop: 6
            }}
          >
            Skip setup and explore CycleCare
          </button>
        )}
      </div>
    </div>
  );
};
