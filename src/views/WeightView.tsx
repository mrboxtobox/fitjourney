import { useState, useEffect } from 'preact/hooks';
import { format } from 'date-fns';
import { Plus, TrendingDown, TrendingUp, Minus, Scale } from 'lucide-preact';
import { addWeightLog, getWeightLogs, type WeightLog } from '../db';
import { formatDateString } from '../hooks/useDate';

export function WeightView() {
  const [logs, setLogs] = useState<WeightLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [newWeight, setNewWeight] = useState('');
  const [notes, setNotes] = useState('');

  // Load weight logs
  useEffect(() => {
    const loadLogs = async () => {
      setLoading(true);
      const weightLogs = await getWeightLogs(30);
      setLogs(weightLogs);
      setLoading(false);
    };
    loadLogs();
  }, []);

  const handleAddWeight = async () => {
    const weight = parseFloat(newWeight);
    if (isNaN(weight) || weight <= 0) return;

    const log: Omit<WeightLog, 'id'> = {
      date: formatDateString(new Date()),
      weight,
      unit: 'kg',
      notes: notes.trim() || undefined,
    };

    await addWeightLog(log);

    // Refresh logs
    const updatedLogs = await getWeightLogs(30);
    setLogs(updatedLogs);
    setNewWeight('');
    setNotes('');
    setShowAdd(false);
  };

  // Calculate stats
  const latestWeight = logs[0]?.weight;
  const previousWeight = logs[1]?.weight;
  const weightChange = latestWeight && previousWeight ? latestWeight - previousWeight : 0;
  const firstWeight = logs.length > 0 ? logs[logs.length - 1]?.weight : undefined;
  const totalChange = latestWeight && firstWeight ? latestWeight - firstWeight : 0;

  // Find min/max for chart
  const weights = logs.map((l) => l.weight);
  const minWeight = weights.length > 0 ? Math.min(...weights) : 0;
  const maxWeight = weights.length > 0 ? Math.max(...weights) : 100;
  const range = maxWeight - minWeight || 10;

  return (
    <div class="container-poster pb-safe-nav">
      <div class="py-4" />

      {/* Stats cards */}
      <div class="grid grid-cols-2 gap-3 mb-6">
        <div class="card-dark p-5">
          <div class="text-sm text-[var(--white-dim)] mb-1">Current</div>
          <div class="text-3xl font-display text-[var(--white)]">
            {latestWeight ? `${latestWeight}` : '—'}
            {latestWeight && <span class="text-lg font-normal text-[var(--white-dim)] ml-1">kg</span>}
          </div>
          {weightChange !== 0 && (
            <div
              class={`flex items-center gap-1 text-sm mt-2 ${
                weightChange < 0 ? 'text-[var(--mint)]' : 'text-[var(--coral)]'
              }`}
            >
              {weightChange < 0 ? (
                <TrendingDown size={14} />
              ) : weightChange > 0 ? (
                <TrendingUp size={14} />
              ) : (
                <Minus size={14} />
              )}
              <span>{Math.abs(weightChange).toFixed(1)} kg</span>
            </div>
          )}
        </div>

        <div class="card-dark p-5">
          <div class="text-sm text-[var(--white-dim)] mb-1">Total Change</div>
          <div
            class={`text-3xl font-display ${
              totalChange === 0
                ? 'text-[var(--white)]'
                : totalChange < 0
                ? 'text-[var(--mint)]'
                : 'text-[var(--coral)]'
            }`}
          >
            {totalChange !== 0 ? (totalChange > 0 ? '+' : '') + totalChange.toFixed(1) : '—'}
            {totalChange !== 0 && (
              <span class="text-lg font-normal text-[var(--white-dim)] ml-1">kg</span>
            )}
          </div>
          {logs.length > 1 && (
            <div class="text-sm text-[var(--white-dim)] mt-2">
              over {logs.length} entries
            </div>
          )}
        </div>
      </div>

      {/* Add weight button / form */}
      {showAdd ? (
        <div class="card-dark p-5 mb-6">
          <h3 class="font-display text-lg tracking-wide text-[var(--white)] mb-4">Log Weight</h3>
          <div class="space-y-4 max-w-sm">
            <div>
              <label class="block text-sm text-[var(--white-muted)] mb-2">Weight (kg)</label>
              <input
                type="number"
                step="0.1"
                inputMode="decimal"
                value={newWeight}
                onChange={(e) => setNewWeight((e.target as HTMLInputElement).value)}
                placeholder="Enter weight"
                class="w-full px-4 py-3 bg-[var(--gray-light)] rounded-lg text-[var(--white)] text-lg placeholder-[var(--white-dim)] focus:outline-none focus:ring-1 focus:ring-[var(--coral)]"
                autoFocus
              />
            </div>
            <div>
              <label class="block text-sm text-[var(--white-muted)] mb-2">Notes (optional)</label>
              <input
                type="text"
                value={notes}
                onChange={(e) => setNotes((e.target as HTMLInputElement).value)}
                placeholder="Morning, post-workout, etc."
                class="w-full px-4 py-3 bg-[var(--gray-light)] rounded-lg text-[var(--white)] placeholder-[var(--white-dim)] focus:outline-none focus:ring-1 focus:ring-[var(--coral)]"
              />
            </div>
            <div class="flex gap-3 pt-2">
              <button
                onClick={handleAddWeight}
                disabled={!newWeight}
                class="flex-1 py-3 rounded-lg font-semibold cursor-pointer transition-colors bg-[var(--coral)] text-[var(--black)] hover:bg-[var(--coral-dark)] disabled:opacity-50"
              >
                Save
              </button>
              <button
                onClick={() => {
                  setShowAdd(false);
                  setNewWeight('');
                  setNotes('');
                }}
                class="px-6 py-3 rounded-lg font-medium cursor-pointer transition-colors bg-[var(--gray-light)] text-[var(--white-muted)] hover:text-[var(--white)]"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      ) : (
        <button
          onClick={() => setShowAdd(true)}
          class="w-full card-dark p-5 flex items-center justify-center gap-2 text-[var(--coral)] hover:bg-[var(--gray-light)] cursor-pointer transition-colors mb-6"
        >
          <Plus size={20} />
          <span class="font-medium">Log Today's Weight</span>
        </button>
      )}

      {/* Weight chart */}
      {logs.length > 1 && (
        <div class="card-dark p-5 mb-6">
          <h3 class="font-display text-lg tracking-wide text-[var(--white)] mb-4">Trend</h3>
          <div class="h-40 flex items-end gap-1">
            {[...logs].reverse().map((log, i) => {
              const height = ((log.weight - minWeight) / range) * 80 + 20;
              return (
                <div
                  key={log.id || i}
                  class="flex-1 rounded-t transition-all"
                  style={{
                    height: `${height}%`,
                    background: 'var(--coral)',
                    opacity: 0.7 + (i / logs.length) * 0.3,
                  }}
                  title={`${format(new Date(log.date), 'MMM d')}: ${log.weight} kg`}
                />
              );
            })}
          </div>
          <div class="flex justify-between text-xs text-[var(--white-dim)] mt-3">
            <span>{logs.length > 0 ? format(new Date(logs[logs.length - 1].date), 'MMM d') : ''}</span>
            <span>{logs.length > 0 ? format(new Date(logs[0].date), 'MMM d') : ''}</span>
          </div>
        </div>
      )}

      {/* History */}
      <div class="card-dark p-5">
        <h3 class="font-display text-lg tracking-wide text-[var(--white)] mb-4">History</h3>
        {loading ? (
          <div class="animate-pulse space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} class="h-12 bg-[var(--gray-light)] rounded" />
            ))}
          </div>
        ) : logs.length === 0 ? (
          <div class="text-center py-8">
            <Scale size={32} class="mx-auto text-[var(--white-dim)] mb-3" />
            <p class="text-[var(--white-muted)]">No weight entries yet</p>
            <p class="text-sm text-[var(--white-dim)] mt-1">Start tracking to see your progress</p>
          </div>
        ) : (
          <div class="space-y-1">
            {logs.map((log, i) => {
              const prev = logs[i + 1];
              const change = prev ? log.weight - prev.weight : 0;

              return (
                <div
                  key={log.id}
                  class="flex items-center justify-between py-3 border-b border-[var(--gray-light)] last:border-0"
                >
                  <div>
                    <div class="font-semibold text-[var(--white)]">{log.weight} kg</div>
                    <div class="text-sm text-[var(--white-dim)]">
                      {format(new Date(log.date), 'EEEE, MMM d')}
                    </div>
                    {log.notes && (
                      <div class="text-xs text-[var(--white-dim)] mt-1 opacity-70">{log.notes}</div>
                    )}
                  </div>
                  {change !== 0 && (
                    <div
                      class={`flex items-center gap-1 text-sm ${
                        change < 0 ? 'text-[var(--mint)]' : 'text-[var(--coral)]'
                      }`}
                    >
                      {change < 0 ? <TrendingDown size={14} /> : <TrendingUp size={14} />}
                      <span>{change > 0 ? '+' : ''}{change.toFixed(1)}</span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
