import { ChevronLeft, ChevronRight } from 'lucide-preact';

interface NavProps {
  current: 'today' | 'week' | 'month' | 'weight' | 'settings';
  onNavigate: (view: 'today' | 'week' | 'month' | 'weight' | 'settings') => void;
}

export function BottomNav({ current, onNavigate }: NavProps) {
  const items = [
    { id: 'today' as const, label: 'Today' },
    { id: 'week' as const, label: 'Week' },
    { id: 'month' as const, label: 'Month' },
  ];

  return (
    <nav class="nav-bottom">
      <div class="max-w-md mx-auto flex items-center justify-center">
        {items.map((item) => (
          <button
            key={item.id}
            onClick={() => onNavigate(item.id)}
            class={`nav-item ${current === item.id ? 'active' : ''}`}
          >
            {item.label}
          </button>
        ))}
      </div>
    </nav>
  );
}

interface HeaderProps {
  title: string;
  subtitle?: string;
  onSettingsClick?: () => void;
}

export function Header({ title, subtitle, onSettingsClick }: HeaderProps) {
  return (
    <header class="sticky top-0 z-40" style={{ background: 'var(--bg)' }}>
      <div class="container-app py-4 flex items-center justify-between">
        <div>
          <h1 class="text-lg font-semibold">{title}</h1>
          {subtitle && (
            <p class="text-xs week-badge">{subtitle}</p>
          )}
        </div>
        {onSettingsClick && (
          <button
            onClick={onSettingsClick}
            class="nav-item cursor-pointer"
            aria-label="Settings"
          >
            Settings
          </button>
        )}
      </div>
    </header>
  );
}

interface DateNavProps {
  displayText: string;
  onPrev: () => void;
  onNext: () => void;
  onToday?: () => void;
  showToday?: boolean;
}

// The date is a title and reads at the left edge of the reading column. The chevrons
// are controls, so they sit together at the right. A `‹ Wednesday, Jul 8 ›` cluster
// centred in the viewport reads as decoration and hides where the column begins.
export function DateNav({ displayText, onPrev, onNext, onToday, showToday = false }: DateNavProps) {
  return (
    <div class="flex items-center justify-between py-3">
      <div class="flex items-baseline gap-2 min-w-0">
        <button onClick={onToday} class="cursor-pointer date-display">
          {displayText}
        </button>
        {showToday && onToday && (
          <button
            onClick={onToday}
            class="text-xs cursor-pointer font-medium flex-shrink-0"
            style={{ color: 'var(--text)' }}
          >
            Today
          </button>
        )}
      </div>

      <div class="flex items-center flex-shrink-0">
        <button
          onClick={onPrev}
          class="touch-target flex items-center justify-center cursor-pointer"
          aria-label="Previous day"
          style={{ color: 'var(--text-dim)' }}
        >
          <ChevronLeft size={20} />
        </button>
        <button
          onClick={onNext}
          class="touch-target flex items-center justify-center cursor-pointer"
          aria-label="Next day"
          style={{ color: 'var(--text-dim)' }}
        >
          <ChevronRight size={20} />
        </button>
      </div>
    </div>
  );
}
