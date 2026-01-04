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
    { id: 'weight' as const, label: 'Weight' },
  ];

  return (
    <nav class="nav-bottom fixed bottom-0 left-0 right-0" style={{ paddingBottom: 'env(safe-area-inset-bottom, 0)' }}>
      <div class="max-w-md mx-auto flex items-center justify-around py-3">
        {items.map((item) => (
          <button
            key={item.id}
            onClick={() => onNavigate(item.id)}
            class={`nav-item touch-target flex items-center justify-center px-4 cursor-pointer transition-all ${current === item.id ? 'active' : ''}`}
          >
            <span class="text-sm" style={{ fontWeight: current === item.id ? 500 : 400 }}>{item.label}</span>
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
    <header
      class="sticky top-0 z-40"
      style={{
        background: 'var(--black)',
      }}
    >
      <div class="container-poster py-5 flex items-center justify-between">
        <div>
          <h1 class="font-display text-2xl tracking-wider" style={{ color: 'var(--white)' }}>
            {title.toUpperCase()}
          </h1>
          {subtitle && (
            <p class="text-sm mt-0.5" style={{ color: 'var(--white-dim)' }}>
              {subtitle}
            </p>
          )}
        </div>
        {onSettingsClick && (
          <button
            onClick={onSettingsClick}
            class="touch-target flex items-center justify-center cursor-pointer"
            aria-label="Settings"
          >
            <span class="text-sm" style={{ color: 'var(--white-muted)' }}>
              Settings
            </span>
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

export function DateNav({ displayText, onPrev, onNext, onToday, showToday = false }: DateNavProps) {
  return (
    <div class="flex items-center justify-between py-4">
      <button
        onClick={onPrev}
        class="touch-target flex items-center justify-center cursor-pointer"
        aria-label="Previous"
        style={{ color: 'var(--white-dim)' }}
      >
        <ChevronLeft size={24} />
      </button>

      <div class="text-center">
        <button onClick={onToday} class="cursor-pointer" style={{ color: 'var(--white)' }}>
          <span class="font-medium">{displayText}</span>
        </button>
        {showToday && onToday && (
          <button
            onClick={onToday}
            class="ml-3 text-sm cursor-pointer"
            style={{ color: 'var(--coral)' }}
          >
            Today
          </button>
        )}
      </div>

      <button
        onClick={onNext}
        class="touch-target flex items-center justify-center cursor-pointer"
        aria-label="Next"
        style={{ color: 'var(--white-dim)' }}
      >
        <ChevronRight size={24} />
      </button>
    </div>
  );
}
