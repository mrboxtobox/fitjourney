import { useState, useEffect } from 'preact/hooks';
import { BottomNav, Header } from './components/Navigation';
import { TodayView } from './views/TodayView';
import { WeekView } from './views/WeekView';
import { MonthView } from './views/MonthView';
import { WeightView } from './views/WeightView';
import { SettingsView } from './views/SettingsView';
import { getSettings, saveSettings } from './db';
import { getCurrentWeek, getPhaseInfo } from './data/workouts';

type View = 'today' | 'week' | 'month' | 'weight' | 'settings';

export function App() {
  const [currentView, setCurrentView] = useState<View>('today');
  const [startDate, setStartDate] = useState(new Date('2025-01-06'));
  const [loading, setLoading] = useState(true);

  // Load settings on mount
  useEffect(() => {
    const loadSettings = async () => {
      const settings = await getSettings();
      if (settings?.startDate) {
        setStartDate(new Date(settings.startDate));
      } else {
        // Set default start date and save
        const defaultStart = new Date('2025-01-06');
        await saveSettings({
          startDate: '2025-01-06',
          weightUnit: 'lbs',
          theme: 'dark',
        });
        setStartDate(defaultStart);
      }
      setLoading(false);
    };
    loadSettings();
  }, []);

  const handleDayClick = () => {
    // Navigate to that day in today view
    setCurrentView('today');
  };

  const handleStartDateChange = (date: Date) => {
    setStartDate(date);
  };

  const week = getCurrentWeek(startDate);
  const phaseInfo = getPhaseInfo(week);

  if (loading) {
    return (
      <div class="min-h-screen flex items-center justify-center" style={{ background: 'var(--black)' }}>
        <div class="text-center">
          <div
            class="w-12 h-12 border-4 rounded-full animate-spin mx-auto mb-4"
            style={{ borderColor: 'var(--gray)', borderTopColor: 'var(--coral)' }}
          />
          <p style={{ color: 'var(--white-dim)' }}>Loading your journey...</p>
        </div>
      </div>
    );
  }

  const getHeaderInfo = () => {
    switch (currentView) {
      case 'today':
        return { title: 'FitJourney', subtitle: `Week ${week} · ${phaseInfo.name}` };
      case 'week':
        return { title: 'Weekly View', subtitle: phaseInfo.name + ' Phase' };
      case 'month':
        return { title: 'Monthly View', subtitle: 'Track your progress' };
      case 'weight':
        return { title: 'Weight Tracker', subtitle: 'Monitor your journey' };
      default:
        return { title: 'FitJourney', subtitle: '' };
    }
  };

  const headerInfo = getHeaderInfo();

  return (
    <div class="min-h-screen" style={{ background: 'var(--black)' }}>
      {currentView !== 'settings' && (
        <Header
          title={headerInfo.title}
          subtitle={headerInfo.subtitle}
          onSettingsClick={() => setCurrentView('settings')}
        />
      )}

      <main class="relative z-10">
        {currentView === 'today' && <TodayView startDate={startDate} />}
        {currentView === 'week' && (
          <WeekView startDate={startDate} onDayClick={handleDayClick} />
        )}
        {currentView === 'month' && (
          <MonthView startDate={startDate} onDayClick={handleDayClick} />
        )}
        {currentView === 'weight' && <WeightView />}
        {currentView === 'settings' && (
          <SettingsView
            startDate={startDate}
            onBack={() => setCurrentView('today')}
            onStartDateChange={handleStartDateChange}
          />
        )}
      </main>

      {currentView !== 'settings' && (
        <BottomNav current={currentView} onNavigate={setCurrentView} />
      )}
    </div>
  );
}
