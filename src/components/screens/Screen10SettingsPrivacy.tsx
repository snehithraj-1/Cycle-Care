import React, { useState, useEffect } from 'react';
import {
  Shield,
  Download,
  Trash2,
  Bell,
  Volume2,
  Smartphone,
  Calendar,
  Sparkles,
  Info,
  Check,
  ChevronLeft
} from 'lucide-react';
import type { UserProfile } from '../../types';
import { db, clearAllUserData, seedSampleData } from '../../db';
import { reminderEngine } from '../../services/reminderEngine';

interface Screen10SettingsPrivacyProps {
  profile?: UserProfile;
  onUpdateProfile: (updated: Partial<UserProfile>) => Promise<void>;
  onResetData: () => Promise<void>;
  onBack: () => void;
  onOpenInstallModal?: () => void;
}

export const Screen10SettingsPrivacy: React.FC<Screen10SettingsPrivacyProps> = ({
  profile,
  onUpdateProfile,
  onResetData,
  onBack,
  onOpenInstallModal
}) => {
  const [name, setName] = useState<string>(profile?.name || '');
  const [cycleLength, setCycleLength] = useState<number>(profile?.cycleLength || 28);
  const [periodLength, setPeriodLength] = useState<number>(profile?.periodLength || 5);
  const [alarmSound, setAlarmSound] = useState<string>(profile?.alarmSound || 'chime');
  const [vibrationEnabled, setVibrationEnabled] = useState<boolean>(
    profile?.vibrationEnabled !== undefined ? profile.vibrationEnabled : true
  );
  const [snoozeDuration, setSnoozeDuration] = useState<number>(profile?.snoozeDuration || 10);
  const [permissionState, setPermissionState] = useState<string>('default');
  const [showDeleteModal, setShowDeleteModal] = useState<boolean>(false);
  const [saveSuccess, setSaveSuccess] = useState<boolean>(false);

  useEffect(() => {
    setPermissionState(reminderEngine.getNotificationPermissionStatus());
  }, []);

  const handleRequestPermission = async () => {
    const res = await reminderEngine.requestNotificationPermission();
    setPermissionState(res.status);
  };

  const handleSavePreferences = async () => {
    await onUpdateProfile({
      name: name.trim() || 'Friend',
      cycleLength: Number(cycleLength),
      periodLength: Number(periodLength),
      alarmSound: alarmSound as any,
      vibrationEnabled,
      snoozeDuration: Number(snoozeDuration)
    });
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 2000);
  };

  const handleExportData = async () => {
    try {
      const currentProfile = await db.profile.toArray();
      const periods = await db.periods.toArray();
      const reminders = await db.reminders.toArray();
      const logs = await db.reminderLogs.toArray();

      const exportPayload = {
        app: 'CycleCare',
        version: '1.0.0',
        exportedAt: new Date().toISOString(),
        profile: currentProfile[0] || null,
        periods,
        reminders,
        logs
      };

      const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(exportPayload, null, 2));
      const downloadAnchor = document.createElement('a');
      downloadAnchor.setAttribute('href', dataStr);
      downloadAnchor.setAttribute('download', `cyclecare_backup_${new Date().toISOString().split('T')[0]}.json`);
      document.body.appendChild(downloadAnchor);
      downloadAnchor.click();
      downloadAnchor.remove();
    } catch (err) {
      console.error('Export failed:', err);
      alert('Could not generate data export. Please try again.');
    }
  };

  const handleSeedSample = async () => {
    if (window.confirm('Load realistic sample data (3 past cycles & 3 daily reminders)? Existing logs will be replaced.')) {
      await seedSampleData();
      window.location.reload();
    }
  };

  return (
    <div className="screen-container">
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 22 }}>
        <button onClick={onBack} className="btn-icon" aria-label="Back" style={{ width: 40, height: 40 }}>
          <ChevronLeft size={20} />
        </button>
        <div>
          <h1 style={{ fontSize: '26px', color: '#30282B', fontWeight: 700 }}>
            Settings & Privacy
          </h1>
          <p style={{ fontSize: '13px', color: '#81777B' }}>
            Personal cycle preferences, alarm sounds, and local data security
          </p>
        </div>
      </div>

      {/* Responsive Settings Layout */}
      <div className="settings-layout">
        {/* Left Column: Preferences */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
          {/* Cycle Baseline Settings Card */}
          <div className="card" style={{ padding: '24px', marginBottom: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
          <Calendar size={18} color="#6F3347" />
          <h2 style={{ fontSize: '16px', color: '#30282B', fontWeight: 600 }}>
            Cycle Preferences
          </h2>
        </div>

        <div className="form-group">
          <label className="form-label" htmlFor="settings-name">Display Name</label>
          <input
            id="settings-name"
            type="text"
            className="form-input"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          <div className="form-group">
            <label className="form-label" htmlFor="settings-cycle-length">Cycle Length</label>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <input
                id="settings-cycle-length"
                type="number"
                min={18}
                max={60}
                className="form-input"
                value={cycleLength}
                onChange={(e) => setCycleLength(Number(e.target.value))}
              />
              <span style={{ fontSize: '13px', color: '#81777B' }}>days</span>
            </div>
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="settings-period-length">Period Length</label>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <input
                id="settings-period-length"
                type="number"
                min={2}
                max={12}
                className="form-input"
                value={periodLength}
                onChange={(e) => setPeriodLength(Number(e.target.value))}
              />
              <span style={{ fontSize: '13px', color: '#81777B' }}>days</span>
            </div>
          </div>
        </div>

        <button
          onClick={handleSavePreferences}
          className="btn btn-secondary"
          style={{ width: '100%', marginTop: 6 }}
        >
          {saveSuccess ? (
            <>
              <Check size={16} color="#4C7047" />
              Saved Successfully
            </>
          ) : (
            'Save Cycle Settings'
          )}
        </button>
      </div>

      {/* Reminder & Sound Preferences */}
      <div className="card" style={{ padding: '20px', marginBottom: 16 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
          <Bell size={18} color="#6F3347" />
          <h2 style={{ fontSize: '16px', color: '#30282B', fontWeight: 600 }}>
            Reminder & Sound Controls
          </h2>
        </div>

        <div className="form-group">
          <label className="form-label" htmlFor="settings-sound">Default Alarm Sound</label>
          <select
            id="settings-sound"
            className="form-select"
            value={alarmSound}
            onChange={(e) => {
              setAlarmSound(e.target.value);
              reminderEngine.playChime(e.target.value);
            }}
          >
            <option value="chime">Harmonic Chime</option>
            <option value="gentle">Gentle Chord</option>
            <option value="bell">Soft Bell</option>
            <option value="marimba">Warm Marimba</option>
          </select>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 0.8fr', gap: 12, marginBottom: 12 }}>
          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-label" htmlFor="settings-snooze">Default Snooze</label>
            <select
              id="settings-snooze"
              className="form-select"
              value={snoozeDuration}
              onChange={(e) => setSnoozeDuration(Number(e.target.value))}
            >
              <option value={5}>5 minutes</option>
              <option value={10}>10 minutes</option>
              <option value={15}>15 minutes</option>
              <option value={20}>20 minutes</option>
            </select>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
            <span className="form-label">Vibration</span>
            <div style={{ marginTop: 6 }}>
              <label className="toggle-switch">
                <input
                  type="checkbox"
                  checked={vibrationEnabled}
                  onChange={(e) => setVibrationEnabled(e.target.checked)}
                />
                <span className="toggle-slider" />
              </label>
            </div>
          </div>
        </div>

        {/* System Permission Status Row */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            padding: '12px',
            backgroundColor: '#FAF7F2',
            borderRadius: 12,
            marginTop: 10
          }}
        >
          <div>
            <div style={{ fontSize: '13px', fontWeight: 600, color: '#30282B' }}>
              System Notifications
            </div>
            <div style={{ fontSize: '11px', color: '#81777B' }}>
              Status: <span style={{ fontWeight: 600, color: permissionState === 'granted' ? '#4C7047' : '#C0394B' }}>{permissionState}</span>
            </div>
          </div>

          {permissionState !== 'granted' && (
            <button
              onClick={handleRequestPermission}
              className="btn-soft"
              style={{ padding: '6px 12px', fontSize: '12px', borderRadius: 12, border: 'none', cursor: 'pointer' }}
            >
              Enable
            </button>
          )}
        </div>
      </div>
    </div>

      {/* Right Column: Privacy & Data Management */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        {/* Privacy Guarantee Card */}
        <div className="card card-cream" style={{ padding: '20px', marginBottom: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
          <Shield size={20} color="#6F3347" />
          <h2 style={{ fontSize: '16px', color: '#30282B', fontWeight: 600 }}>
            Privacy Architecture
          </h2>
        </div>
        <p style={{ fontSize: '13px', color: '#81777B', lineHeight: 1.5, marginBottom: 12 }}>
          CycleCare is built on a <strong>local-first principle</strong>:
        </p>
        <ul style={{ fontSize: '12px', color: '#81777B', paddingLeft: 18, lineHeight: 1.6, display: 'flex', flexDirection: 'column', gap: 4 }}>
          <li>No account or email registration required for core features.</li>
          <li>Your cycle dates and reminder schedules are saved only inside your browser’s local IndexedDB.</li>
          <li>Health data is never silently uploaded to third parties or cloud servers.</li>
          <li>No personal health information is captured in analytics or error reports.</li>
        </ul>
      </div>

        {/* Install Web Application Card */}
        <div className="card" style={{ padding: '20px', marginBottom: 0, border: '1px solid #E4C8CF', background: 'linear-gradient(135deg, #FFFFFF 0%, #FAF0F2 100%)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
            <div style={{ width: 34, height: 34, borderRadius: 10, backgroundColor: '#FAF0F2', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Download size={18} color="#6F3347" />
            </div>
            <div>
              <h2 style={{ fontSize: '16px', color: '#30282B', fontWeight: 700 }}>
                Download & Install App
              </h2>
              <span style={{ fontSize: '11px', color: '#6F3347', fontWeight: 600 }}>
                Progressive Web App (PWA)
              </span>
            </div>
          </div>
          <p style={{ fontSize: '12px', color: '#81777B', lineHeight: 1.5, marginBottom: 14 }}>
            Install CycleCare on your mobile home screen or computer desktop. Launch in full-screen with fast offline support and zero app store required.
          </p>
          <button
            type="button"
            onClick={onOpenInstallModal}
            className="btn btn-primary"
            style={{ width: '100%', justifyContent: 'center', fontSize: '13px', padding: '10px 16px' }}
          >
            <Download size={15} />
            <span>Install CycleCare App</span>
          </button>
        </div>

        {/* Data Management Actions */}
        <div className="card" style={{ padding: '20px', marginBottom: 16 }}>
          <h2 style={{ fontSize: '16px', color: '#30282B', marginBottom: 12, fontWeight: 600 }}>
            Data Management
          </h2>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <button
            onClick={handleExportData}
            className="btn btn-secondary"
            style={{ width: '100%', justifyContent: 'flex-start' }}
          >
            <Download size={16} color="#6F3347" />
            Export Personal Data (JSON Backup)
          </button>

          <button
            onClick={handleSeedSample}
            className="btn btn-secondary"
            style={{ width: '100%', justifyContent: 'flex-start' }}
          >
            <Sparkles size={16} color="#6F3347" />
            Load Realistic Demo Sample Data
          </button>

          <button
            onClick={() => setShowDeleteModal(true)}
            className="btn"
            style={{
              width: '100%',
              justifyContent: 'flex-start',
              backgroundColor: '#FDECEF',
              color: '#C0394B',
              border: '1px solid #F6C8D1'
            }}
          >
            <Trash2 size={16} />
            Delete All Personal Data
          </button>
        </div>
      </div>

      {/* About Section */}
      <div style={{ textAlign: 'center', padding: '10px 0', fontSize: '12px', color: '#81777B' }}>
        <div style={{ fontWeight: 600, color: '#6F3347' }}>CycleCare v1.0.0</div>
        <div>Your Health. Your Rhythm. Your Care.</div>
        <div style={{ fontSize: '11px', marginTop: 4 }}>
          Offline-first React & Android architecture
        </div>
      </div>
      </div>
    </div>

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <div className="modal-overlay" onClick={() => setShowDeleteModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div style={{ textAlign: 'center', marginBottom: 16 }}>
              <div
                style={{
                  width: 50,
                  height: 50,
                  borderRadius: '50%',
                  backgroundColor: '#FDECEF',
                  margin: '0 auto 12px auto',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
              >
                <Trash2 size={24} color="#C0394B" />
              </div>
              <h2 style={{ fontSize: '18px', color: '#30282B', marginBottom: 6 }}>
                Delete All Data?
              </h2>
              <p style={{ fontSize: '13px', color: '#81777B', lineHeight: 1.5 }}>
                This will permanently erase all logged period entries, cycle predictions, medicine reminders, and personal settings from your local device.
              </p>
            </div>

            <div style={{ display: 'flex', gap: 10 }}>
              <button
                type="button"
                onClick={() => setShowDeleteModal(false)}
                className="btn btn-secondary"
                style={{ flex: 1 }}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={async () => {
                  await clearAllUserData();
                  await onResetData();
                  setShowDeleteModal(false);
                }}
                className="btn btn-danger"
                style={{ flex: 1 }}
              >
                Yes, Delete All
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
