import { useState, useEffect } from 'preact/hooks';
import { format } from 'date-fns';
import { ArrowLeft, Calendar } from 'lucide-preact';
import { getSettings, saveSettings, type UserSettings } from '../db';
import { getCurrentWeek } from '../data/workouts';

interface SettingsViewProps {
  startDate: Date;
  onBack: () => void;
  onStartDateChange: (date: Date) => void;
}

export function SettingsView({ startDate, onBack, onStartDateChange }: SettingsViewProps) {
  const [settings, setSettings] = useState<Partial<UserSettings>>({
    startDate: format(startDate, 'yyyy-MM-dd'),
    weightUnit: 'lbs',
    theme: 'system',
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const loadSettings = async () => {
      const saved = await getSettings();
      if (saved) {
        setSettings(saved);
      }
    };
    loadSettings();
  }, []);

  const handleSave = async () => {
    setSaving(true);
    await saveSettings({
      startDate: settings.startDate || format(new Date(), 'yyyy-MM-dd'),
      weightUnit: settings.weightUnit || 'lbs',
      theme: settings.theme || 'system',
    });
    if (settings.startDate) {
      onStartDateChange(new Date(settings.startDate));
    }
    setSaving(false);
  };

  const currentWeek = getCurrentWeek(new Date(settings.startDate || startDate));

  return (
    <div class="container-app pb-safe-nav">
      {/* Header */}
      <div class="flex items-center gap-3 py-4">
        <button
          onClick={onBack}
          class="p-2 -ml-2 rounded-lg cursor-pointer"
          style={{ color: 'var(--text)' }}
          aria-label="Back"
        >
          <ArrowLeft size={20} />
        </button>
        <h1 class="text-lg font-semibold">Settings</h1>
      </div>

      {/* Start date */}
      <section class="mb-6">
        <h2 class="section-header">Program</h2>
        <div class="card">
          <label class="block text-sm mb-2" style={{ color: 'var(--text-muted)' }}>
            Start Date
          </label>
          <div class="flex items-center gap-3">
            <Calendar size={18} style={{ color: 'var(--text-dim)' }} />
            <input
              type="date"
              value={settings.startDate}
              onChange={(e) =>
                setSettings((s) => ({ ...s, startDate: (e.target as HTMLInputElement).value }))
              }
              class="flex-1 px-3 py-2 rounded-lg cursor-pointer"
              style={{ background: 'var(--bg)', color: 'var(--text)', border: '1px solid var(--border)' }}
            />
          </div>
          <p class="text-xs mt-2" style={{ color: 'var(--text-dim)' }}>
            Week {currentWeek}
          </p>
        </div>
      </section>

      {/* Weight unit */}
      <section class="mb-6">
        <h2 class="section-header">Units</h2>
        <div class="flex gap-2">
          {(['kg', 'lbs'] as const).map((unit) => (
            <button
              key={unit}
              onClick={() => setSettings((s) => ({ ...s, weightUnit: unit }))}
              class="flex-1 py-3 px-4 rounded-lg cursor-pointer"
              style={{
                background: settings.weightUnit === unit ? 'var(--text)' : 'var(--bg-alt)',
                color: settings.weightUnit === unit ? 'var(--bg)' : 'var(--text-muted)',
                fontWeight: settings.weightUnit === unit ? 500 : 400,
              }}
            >
              {unit}
            </button>
          ))}
        </div>
      </section>

      {/* Save */}
      <button
        onClick={handleSave}
        disabled={saving}
        class="w-full py-3 rounded-lg font-medium cursor-pointer"
        style={{
          background: 'var(--text)',
          color: 'var(--bg)',
          opacity: saving ? 0.5 : 1,
        }}
      >
        {saving ? 'Saving...' : 'Save'}
      </button>

      {/* About */}
      <section class="mt-8">
        <h2 class="section-header">About</h2>
        <p class="text-sm" style={{ color: 'var(--text-muted)' }}>
          Idaraya: minimalist movement practice.
        </p>
        <p class="text-xs mt-2" style={{ color: 'var(--text-dim)' }}>
          McGill Big 3 + Goblet Squat + Farmer's Carry + Hip Mobility
        </p>
      </section>
    </div>
  );
}
