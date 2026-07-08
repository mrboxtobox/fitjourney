import { useState } from 'preact/hooks';
import { Check, ShieldCheck } from 'lucide-preact';
import type { PainRegion } from '../lib/progression';
import { PAIN_BANDS } from '../clinical/parameters';

// The clinical traffic light, in the user's language. Thresholds and the words below
// both derive from PAIN_BANDS, so a reviewer who moves a band moves the copy with it:
//
//   at or below `acceptableMax`   keep going    — loading through mild symptoms is how tissue adapts
//   up to `cautionMax`            hold the dose — no more, no less, until it settles
//   above `cautionMax`            back it off   — the last dose was too much
//
// Nothing else in the app feeds the safety gate. If this screen is skipped, the
// engine simply has no symptom data and progresses on performance alone.

const REGIONS: Array<{ id: PainRegion; label: string }> = [
  { id: 'knee', label: 'Knee' },
  { id: 'lowBack', label: 'Low back' },
  { id: 'hip', label: 'Hip' },
  { id: 'shoulder', label: 'Shoulder' },
  { id: 'other', label: 'Somewhere else' },
];

export function painBand(nprs: number): 'ok' | 'caution' | 'stop' {
  if (nprs > PAIN_BANDS.cautionMax) return 'stop';
  if (nprs > PAIN_BANDS.acceptableMax) return 'caution';
  return 'ok';
}

export function painColor(nprs: number): string {
  const band = painBand(nprs);
  if (band === 'stop') return 'var(--flame)';
  if (band === 'caution') return 'var(--caution)';
  return 'var(--check)';
}

const BAND_ADVICE: Record<ReturnType<typeof painBand>, string> = {
  ok: 'Mild and acceptable. Tomorrow carries on as planned.',
  caution: 'In the caution band. This movement holds at today’s dose until it settles.',
  stop: 'Above the safe band. This movement steps back to an easier dose.',
};

interface PainScaleProps {
  value: number;
  onChange: (value: number) => void;
  labelledBy?: string;
}

// A 0–10 numeric rating scale. Eleven targets, each ≥ 2.75rem tall via CSS.
export function PainScale({ value, onChange, labelledBy }: PainScaleProps) {
  return (
    <div class="pain-scale" role="radiogroup" aria-labelledby={labelledBy}>
      {Array.from({ length: 11 }, (_, n) => {
        const selected = value === n;
        return (
          <button
            key={n}
            type="button"
            role="radio"
            aria-checked={selected}
            aria-label={`${n} out of 10`}
            class={`pain-key ${selected ? 'selected' : ''}`}
            style={selected ? { background: painColor(n), borderColor: painColor(n) } : undefined}
            onClick={() => onChange(n)}
          >
            {n}
          </button>
        );
      })}
    </div>
  );
}

interface SymptomCheckProps {
  onSave: (reports: Array<{ region: PainRegion; nprs: number }>) => void;
}

export function SymptomCheck({ onSave }: SymptomCheckProps) {
  const [scores, setScores] = useState<Partial<Record<PainRegion, number>>>({});
  const selected = Object.keys(scores) as PainRegion[];

  const toggleRegion = (region: PainRegion) => {
    setScores((prev) => {
      const next = { ...prev };
      if (region in next) delete next[region];
      else next[region] = 0;
      return next;
    });
  };

  const setScore = (region: PainRegion, nprs: number) =>
    setScores((prev) => ({ ...prev, [region]: nprs }));

  const submitNone = () => onSave([]);
  const submit = () => onSave(selected.map((region) => ({ region, nprs: scores[region] ?? 0 })));

  return (
    <div class="symptom-check">
      <h2 class="session-name">How did that feel?</h2>
      <p class="session-cue">
        Pain up to {PAIN_BANDS.acceptableMax} out of 10 is fine and expected. Above{' '}
        {PAIN_BANDS.cautionMax}, or still sore tomorrow, and tomorrow’s dose comes down.
      </p>

      <div class="region-row">
        {REGIONS.map((r) => (
          <button
            key={r.id}
            type="button"
            aria-pressed={r.id in scores}
            class={`region-chip ${r.id in scores ? 'selected' : ''}`}
            onClick={() => toggleRegion(r.id)}
          >
            {r.label}
          </button>
        ))}
      </div>

      {selected.map((region) => {
        const nprs = scores[region] ?? 0;
        const label = REGIONS.find((r) => r.id === region)!.label;
        return (
          <div key={region} class="symptom-region">
            <p id={`pain-${region}`} class="symptom-region-label">
              {label} — {nprs} out of 10
            </p>
            <PainScale value={nprs} onChange={(v) => setScore(region, v)} labelledBy={`pain-${region}`} />
            <p class="symptom-advice" style={{ color: painColor(nprs) }}>
              {BAND_ADVICE[painBand(nprs)]}
            </p>
          </div>
        );
      })}

      <div class="symptom-actions">
        {selected.length === 0 ? (
          <button class="session-btn-primary session-btn-wide" onClick={submitNone}>
            <ShieldCheck size={18} /> No pain — finish
          </button>
        ) : (
          <button class="session-btn-primary session-btn-wide" onClick={submit}>
            <Check size={18} /> Save and finish
          </button>
        )}
      </div>
    </div>
  );
}

interface MorningCheckProps {
  region: PainRegion;
  onAnswer: (nprs: number) => void;
  onDismiss: () => void;
}

// Pain that has not settled within 24 hours means the previous dose was too much,
// whatever it felt like at the time. This is the only way that fact reaches the engine.
export function MorningCheck({ region, onAnswer, onDismiss }: MorningCheckProps) {
  const [nprs, setNprs] = useState(0);
  const label = REGIONS.find((r) => r.id === region)?.label ?? 'that area';

  return (
    <div class="morning-check">
      <p class="morning-check-title">Yesterday you flagged your {label.toLowerCase()}.</p>
      <p id="morning-pain" class="morning-check-sub">
        How is it this morning? {nprs} out of 10
      </p>
      <PainScale value={nprs} onChange={setNprs} labelledBy="morning-pain" />
      <div class="morning-check-actions">
        <button class="session-btn-secondary" onClick={onDismiss}>
          Ask later
        </button>
        <button class="session-btn-primary" onClick={() => onAnswer(nprs)}>
          <Check size={16} /> Save
        </button>
      </div>
    </div>
  );
}
