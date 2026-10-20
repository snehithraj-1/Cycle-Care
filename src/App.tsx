import React, { useState, useEffect, useCallback } from 'react';
import {
  Home,
  Calendar as CalendarIcon,
  Bell,
  Settings as SettingsIcon,
  Sparkles,
  PlusCircle,
  Smartphone,
  Monitor,
  ChevronLeft,
  ChevronRight,
  Clock,
  Download
} from 'lucide-react';
import type { AppScreen, UserProfile, PeriodEntry, ReminderItem, ReminderLog } from './types';
import { db } from './db';
import { calculateCycleStats, getTodayDateStr } from './services/cycleEngine';
import { reminderEngine } from './services/reminderEngine';
import { CycleCareLogo } from './components/illustrations/BotanicalDecor';
import { InstallAppModal } from './components/InstallAppModal';

// 10 Screens + Period History Manager
import { Screen01Splash } from './components/screens/Screen01Splash';
import { Screen02Onboarding } from './components/screens/Screen02Onboarding';
import { Screen03HomeDashboard } from './components/screens/Screen03HomeDashboard';
import { Screen04PeriodCalendar } from './components/screens/Screen04PeriodCalendar';
import { Screen05LogPeriod } from './components/screens/Screen05LogPeriod';
import { Screen06CycleInsights } from './components/screens/Screen06CycleInsights';
import { Screen07RemindersDashboard } from './components/screens/Screen07RemindersDashboard';
import { Screen08AddMedicineReminder } from './components/screens/Screen08AddMedicineReminder';
import { Screen09AlarmExperience } from './components/screens/Screen09AlarmExperience';
import { Screen10SettingsPrivacy } from './components/screens/Screen10SettingsPrivacy';
import { ScreenPeriodHistory } from './components/screens/ScreenPeriodHistory';

