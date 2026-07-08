import { useState, useEffect } from 'preact/hooks';
import { BottomNav, Header } from './components/Navigation';
import { TodayView } from './views/TodayView';
import { WeekView } from './views/WeekView';
import { MonthView } from './views/MonthView';
import { SettingsView } from './views/SettingsView';
import { ReadinessScreen } from './components/ReadinessScreen';
import { getSettings, saveSettings, getReadiness, saveReadiness } from './db';
import { getCurrentWeek } from './data/workouts';
import { formatDateString } from './hooks/useDate';

type View = 'today' | 'week' | 'month' | 'weight' | 'settings';

export function App() {
  const [currentView, setCurrentView] = useState<View>('today');
  const [startDate, setStartDate] = useState(new Date('2025-01-06'));
  const [weightUnit, setWeightUnit] = useState<'kg' | 'lbs'>('lbs');
  const [needsReadiness, setNeedsReadiness] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadSettings = async () => {
      const settings = await getSettings();
      if (settings?.startDate) {
        setStartDate(new Date(settings.startDate));
        setWeightUnit(settings.weightUnit);
      } else {
        const defaultStart = new Date('2025-01-06');
        await saveSettings({
          startDate: '2025-01-06',
          weightUnit: 'lbs',
          theme: 'dark',
        });
        setStartDate(defaultStart);
      }

      // Nobody starts loading their hips without being asked the seven questions.
      setNeedsReadiness(!(await getReadiness())?.acknowledgedDisclaimer);
      setLoading(false);
    };
    loadSettings();
  }, []);

  const completeReadiness = async (flaggedQuestionIds: string[]) => {
    await saveReadiness({
      date: formatDateString(new Date()),
      flaggedQuestionIds,
      acknowledgedDisclaimer: true,
    });
    setNeedsReadiness(false);
  };

  const handleDayClick = () => {
    setCurrentView('today');
  };

  const handleStartDateChange = (date: Date) => {
    setStartDate(date);
  };

  const week = getCurrentWeek(startDate);

  if (loading) {
    return (
      <div class="min-h-screen flex items-center justify-center" style={{ background: 'var(--bg)' }}>
        <p style={{ color: 'var(--text-dim)' }}>Loading...</p>
      </div>
    );
  }

  const getHeaderInfo = () => {
    switch (currentView) {
      case 'today':
        return { title: 'Idaraya', subtitle: `Week ${week}` };
      case 'week':
        return { title: 'Week', subtitle: '' };
      case 'month':
        return { title: 'Month', subtitle: '' };
      default:
        return { title: 'Idaraya', subtitle: '' };
    }
  };

  const headerInfo = getHeaderInfo();

  if (needsReadiness) {
    return <ReadinessScreen onComplete={completeReadiness} />;
  }

  return (
    <div class="min-h-screen" style={{ background: 'var(--bg)' }}>
      {currentView !== 'settings' && (
        <Header
          title={headerInfo.title}
          subtitle={headerInfo.subtitle}
          onSettingsClick={() => setCurrentView('settings')}
        />
      )}

      <main>
        {currentView === 'today' && <TodayView startDate={startDate} weightUnit={weightUnit} />}
        {currentView === 'week' && (
          <WeekView startDate={startDate} onDayClick={handleDayClick} />
        )}
        {currentView === 'month' && (
          <MonthView startDate={startDate} onDayClick={handleDayClick} />
        )}
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
