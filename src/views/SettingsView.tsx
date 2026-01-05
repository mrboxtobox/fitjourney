import { useState, useEffect } from 'preact/hooks';
import { format } from 'date-fns';
import { ArrowLeft, Calendar, Moon, Sun, Smartphone, ExternalLink } from 'lucide-preact';
import { getSettings, saveSettings, type UserSettings } from '../db';
import { RECOMMENDED_CHANNELS } from '../data/videos';
import { PHASES, getCurrentWeek, getPhaseInfo } from '../data/workouts';

interface SettingsViewProps {
  startDate: Date;
  onBack: () => void;
  onStartDateChange: (date: Date) => void;
}

export function SettingsView({ startDate, onBack, onStartDateChange }: SettingsViewProps) {
  const [settings, setSettings] = useState<Partial<UserSettings>>({
    startDate: format(startDate, 'yyyy-MM-dd'),
    weightUnit: 'kg',
    theme: 'system',
  });
  const [saving, setSaving] = useState(false);

  // Load settings
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
      weightUnit: settings.weightUnit || 'kg',
      theme: settings.theme || 'system',
    });
    if (settings.startDate) {
      onStartDateChange(new Date(settings.startDate));
    }
    setSaving(false);
  };

  const currentWeek = getCurrentWeek(new Date(settings.startDate || startDate));
  const phaseInfo = getPhaseInfo(currentWeek);

  return (
    <div class="container-poster pb-safe-nav">
      {/* Header */}
      <div class="flex items-center gap-3 py-6">
        <button
          onClick={onBack}
          class="p-2 -ml-2 rounded-lg hover:bg-[var(--gray)] cursor-pointer transition-colors"
          aria-label="Back"
        >
          <ArrowLeft size={20} class="text-[var(--white)]" />
        </button>
        <h1 class="font-display text-2xl tracking-wide text-[var(--white)]">Settings</h1>
      </div>

      {/* Program settings */}
      <div class="card-dark p-5 mb-4">
        <h2 class="font-display text-lg tracking-wide text-[var(--white)] mb-4">Program</h2>

        <div class="space-y-4">
          <div>
            <label class="block text-sm text-[var(--white-muted)] mb-2">
              Program Start Date
            </label>
            <div class="flex items-center gap-3">
              <Calendar size={18} class="text-[var(--white-dim)]" />
              <input
                type="date"
                value={settings.startDate}
                onChange={(e) =>
                  setSettings((s) => ({ ...s, startDate: (e.target as HTMLInputElement).value }))
                }
                class="flex-1 px-3 py-2.5 bg-[var(--gray-light)] rounded-lg text-[var(--white)] focus:outline-none focus:ring-1 focus:ring-[var(--coral)]"
              />
            </div>
            <p class="text-xs text-[var(--white-dim)] mt-2">
              Currently on Week {currentWeek} ({phaseInfo.name} Phase)
            </p>
          </div>

          <div>
            <label class="block text-sm text-[var(--white-muted)] mb-2">Weight Unit</label>
            <div class="flex gap-2">
              {(['kg', 'lbs'] as const).map((unit) => (
                <button
                  key={unit}
                  onClick={() => setSettings((s) => ({ ...s, weightUnit: unit }))}
                  class={`flex-1 py-2.5 px-4 rounded-lg cursor-pointer transition-colors font-medium ${
                    settings.weightUnit === unit
                      ? 'bg-[var(--coral)] text-[var(--black)]'
                      : 'bg-[var(--gray-light)] text-[var(--white-muted)] hover:bg-[var(--gray-light)] hover:text-[var(--white)]'
                  }`}
                >
                  {unit}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Theme settings */}
      <div class="card-dark p-5 mb-4">
        <h2 class="font-display text-lg tracking-wide text-[var(--white)] mb-4">Appearance</h2>

        <div class="flex gap-2">
          {[
            { id: 'light' as const, icon: Sun, label: 'Light' },
            { id: 'dark' as const, icon: Moon, label: 'Dark' },
            { id: 'system' as const, icon: Smartphone, label: 'System' },
          ].map((theme) => (
            <button
              key={theme.id}
              onClick={() => setSettings((s) => ({ ...s, theme: theme.id }))}
              class={`flex-1 py-3 px-2 rounded-lg flex flex-col items-center gap-1.5 cursor-pointer transition-colors ${
                settings.theme === theme.id
                  ? 'bg-[var(--coral)] text-[var(--black)]'
                  : 'bg-[var(--gray-light)] text-[var(--white-muted)] hover:text-[var(--white)]'
              }`}
            >
              <theme.icon size={20} />
              <span class="text-sm font-medium">{theme.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Save button */}
      <button
        onClick={handleSave}
        disabled={saving}
        class="w-full py-3.5 rounded-lg font-semibold cursor-pointer transition-colors bg-[var(--coral)] text-[var(--black)] hover:bg-[var(--coral-dark)] disabled:opacity-50 mb-6"
      >
        {saving ? 'Saving...' : 'Save Settings'}
      </button>

      {/* Program phases info */}
      <div class="card-dark p-5 mb-4">
        <h2 class="font-display text-lg tracking-wide text-[var(--white)] mb-4">Program Phases</h2>
        <div class="space-y-4">
          {Object.entries(PHASES).map(([phase, info]) => (
            <div key={phase} class="pb-4 border-b border-[var(--gray-light)] last:border-0 last:pb-0">
              <div class="flex items-center justify-between mb-1">
                <span class="font-medium text-[var(--coral)]">{info.name}</span>
                <span class="text-sm text-[var(--white-dim)]">Weeks {info.weeks}</span>
              </div>
              <p class="text-sm text-[var(--white-muted)] mb-2">{info.description}</p>
              <div class="flex flex-wrap gap-1.5">
                {info.focus.map((f) => (
                  <span key={f} class="muscle-tag">
                    {f}
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Recommended channels */}
      <div class="card-dark p-5 mb-4">
        <h2 class="font-display text-lg tracking-wide text-[var(--white)] mb-4">Recommended YouTube Channels</h2>
        <div class="space-y-4">
          {RECOMMENDED_CHANNELS.map((channel) => (
            <a
              key={channel.name}
              href={channel.url}
              target="_blank"
              rel="noopener noreferrer"
              class="block group cursor-pointer"
            >
              <div class="flex items-start gap-3">
                <div class="flex-1">
                  <div class="font-medium text-[var(--white)] group-hover:text-[var(--coral)] flex items-center gap-1 transition-colors">
                    {channel.name}
                    <ExternalLink size={12} class="opacity-50" />
                  </div>
                  <p class="text-sm text-[var(--coral)]">{channel.specialty}</p>
                  <p class="text-sm text-[var(--white-dim)] mt-0.5">{channel.description}</p>
                </div>
              </div>
            </a>
          ))}
        </div>
      </div>

      {/* About */}
      <div class="card-dark p-5 mb-8">
        <h2 class="font-display text-lg tracking-wide text-[var(--white)] mb-3">About FitJourney</h2>
        <p class="text-sm text-[var(--white-muted)] mb-4">
          A 52-week progressive fitness program designed for beginners. Alternates between
          strength training (Mon/Wed/Fri) and active recovery days.
        </p>
        <div class="text-xs text-[var(--white-dim)] space-y-1">
          <p>Weeks 1-6: Bodyweight only (master form first)</p>
          <p>Weeks 7+: Light kettlebell (start with 5 lbs)</p>
          <p class="mt-2 text-[var(--white-muted)]">All exercises use bodyweight or kettlebells</p>
        </div>
      </div>
    </div>
  );
}
