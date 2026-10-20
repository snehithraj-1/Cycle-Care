import React, { useEffect } from 'react';
import { CycleCareLogo, FloralBranch } from '../illustrations/BotanicalDecor';

interface Screen01SplashProps {
  onContinue: () => void;
  autoProceed?: boolean;
}

export const Screen01Splash: React.FC<Screen01SplashProps> = ({
  onContinue,
  autoProceed = false
}) => {
  useEffect(() => {
    if (autoProceed) {
      const timer = setTimeout(() => {
        onContinue();
      }, 2200);
      return () => clearTimeout(timer);
    }
  }, [autoProceed, onContinue]);

  return (
    <div
      style={{
        minHeight: '100%',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: '36px 16px 24px 16px',
        position: 'relative',
        overflow: 'hidden'
      }}
    >
      {/* Decorative floral accents */}
      <div style={{ position: 'absolute', top: -10, right: -10, opacity: 0.7 }}>
        <FloralBranch size={160} color="#D99AA6" />
      </div>
      <div style={{ position: 'absolute', bottom: -20, left: -20, opacity: 0.5, transform: 'rotate(180deg)' }}>
        <FloralBranch size={150} color="#B8C6B0" />
      </div>

      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', textAlign: 'center', zIndex: 2 }}>
        <div
          style={{
            width: 104,
            height: 104,
            borderRadius: '50%',
            backgroundColor: '#FFFFFF',
            boxShadow: '0 12px 32px rgba(111, 51, 71, 0.08)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: 28,
            border: '1px solid #EFE8DE'
          }}
        >
          <CycleCareLogo size={68} />
        </div>

        <h1
          style={{
            fontFamily: "'Playfair Display', Georgia, serif",
            fontSize: '36px',
            fontWeight: 600,
            color: '#6F3347',
            letterSpacing: '-0.5px',
            marginBottom: 10
          }}
        >
          CycleCare
        </h1>

        <p
          style={{
            fontFamily: "'Plus Jakarta Sans', sans-serif",
            fontSize: '15px',
            fontWeight: 500,
            color: '#81777B',
            letterSpacing: '0.4px',
            maxWidth: '260px'
          }}
        >
          Your Health. Your Rhythm. Your Care.
        </p>

        <div
          style={{
            marginTop: 24,
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            padding: '6px 14px',
            borderRadius: 20,
            backgroundColor: '#F3EDE5',
            fontSize: '12px',
            color: '#6F3347',
            fontWeight: 600
          }}
        >
          <span style={{ width: 6, height: 6, borderRadius: '50%', backgroundColor: '#6F3347' }} />
          Local-First & Private
        </div>
      </div>

      <div style={{ width: '100%', maxWidth: '320px', zIndex: 2 }}>
        <button
          onClick={onContinue}
          className="btn btn-primary"
          style={{
            width: '100%',
            padding: '15px',
            fontSize: '16px',
            borderRadius: '30px',
            backgroundColor: '#6F3347'
          }}
        >
          Begin Journey
        </button>
      </div>
    </div>
  );
};