export default function App() {
  const [currentScreen, setCurrentScreen] = useState<AppScreen>('dashboard');
  const [profile, setProfile] = useState<UserProfile | undefined>(undefined);
  const [periods, setPeriods] = useState<PeriodEntry[]>([]);
  const [reminders, setReminders] = useState<ReminderItem[]>([]);
  const [reminderLogs, setReminderLogs] = useState<ReminderLog[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Responsive view mode on desktop: 'responsive' (full site) vs 'simulator' (mobile phone shell)
  const [viewMode, setViewMode] = useState<'responsive' | 'simulator'>('responsive');
  const [sidebarCollapsed, setSidebarCollapsed] = useState<boolean>(false);

  // PWA Web App Download / Install State
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [installModalOpen, setInstallModalOpen] = useState<boolean>(false);
  const [isInstalled, setIsInstalled] = useState<boolean>(false);

  // Modals / Overlays
  const [logPeriodOpen, setLogPeriodOpen] = useState<boolean>(false);
  const [logPeriodPrefillDate, setLogPeriodPrefillDate] = useState<string | undefined>(undefined);
  const [editingPeriod, setEditingPeriod] = useState<PeriodEntry | null>(null);

  const [addReminderOpen, setAddReminderOpen] = useState<boolean>(false);
  const [editingReminder, setEditingReminder] = useState<ReminderItem | null>(null);

  const [activeAlarmReminder, setActiveAlarmReminder] = useState<ReminderItem | null>(null);

  // PWA installation listener
  useEffect(() => {
    // Check if app is already running in standalone PWA mode
    if (window.matchMedia('(display-mode: standalone)').matches || (navigator as any).standalone) {
      setIsInstalled(true);
    }

    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };

    const handleAppInstalled = () => {
      setIsInstalled(true);
      setDeferredPrompt(null);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  // Load database state
  const loadData = useCallback(async () => {
    try {
      const profiles = await db.profile.toArray();
      const currentProfile = profiles[0];
      setProfile(currentProfile);

      // If user hasn't completed onboarding or has no profile, show onboarding/splash
      if (!currentProfile || !currentProfile.hasCompletedOnboarding) {
        setCurrentScreen('onboarding');
      }

      const allPeriods = await db.periods.toArray();
      setPeriods(allPeriods);

      const allReminders = await db.reminders.toArray();
      setReminders(allReminders);

      const allLogs = await db.reminderLogs.toArray();
      setReminderLogs(allLogs);
    } catch (err) {
      console.error('Error reading Dexie database:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Compute live cycle stats using shared cycleEngine
  const cycleStats = calculateCycleStats(profile, periods);

  // Handlers for Period Logging
  const handleSavePeriod = async (
    entryData: Omit<PeriodEntry, 'id' | 'createdAt'>,
    existingId?: number
  ) => {
    if (existingId) {
      await db.periods.update(existingId, entryData);
    } else {
      await db.periods.add({
        ...entryData,
        createdAt: new Date().toISOString()
      });
    }
    await loadData();
    setLogPeriodOpen(false);
    setEditingPeriod(null);
  };

  const handleDeletePeriod = async (id: number) => {
    await db.periods.delete(id);
    await loadData();
  };

  // Handlers for Reminders
  const handleSaveReminder = async (
    reminderData: Omit<ReminderItem, 'id' | 'createdAt'>,
    existingId?: number
  ) => {
    if (existingId) {
      await db.reminders.update(existingId, reminderData);
    } else {
      await db.reminders.add({
        ...reminderData,
        createdAt: new Date().toISOString()
      });
    }
    await loadData();
    setAddReminderOpen(false);
    setEditingReminder(null);
  };

  const handleToggleReminder = async (id: number, enabled: boolean) => {
    await db.reminders.update(id, { enabled });
    await loadData();
  };

  const handleDeleteReminder = async (id: number) => {
    await db.reminders.delete(id);
    await loadData();
  };

  const handleMarkTaken = async (reminder: ReminderItem) => {
    await reminderEngine.logReminderAction(reminder, 'taken');
    await loadData();
  };

  // Handlers for Alarm Experience
  const handleAlarmDismiss = async () => {
    if (activeAlarmReminder) {
      await reminderEngine.logReminderAction(activeAlarmReminder, 'dismissed');
      await loadData();
    }
    setActiveAlarmReminder(null);
  };

  const handleAlarmSnooze = async (minutes: number) => {
    if (activeAlarmReminder) {
      await reminderEngine.logReminderAction(activeAlarmReminder, 'snoozed');
      await loadData();
    }
    setActiveAlarmReminder(null);
  };

  const handleAlarmMarkTaken = async () => {
    if (activeAlarmReminder) {
      await reminderEngine.logReminderAction(activeAlarmReminder, 'taken');
      await loadData();
    }
    setActiveAlarmReminder(null);
  };

  // Profile preferences
  const handleUpdateProfile = async (updated: Partial<UserProfile>) => {
    if (profile?.id) {
      await db.profile.update(profile.id, updated);
    } else {
      await db.profile.add({
        name: updated.name || 'Friend',
        cycleLength: updated.cycleLength || 28,
        periodLength: updated.periodLength || 5,
        hasCompletedOnboarding: true,
        notificationsEnabled: true,
        alarmSound: updated.alarmSound || 'chime',
        vibrationEnabled: updated.vibrationEnabled !== undefined ? updated.vibrationEnabled : true,
        snoozeDuration: updated.snoozeDuration || 10,
        theme: 'light',
        createdAt: new Date().toISOString()
      });
    }
    await loadData();
  };

  const handleResetAllData = async () => {
    await loadData();
    setCurrentScreen('onboarding');
  };

  // Nav items list for Sidebar & Bottom Bar with dynamic badge counts
  const navItems = [
    { id: 'dashboard' as AppScreen, label: 'Home', icon: Home },
    { id: 'calendar' as AppScreen, label: 'Cycle Calendar', icon: CalendarIcon },
    { id: 'period-history' as AppScreen, label: 'Period History', icon: Clock },
    { id: 'insights' as AppScreen, label: 'Cycle Insights', icon: Sparkles },
    { id: 'reminders' as AppScreen, label: 'Reminders', icon: Bell, badge: reminders.filter(r => r.enabled).length },
    { id: 'settings' as AppScreen, label: 'Settings', icon: SettingsIcon }
  ];

  // Helper for rendering the active screen body
  const renderScreenContent = () => {
    switch (currentScreen) {
      case 'splash':
        return (
          <div className="onboarding-screen-wrapper">
            <div className="onboarding-card">
              <Screen01Splash
                onContinue={() => {
                  if (profile?.hasCompletedOnboarding) {
                    setCurrentScreen('dashboard');
                  } else {
                    setCurrentScreen('onboarding');
                  }
                }}
              />
            </div>
          </div>
        );
      case 'onboarding':
        return (
          <div className="onboarding-screen-wrapper">
            <div className="onboarding-card">
              <Screen02Onboarding
                onComplete={() => {
                  loadData();
                  setCurrentScreen('dashboard');
                }}
                onSkip={() => {
                  setCurrentScreen('dashboard');
                }}
              />
            </div>
          </div>
        );
      case 'dashboard':
        return (
          <Screen03HomeDashboard
            profile={profile}
            stats={cycleStats}
            periods={periods}
            reminders={reminders}
            onNavigate={(screen) => setCurrentScreen(screen)}
            onOpenLogPeriod={() => {
              setEditingPeriod(null);
              setLogPeriodPrefillDate(undefined);
              setLogPeriodOpen(true);
            }}
            onOpenAddReminder={() => {
              setEditingReminder(null);
              setAddReminderOpen(true);
            }}
            onMarkReminderTaken={handleMarkTaken}
            onTriggerAlarmTest={(reminder) => setActiveAlarmReminder(reminder)}
            onOpenInstallModal={() => setInstallModalOpen(true)}
          />
        );
      case 'calendar':
        return (
          <Screen04PeriodCalendar
            periods={periods}
            stats={cycleStats}
            onOpenLogPeriod={(dateStr, existing) => {
              setLogPeriodPrefillDate(dateStr);
              setEditingPeriod(existing || null);
              setLogPeriodOpen(true);
            }}
            onDeletePeriod={handleDeletePeriod}
          />
        );
      case 'period-history':
        return (
          <ScreenPeriodHistory
            periods={periods}
            stats={cycleStats}
            profile={profile}
            onAddPeriod={async (entry) => {
              await db.periods.add({
                ...entry,
                createdAt: new Date().toISOString()
              });
              await loadData();
            }}
            onUpdatePeriod={async (id, entry) => {
              await db.periods.update(id, entry);
              await loadData();
            }}
            onDeletePeriod={async (id) => {
              await db.periods.delete(id);
              await loadData();
            }}
            onDone={() => setCurrentScreen('dashboard')}
          />
        );
      case 'insights':
        return (
          <Screen06CycleInsights
            stats={cycleStats}
            periods={periods}
            profile={profile}
            onBack={() => setCurrentScreen('dashboard')}
            onOpenLogPeriod={() => {
              setEditingPeriod(null);
              setLogPeriodPrefillDate(undefined);
              setLogPeriodOpen(true);
            }}
          />
        );
      case 'reminders':
        return (
          <Screen07RemindersDashboard
            reminders={reminders}
            reminderLogs={reminderLogs}
            onOpenAddReminder={(existing) => {
              setEditingReminder(existing || null);
              setAddReminderOpen(true);
            }}
            onToggleReminder={handleToggleReminder}
            onDeleteReminder={handleDeleteReminder}
            onMarkTaken={handleMarkTaken}
            onSimulateAlarm={(rem) => setActiveAlarmReminder(rem)}
          />
        );
      case 'settings':
        return (
          <Screen10SettingsPrivacy
            profile={profile}
            onUpdateProfile={handleUpdateProfile}
            onResetData={handleResetAllData}
            onBack={() => setCurrentScreen('dashboard')}
            onOpenInstallModal={() => setInstallModalOpen(true)}
          />
        );
      default:
        return null;
    }
  };

  // Full Screen Overlays (Modals & Alarm)
  const renderModals = () => (
    <>
      {logPeriodOpen && (
        <Screen05LogPeriod
          initialDate={logPeriodPrefillDate}
          existingEntry={editingPeriod}
          periods={periods}
          onSave={handleSavePeriod}
          onDelete={editingPeriod?.id ? handleDeletePeriod : undefined}
          onCancel={() => {
            setLogPeriodOpen(false);
            setEditingPeriod(null);
          }}
        />
      )}

      {addReminderOpen && (
        <Screen08AddMedicineReminder
          existingReminder={editingReminder}
          onSave={handleSaveReminder}
          onDelete={editingReminder?.id ? handleDeleteReminder : undefined}
          onCancel={() => {
            setAddReminderOpen(false);
            setEditingReminder(null);
          }}
        />
      )}

      {activeAlarmReminder && (
        <Screen09AlarmExperience
          reminder={activeAlarmReminder}
          onMarkTaken={handleAlarmMarkTaken}
          onSnooze={handleAlarmSnooze}
          onDismiss={handleAlarmDismiss}
        />
      )}

      <InstallAppModal
        isOpen={installModalOpen}
        onClose={() => setInstallModalOpen(false)}
        deferredPrompt={deferredPrompt}
        onInstallSuccess={() => setIsInstalled(true)}
      />
    </>
  );

  // If in Simulator Mode (Desktop mobile phone preview)
  if (viewMode === 'simulator') {
    return (
      <div className="simulator-overlay">
        {/* Top Control Bar to toggle back to Responsive View */}
        <div
          style={{
            position: 'fixed',
            top: 14,
            zIndex: 100,
            display: 'flex',
            alignItems: 'center',
            gap: 12,
            padding: '8px 18px',
            backgroundColor: 'rgba(255, 255, 255, 0.95)',
            backdropFilter: 'blur(12px)',
            borderRadius: 30,
            boxShadow: '0 4px 20px rgba(0,0,0,0.12)',
            border: '1px solid #EFE8DE'
          }}
        >
          <span style={{ fontSize: '13px', fontWeight: 600, color: '#30282B' }}>
            📱 Mobile Simulator Preview
          </span>
          <button
            onClick={() => setViewMode('responsive')}
            className="btn btn-primary"
            style={{ padding: '6px 14px', fontSize: '12px' }}
          >
            <Monitor size={14} />
            Switch to Full Responsive Website
          </button>
        </div>

        <div className="simulator-phone">
          <div style={{ flex: 1, overflowY: 'auto', position: 'relative' }}>
            {renderScreenContent()}
          </div>

          {currentScreen !== 'splash' && currentScreen !== 'onboarding' && (
            <nav className="bottom-nav" style={{ position: 'sticky', bottom: 0 }}>
              {navItems.map((item) => {
                const IconComponent = item.icon;
                const isActive = currentScreen === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => setCurrentScreen(item.id)}
                    className={`nav-item ${isActive ? 'active' : ''}`}
                  >
                    <div className="nav-icon-wrapper" style={{ position: 'relative' }}>
                      <IconComponent size={19} />
                      {item.badge && item.badge > 0 ? (
                        <span
                          style={{
                            position: 'absolute',
                            top: -2,
                            right: -4,
                            width: 14,
                            height: 14,
                            borderRadius: '50%',
                            backgroundColor: '#6F3347',
                            color: '#FFFFFF',
                            fontSize: '9px',
                            fontWeight: 700,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center'
                          }}
                        >
                          {item.badge}
                        </span>
                      ) : null}
                    </div>
                    <span>{item.label.split(' ')[0]}</span>
                  </button>
                );
              })}
            </nav>
          )}
        </div>
        {renderModals()}
      </div>
    );
  }

  // STANDARD RESPONSIVE WEB APPLICATION (Adapts dynamically to Desktop, Laptop, Tablet, & Mobile)
  return (
    <div className="app-shell">
      {/* 1. DESKTOP / TABLET SIDEBAR */}
      {currentScreen !== 'splash' && currentScreen !== 'onboarding' && (
        <aside className={`app-sidebar ${sidebarCollapsed ? 'collapsed' : ''}`}>
          <div>
            {/* Brand Header */}
            <div
              className="sidebar-brand"
              onClick={() => setCurrentScreen('dashboard')}
            >
              <div
                style={{
                  width: 44,
                  height: 44,
                  borderRadius: 14,
                  backgroundColor: '#FFFFFF',
                  boxShadow: '0 4px 14px rgba(111, 51, 71, 0.08)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  border: '1px solid #EFE8DE',
                  flexShrink: 0
                }}
              >
                <CycleCareLogo size={30} />
              </div>
              <div className="sidebar-brand-text">
                <span className="sidebar-brand-title">CycleCare</span>
                <span className="sidebar-brand-tagline">Your Health. Your Rhythm.</span>
              </div>
            </div>

            {/* Navigation List */}
            <ul className="sidebar-nav-list">
              {navItems.map((item) => {
                const IconComp = item.icon;
                const isActive = currentScreen === item.id;
                return (
                  <li key={item.id}>
                    <button
                      onClick={() => setCurrentScreen(item.id)}
                      className={`sidebar-nav-item ${isActive ? 'active' : ''}`}
                      title={item.label}
                    >
                      <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                        <IconComp size={19} style={{ flexShrink: 0 }} />
                        {item.badge && item.badge > 0 ? (
                          <span
                            style={{
                              position: 'absolute',
                              top: -4,
                              right: -6,
                              width: 14,
                              height: 14,
                              borderRadius: '50%',
                              backgroundColor: '#6F3347',
                              color: '#FFFFFF',
                              fontSize: '9px',
                              fontWeight: 700,
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center'
                            }}
                          >
                            {item.badge}
                          </span>
                        ) : null}
                      </div>
                      <span className="sidebar-nav-label" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
                        <span>{item.label}</span>
                        {item.badge && item.badge > 0 && !sidebarCollapsed ? (
                          <span
                            style={{
                              fontSize: '11px',
                              fontWeight: 700,
                              padding: '1px 7px',
                              borderRadius: 10,
                              backgroundColor: isActive ? 'rgba(111, 51, 71, 0.15)' : '#FAF0F2',
                              color: '#6F3347'
                            }}
                          >
                            {item.badge}
                          </span>
                        ) : null}
                      </span>
                    </button>
                  </li>
                );
              })}
            </ul>

            {/* Quick Action Button in Sidebar */}
            <div className="sidebar-quick-btn">
              <button
                onClick={() => {
                  setEditingPeriod(null);
                  setLogPeriodPrefillDate(undefined);
                  setLogPeriodOpen(true);
                }}
                className="btn btn-primary"
                style={{ width: '100%', fontSize: '13px', padding: '11px 16px', borderRadius: 16 }}
              >
                <PlusCircle size={16} />
                <span>Log Period</span>
              </button>

              {/* Install / Download App Sidebar Trigger */}
              {!sidebarCollapsed ? (
                <button
                  onClick={() => setInstallModalOpen(true)}
                  className="btn-soft"
                  style={{
                    width: '100%',
                    marginTop: 8,
                    fontSize: '12px',
                    padding: '9px 14px',
                    borderRadius: 14,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 6,
                    color: '#6F3347',
                    backgroundColor: '#FAF0F2',
                    border: '1px solid #F2D8DC',
                    cursor: 'pointer'
                  }}
                  title="Download and Install Web App"
                >
                  <Download size={14} />
                  <span>{isInstalled ? 'App Installed' : 'Download App'}</span>
                </button>
              ) : (
                <button
                  onClick={() => setInstallModalOpen(true)}
                  className="btn-icon"
                  style={{
                    width: 44,
                    height: 44,
                    marginTop: 8,
                    borderRadius: 14,
                    backgroundColor: '#FAF0F2',
                    border: '1px solid #F2D8DC'
                  }}
                  title="Download and Install Web App"
                >
                  <Download size={16} color="#6F3347" />
                </button>
              )}
            </div>
          </div>

          {/* Sidebar Footer */}
          <div className="sidebar-footer">
            <div className="sidebar-user-info">
              <div style={{ fontSize: '13px', fontWeight: 700, color: '#30282B' }}>
                {profile?.name || 'My CycleCare'}
              </div>
              <div style={{ fontSize: '11px', color: '#6F3347', display: 'flex', alignItems: 'center', gap: 4, marginTop: 1 }}>
                <span style={{ width: 6, height: 6, borderRadius: '50%', backgroundColor: '#6F3347' }} />
                Offline & Private
              </div>
            </div>

            <button
              onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
              className="btn-icon"
              title={sidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
              style={{ width: 34, height: 34 }}
            >
              {sidebarCollapsed ? <ChevronRight size={14} /> : <ChevronLeft size={14} />}
            </button>
          </div>
        </aside>
      )}

      {/* 2. MAIN CONTENT WRAPPER */}
      <div className="main-wrapper">
        {/* Desktop / Tablet Contextual Top Header */}
        {currentScreen !== 'splash' && currentScreen !== 'onboarding' && (
          <header className="desktop-header">
            <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
              <span style={{ fontSize: '15px', fontWeight: 700, color: '#6F3347' }}>
                {navItems.find((n) => n.id === currentScreen)?.label || 'CycleCare'}
              </span>

              {/* Cycle status pill */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                  padding: '4px 12px',
                  borderRadius: 20,
                  backgroundColor: '#FAF0F2',
                  border: '1px solid #F2D8DC',
                  fontSize: '12px',
                  color: '#6F3347',
                  fontWeight: 600
                }}
              >
                <Sparkles size={13} color="#6F3347" />
                <span>
                  {cycleStats.status === 'multiple_dates' || cycleStats.status === 'single_date'
                    ? `Day ${cycleStats.currentCycleDay || 1} • ${cycleStats.averageCycleLength ? `~${cycleStats.averageCycleLength}d rhythm` : 'Observing'}`
                    : 'Private offline tracking'}
                </span>
              </div>
            </div>

            {/* View Mode Switcher + Test Triggers */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              {/* Quick Log button on desktop header */}
              <button
                onClick={() => {
                  setEditingPeriod(null);
                  setLogPeriodPrefillDate(undefined);
                  setLogPeriodOpen(true);
                }}
                className="btn btn-primary"
                style={{ fontSize: '12px', padding: '7px 14px', borderRadius: 20 }}
              >
                <PlusCircle size={14} />
                <span>Log Period</span>
              </button>

              {/* Download / Install Web App Button */}
              <button
                onClick={() => setInstallModalOpen(true)}
                className="btn-soft"
                style={{
                  fontSize: '12px',
                  padding: '7px 12px',
                  borderRadius: 20,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                  color: '#6F3347',
                  backgroundColor: '#FAF0F2',
                  border: '1px solid #F2D8DC',
                  fontWeight: 600
                }}
                title="Download & Install Application"
              >
                <Download size={14} color="#6F3347" />
                <span>{isInstalled ? 'App Installed' : 'Download App'}</span>
              </button>

              {/* Simulator Preview Toggle */}
              <button
                onClick={() => setViewMode('simulator')}
                className="btn btn-secondary"
                style={{ fontSize: '12px', padding: '7px 12px', borderRadius: 20 }}
                title="Preview Mobile Smartphone Layout"
              >
                <Smartphone size={14} color="#6F3347" />
                <span>Mobile Preview</span>
              </button>

              {/* Alarm Simulation Trigger */}
              <button
                onClick={() => {
                  const testRem: ReminderItem = reminders[0] || {
                    name: 'Daily Iron & Folic Acid',
                    description: 'Take after breakfast with water',
                    startDate: getTodayDateStr(),
                    time: '09:00',
                    frequency: 'daily',
                    reminderType: 'alarm',
                    sound: 'chime',
                    vibration: true,
                    snoozeMinutes: 10,
                    enabled: true,
                    createdAt: new Date().toISOString()
                  };
                  setActiveAlarmReminder(testRem);
                }}
                className="btn-soft"
                style={{ fontSize: '12px', padding: '7px 12px', borderRadius: 20, cursor: 'pointer' }}
                title="Trigger simulated dark plum alarm screen"
              >
                🔔 Test Alarm
              </button>
            </div>
          </header>
        )}

        {/* Content Container */}
        <main className="main-content-container">
          {renderScreenContent()}
        </main>

        {/* 3. MOBILE-ONLY FIXED BOTTOM NAVIGATION BAR */}
        {currentScreen !== 'splash' && currentScreen !== 'onboarding' && (
          <nav className="bottom-nav">
            {navItems.map((item) => {
              const IconComp = item.icon;
              const isActive = currentScreen === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setCurrentScreen(item.id)}
                  className={`nav-item ${isActive ? 'active' : ''}`}
                >
                  <div className="nav-icon-wrapper" style={{ position: 'relative' }}>
                    <IconComp size={19} />
                    {item.badge && item.badge > 0 ? (
                      <span
                        style={{
                          position: 'absolute',
                          top: 0,
                          right: 4,
                          width: 14,
                          height: 14,
                          borderRadius: '50%',
                          backgroundColor: '#6F3347',
                          color: '#FFFFFF',
                          fontSize: '9px',
                          fontWeight: 700,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center'
                        }}
                      >
                        {item.badge}
                      </span>
                    ) : null}
                  </div>
                  <span>{item.label.split(' ')[0]}</span>
                </button>
              );
            })}
          </nav>
        )}
      </div>

      {/* Overlays / Modals */}
      {renderModals()}
    </div>
  );
}

