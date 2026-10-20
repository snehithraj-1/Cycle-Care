import React from 'react';
import { Download, X, Smartphone, Monitor, Share, PlusSquare, ShieldCheck, CheckCircle } from 'lucide-react';
import { CycleCareLogo } from './illustrations/BotanicalDecor';

interface InstallAppModalProps {
  isOpen: boolean;
  onClose: () => void;
  deferredPrompt: any;
  onInstallSuccess?: () => void;
}

export const InstallAppModal: React.FC<InstallAppModalProps> = ({
  isOpen,
  onClose,
  deferredPrompt,
  onInstallSuccess
}) => {
  if (!isOpen) return null;

  const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream;
  const isStandalone = window.matchMedia('(display-mode: standalone)').matches || (navigator as any).standalone;

  const handleNativeInstall = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === 'accepted') {
        if (onInstallSuccess) onInstallSuccess();
        onClose();
      }
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div
        className="modal-content"
        style={{ maxWidth: 480, padding: '28px 24px' }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Mobile handle */}
        <div style={{ width: 44, height: 4, borderRadius: 2, backgroundColor: '#E2DBD4', margin: '-8px auto 16px auto' }} />

        {/* Modal Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div
              style={{
                width: 44,
                height: 44,
                borderRadius: 14,
                backgroundColor: '#FAF0F2',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: 'var(--shadow-xs)'
              }}
            >
              <CycleCareLogo size={32} />
            </div>
            <div>
              <h2 style={{ fontSize: '19px', color: '#30282B', fontWeight: 700 }}>
                Install CycleCare
              </h2>
              <span style={{ fontSize: '12px', color: '#81777B' }}>
                Offline Web Application
              </span>
            </div>
          </div>
          <button onClick={onClose} className="btn-icon" style={{ width: 34, height: 34 }} aria-label="Close">
            <X size={16} />
          </button>
        </div>

        {isStandalone ? (
          <div style={{ textAlign: 'center', padding: '24px 12px' }}>
            <div style={{ width: 56, height: 56, borderRadius: '50%', backgroundColor: '#EEF3EC', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 14px auto' }}>
              <CheckCircle size={32} color="#4C7047" />
            </div>
            <h3 style={{ fontSize: '17px', color: '#30282B', marginBottom: 6 }}>
              CycleCare is Already Installed!
            </h3>
            <p style={{ fontSize: '13px', color: '#81777B', lineHeight: 1.5 }}>
              You are currently using the standalone installed web application. All your cycle records and reminders work securely offline.
            </p>
            <button onClick={onClose} className="btn btn-primary" style={{ marginTop: 18, width: '100%' }}>
              Continue
            </button>
          </div>
        ) : (
          <div>
            <p style={{ fontSize: '13px', color: '#81777B', lineHeight: 1.55, marginBottom: 18 }}>
              Install CycleCare on your home screen or desktop to use it like a native mobile app — with instant loading, full-screen view, and offline data safety.
            </p>

            {/* Direct 1-Click Install Button if supported by browser */}
            {deferredPrompt && (
              <div style={{ marginBottom: 20 }}>
                <button
                  onClick={handleNativeInstall}
                  className="btn btn-primary"
                  style={{ width: '100%', padding: '13px', fontSize: '14px', borderRadius: 16 }}
                >
                  <Download size={18} />
                  <span>Download & Install Now</span>
                </button>
                <div style={{ fontSize: '11px', color: '#81777B', textAlign: 'center', marginTop: 8 }}>
                  ✓ 100% Free • Zero App Store download required • 0 MB storage
                </div>
              </div>
            )}

            {/* Instructions Guide */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {/* iPhone / iPad Guide */}
              <div
                style={{
                  padding: '14px 16px',
                  borderRadius: 16,
                  backgroundColor: '#FAF7F2',
                  border: isIOS ? '2px solid #D99AA6' : '1px solid #EFE8DE'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontWeight: 700, fontSize: '14px', color: '#6F3347', marginBottom: 8 }}>
                  <Smartphone size={16} />
                  <span>iPhone / iPad (Safari)</span>
                  {isIOS && <span style={{ fontSize: '10px', backgroundColor: '#F2D8DC', padding: '2px 8px', borderRadius: 10 }}>Your Device</span>}
                </div>
                <ol style={{ paddingLeft: 20, fontSize: '12px', color: '#786C72', lineHeight: 1.6 }}>
                  <li>Tap the <strong>Share</strong> button ( <Share size={13} style={{ display: 'inline', verticalAlign: '-2px' }} /> ) in Safari's bottom menu.</li>
                  <li>Scroll down and tap <strong>Add to Home Screen</strong> ( <PlusSquare size={13} style={{ display: 'inline', verticalAlign: '-2px' }} /> ).</li>
                  <li>Tap <strong>Add</strong> in the top-right corner.</li>
                </ol>
              </div>

              {/* Android Guide */}
              <div
                style={{
                  padding: '14px 16px',
                  borderRadius: 16,
                  backgroundColor: '#FAF7F2',
                  border: !isIOS && !deferredPrompt ? '2px solid #D99AA6' : '1px solid #EFE8DE'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontWeight: 700, fontSize: '14px', color: '#6F3347', marginBottom: 8 }}>
                  <Smartphone size={16} />
                  <span>Android (Chrome / Edge / Samsung Internet)</span>
                </div>
                <ol style={{ paddingLeft: 20, fontSize: '12px', color: '#786C72', lineHeight: 1.6 }}>
                  <li>Tap the <strong>three dots</strong> menu (⋮) in your browser.</li>
                  <li>Select <strong>"Install app"</strong> or <strong>"Add to Home screen"</strong>.</li>
                  <li>Tap <strong>Install</strong> to confirm.</li>
                </ol>
              </div>

              {/* Desktop Computer Guide */}
              <div
                style={{
                  padding: '14px 16px',
                  borderRadius: 16,
                  backgroundColor: '#FAF7F2',
                  border: '1px solid #EFE8DE'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontWeight: 700, fontSize: '14px', color: '#6F3347', marginBottom: 6 }}>
                  <Monitor size={16} />
                  <span>PC / Mac / Chromebook</span>
                </div>
                <p style={{ fontSize: '12px', color: '#786C72', lineHeight: 1.5 }}>
                  Click the <strong>Install icon</strong> ( <Download size={12} style={{ display: 'inline', verticalAlign: '-1px' }} /> ) on the right side of your browser address bar to install CycleCare as a desktop app.
                </p>
              </div>
            </div>

            {/* Offline & Privacy Assurance */}
            <div
              style={{
                marginTop: 18,
                padding: '10px 14px',
                borderRadius: 12,
                backgroundColor: '#FAF0F2',
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                fontSize: '11px',
                color: '#6F3347'
              }}
            >
              <ShieldCheck size={16} style={{ flexShrink: 0 }} />
              <span>Installed app continues working offline even without Wi-Fi or mobile data.</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
