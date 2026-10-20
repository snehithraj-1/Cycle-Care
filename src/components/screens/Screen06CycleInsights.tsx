import React from 'react';
import { Sparkles, Calendar, TrendingUp, AlertCircle, Info, ChevronLeft } from 'lucide-react';
import type { PeriodEntry, CycleStats, UserProfile } from '../../types';

interface Screen06CycleInsightsProps {
  stats: CycleStats;
  periods: PeriodEntry[];
  profile?: UserProfile;
  onBack: () => void;
  onOpenLogPeriod: () => void;
}

export const Screen06CycleInsights: React.FC<Screen06CycleInsightsProps> = ({
  stats,
  periods,
  profile,
  onBack,
  onOpenLogPeriod
}) => {
  const hasHistory = stats.hasEnoughData;
  const sortedPeriods = [...periods].sort((a, b) => b.startDate.localeCompare(a.startDate));

  // Format date helper
  const formatDateLabel = (dateStr: string) => {
    const [y, m, d] = dateStr.split('-').map(Number);
    const date = new Date(y, m - 1, d);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  return (
    <div className="screen-container">
      {/* Top Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 22 }}>
        <button
          onClick={onBack}
          className="btn-icon"
          aria-label="Back"
          style={{ width: 40, height: 40 }}
        >
          <ChevronLeft size={20} />
        </button>
        <div>
          <h1 style={{ fontSize: '26px', color: '#30282B', fontWeight: 700 }}>
            Cycle Insights
          </h1>
          <p style={{ fontSize: '13px', color: '#81777B' }}>
            Rhythm analysis, phase guidance, and historical trends
          </p>
        </div>
      </div>

      {/* Main Metric Cards Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 14, marginBottom: 20 }}>
        <div className="card card-cream" style={{ padding: '20px' }}>
          <div style={{ fontSize: '11px', textTransform: 'uppercase', color: '#81777B', fontWeight: 700, letterSpacing: '0.6px' }}>
            Average Cycle Length
          </div>
          <div
            style={{
              fontFamily: "'Playfair Display', serif",
              fontSize: '36px',
              fontWeight: 700,
              color: '#6F3347',
              margin: '6px 0 2px 0'
            }}
          >
            {stats.averageCycleLength ? (
              <>{stats.averageCycleLength} <span style={{ fontSize: '16px', fontWeight: 500, fontFamily: 'sans-serif', color: '#81777B' }}>days</span></>
            ) : (
              <span style={{ fontSize: '22px' }}>Observing</span>
            )}
          </div>
          <div style={{ fontSize: '12px', color: '#81777B' }}>
            {stats.status === 'multiple_dates'
              ? `${stats.isRegular ? 'Regular rhythm (±' + stats.cycleVariation + 'd)' : 'Variable rhythm (±' + stats.cycleVariation + 'd)'}`
              : stats.status === 'single_date'
              ? '1 date logged • Observing'
              : 'Awaiting period logs'}
          </div>
        </div>

        <div className="card card-cream" style={{ padding: '20px' }}>
          <div style={{ fontSize: '11px', textTransform: 'uppercase', color: '#81777B', fontWeight: 700, letterSpacing: '0.6px' }}>
            Typical Bleeding Length
          </div>
          <div
            style={{
              fontFamily: "'Playfair Display', serif",
              fontSize: '36px',
              fontWeight: 700,
              color: '#6F3347',
              margin: '6px 0 2px 0'
            }}
          >
            {stats.averagePeriodLength} <span style={{ fontSize: '16px', fontWeight: 500, fontFamily: 'sans-serif', color: '#81777B' }}>days</span>
          </div>
          <div style={{ fontSize: '12px', color: '#81777B' }}>
            Average period duration
          </div>
        </div>

        <div className="card card-cream" style={{ padding: '20px' }}>
          <div style={{ fontSize: '11px', textTransform: 'uppercase', color: '#81777B', fontWeight: 700, letterSpacing: '0.6px' }}>
            Recorded Cycles
          </div>
          <div
            style={{
              fontFamily: "'Playfair Display', serif",
              fontSize: '36px',
              fontWeight: 700,
              color: '#6F3347',
              margin: '6px 0 2px 0'
            }}
          >
            {stats.totalCyclesRecorded} <span style={{ fontSize: '16px', fontWeight: 500, fontFamily: 'sans-serif', color: '#81777B' }}>cycles</span>
          </div>
          <div style={{ fontSize: '12px', color: '#81777B' }}>
            Total intervals verified
          </div>
        </div>
      </div>

      {/* Four Phases of Natural Rhythm Guide */}
      <div className="card" style={{ padding: '24px', marginBottom: 20 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
          <Sparkles size={18} color="#6F3347" />
          <h2 style={{ fontSize: '17px', color: '#30282B', fontWeight: 700 }}>
            The Four Natural Rhythm Phases
          </h2>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 12 }}>
          <div style={{ padding: '14px', borderRadius: 14, backgroundColor: '#FAF0F2', border: '1px solid #F2D8DC' }}>
            <div style={{ fontSize: '13px', fontWeight: 700, color: '#D99AA6', marginBottom: 4 }}>
              1. Menstrual (Days 1–5)
            </div>
            <p style={{ fontSize: '12px', color: '#6F3347', lineHeight: 1.5 }}>
              Hormones at calm baseline. Body sheds lining; restorative hydration, gentle warmth, and restful pacing nurture the body.
            </p>
          </div>

          <div style={{ padding: '14px', borderRadius: 14, backgroundColor: '#F4F1FA', border: '1px solid #DCD7EF' }}>
            <div style={{ fontSize: '13px', fontWeight: 700, color: '#7B6DA8', marginBottom: 4 }}>
              2. Follicular (Days 6–12)
            </div>
            <p style={{ fontSize: '12px', color: '#5E4A7D', lineHeight: 1.5 }}>
              Estrogen gently builds. Rising focus, creative clarity, and natural enthusiasm for starting new projects.
            </p>
          </div>

          <div style={{ padding: '14px', borderRadius: 14, backgroundColor: '#EEF3EC', border: '1px solid #B8C6B0' }}>
            <div style={{ fontSize: '13px', fontWeight: 700, color: '#5C7A52', marginBottom: 4 }}>
              3. Ovulatory (Days 13–16)
            </div>
            <p style={{ fontSize: '12px', color: '#3E5536', lineHeight: 1.5 }}>
              Estrogen and luteinizing hormone peak. Peak vitality, social connection, and bodily alignment.
            </p>
          </div>

          <div style={{ padding: '14px', borderRadius: 14, backgroundColor: '#FBF4EC', border: '1px solid #E8D5C4' }}>
            <div style={{ fontSize: '13px', fontWeight: 700, color: '#B06F39', marginBottom: 4 }}>
              4. Luteal (Days 17–28+)
            </div>
            <p style={{ fontSize: '12px', color: '#7B4C25', lineHeight: 1.5 }}>
              Progesterone supports the second half. Mindful nourishment, boundary-keeping, and extra sleep ease transition into your next cycle.
            </p>
          </div>
        </div>
      </div>

      {/* Substantial Variation Notice if applicable */}
      {stats.isSubstantiallyVariable && (
        <div
          style={{
            padding: '14px 16px',
            backgroundColor: '#FFF5F5',
            border: '1px solid #FFD1D1',
            borderRadius: 16,
            display: 'flex',
            alignItems: 'flex-start',
            gap: 12,
            marginBottom: 20
          }}
        >
          <AlertCircle size={20} color="#C0394B" style={{ flexShrink: 0, marginTop: 2 }} />
          <div style={{ fontSize: '13px', color: '#C0394B', lineHeight: 1.55 }}>
            <strong>Substantial Cycle Variation:</strong> Your observed cycle intervals vary by ±{stats.cycleVariation} days. Because your cycles vary substantially, predictions are an approximate guide and may be less reliable.
          </div>
        </div>
      )}

      {/* Approximate Dates Notice if applicable */}
      {stats.hasApproximateDates && (
        <div
          style={{
            padding: '14px 16px',
            backgroundColor: '#FAF7F2',
            border: '1px solid #EFE8DE',
            borderRadius: 16,
            display: 'flex',
            alignItems: 'center',
            gap: 12,
            marginBottom: 20
          }}
        >
          <Info size={18} color="#6F3347" style={{ flexShrink: 0 }} />
          <div style={{ fontSize: '13px', color: '#6F3347', lineHeight: 1.5 }}>
            <strong>Approximate History:</strong> Some of your historical dates were recorded approximately (~ Approx). Predictions reflect this estimated timing.
          </div>
        </div>
      )}

      {/* Historical Trend Chart */}
      <div className="card" style={{ padding: '20px 16px', marginBottom: 16 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <TrendingUp size={18} color="#6F3347" />
            <h2 style={{ fontSize: '16px', color: '#30282B', fontWeight: 600 }}>
              Cycle Length Trend
            </h2>
          </div>
          <span style={{ fontSize: '12px', color: '#81777B' }}>
            {stats.averageCycleLength ? `Median: ${stats.averageCycleLength}d` : 'Observing'}
          </span>
        </div>

        {stats.historicalCycles.length > 0 ? (
          <div>
            {/* Elegant SVG Bar Chart */}
            <div style={{ height: 160, width: '100%', position: 'relative', display: 'flex', alignItems: 'flex-end', justifyContent: 'space-around', paddingTop: 20 }}>
              {/* Baseline reference line */}
              <div
                style={{
                  position: 'absolute',
                  left: 0,
                  right: 0,
                  top: '50%',
                  borderTop: '1px dashed #D99AA6',
                  opacity: 0.6
                }}
              />

              {stats.historicalCycles.map((cycle, idx) => {
                const maxVal = 40;
                const minVal = 20;
                const heightPct = Math.max(15, Math.min(100, ((cycle.length - minVal) / (maxVal - minVal)) * 100));

                return (
                  <div
                    key={idx}
                    style={{
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      gap: 6,
                      height: '100%',
                      justifyContent: 'flex-end',
                      zIndex: 2
                    }}
                  >
                    <span style={{ fontSize: '12px', fontWeight: 700, color: '#6F3347' }}>
                      {cycle.length}d
                    </span>
                    <div
                      style={{
                        width: 32,
                        height: `${heightPct}%`,
                        backgroundColor: '#F2D8DC',
                        border: '1.5px solid #D99AA6',
                        borderRadius: '8px 8px 4px 4px',
                        transition: 'height 0.4s ease'
                      }}
                    />
                    <span style={{ fontSize: '10px', color: '#81777B', whiteSpace: 'nowrap' }}>
                      {formatDateLabel(cycle.startDate).split(',')[0]}
                    </span>
                  </div>
                );
              })}
            </div>
            <p style={{ fontSize: '11px', color: '#81777B', textAlign: 'center', marginTop: 12 }}>
              Bars illustrate individual intervals between recorded period start dates.
            </p>
          </div>
        ) : (
          <div
            style={{
              padding: '24px 16px',
              textAlign: 'center',
              backgroundColor: '#FAF7F2',
              borderRadius: 14
            }}
          >
            <Info size={24} color="#81777B" style={{ margin: '0 auto 8px auto' }} />
            <div style={{ fontSize: '14px', fontWeight: 600, color: '#30282B', marginBottom: 4 }}>
              More Cycle Logs Needed
            </div>
            <p style={{ fontSize: '12px', color: '#81777B', maxWidth: '280px', margin: '0 auto 12px auto' }}>
              CycleCare requires at least two consecutive period logs to calculate verified trends and rhythm variations.
            </p>
            <button
              onClick={onOpenLogPeriod}
              className="btn btn-secondary"
              style={{ padding: '6px 14px', fontSize: '12px' }}
            >
              Log Another Period
            </button>
          </div>
        )}
      </div>

      {/* Recorded History List */}
      <div className="card" style={{ padding: '18px 16px' }}>
        <h2 style={{ fontSize: '16px', color: '#30282B', marginBottom: 12, fontWeight: 600 }}>
          Recorded Period History
        </h2>

        {sortedPeriods.length > 0 ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {sortedPeriods.map((entry) => (
              <div
                key={entry.id}
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: '10px 12px',
                  backgroundColor: '#FAF7F2',
                  borderRadius: 12,
                  border: '1px solid #EFE8DE'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <div
                    style={{
                      width: 10,
                      height: 10,
                      borderRadius: '50%',
                      backgroundColor: '#6F3347'
                    }}
                  />
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <span style={{ fontSize: '14px', fontWeight: 600, color: '#30282B' }}>
                        {formatDateLabel(entry.startDate)}
                      </span>
                      {entry.isApproximate && (
                        <span
                          style={{
                            fontSize: '11px',
                            fontWeight: 600,
                            color: '#6F3347',
                            backgroundColor: '#FAF0F2',
                            padding: '1px 6px',
                            borderRadius: 6,
                            border: '1px solid #EFE8DE'
                          }}
                        >
                          ~ Approx
                        </span>
                      )}
                    </div>
                    <div style={{ fontSize: '12px', color: '#81777B', marginTop: 2 }}>
                      {entry.endDate ? `to ${formatDateLabel(entry.endDate)}` : 'Single date logged'} • {entry.flowLevel} flow
                    </div>
                  </div>
                </div>

                {entry.notes && (
                  <span style={{ fontSize: '11px', color: '#81777B', fontStyle: 'italic', maxWidth: 110, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    "{entry.notes}"
                  </span>
                )}
              </div>
            ))}
          </div>
        ) : (
          <p style={{ fontSize: '13px', color: '#81777B', textAlign: 'center', padding: '10px 0' }}>
            No past period records found.
          </p>
        )}
      </div>

      {/* Medical Disclaimer */}
      <div
        style={{
          marginTop: 16,
          padding: '12px 14px',
          backgroundColor: '#FAF0F2',
          borderRadius: 12,
          display: 'flex',
          gap: 10,
          alignItems: 'flex-start'
        }}
      >
        <AlertCircle size={16} color="#6F3347" style={{ flexShrink: 0, marginTop: 2 }} />
        <p style={{ fontSize: '11px', color: '#6F3347', lineHeight: 1.45 }}>
          <strong>Medical Notice:</strong> Cycle predictions and rhythm statistics are non-diagnostic statistical estimates. Variations are normal and can be influenced by sleep, stress, illness, and lifestyle.
        </p>
      </div>
    </div>
  );
};
