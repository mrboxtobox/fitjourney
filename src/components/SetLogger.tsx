import { useState } from 'preact/hooks';
import { Check, Minus, Plus } from 'lucide-preact';
import { AUTOREGULATION } from '../clinical/parameters';

// Captures what actually happened: reps completed and reps left in the tank.
//
// RIR ("reps in reserve") is the autoregulation signal. Hitting the target with two
// reps to spare and hitting it by grinding to failure are the same number on paper
// and mean opposite things — the engine treats them as such. Everything is
// pre-filled with the prescription, so a textbook set is one tap.

export interface LoggedSet {
  reps: number;
  load: number;
  rir: number;
}

const RIR_CHOICES = [0, 1, 2, 3, 4];

type Measure = 'reps' | 'seconds' | 'steps';

// "Reps in reserve" is the right idea for a hold or a carry too, but the word "rep"
// is not — the user is holding seconds or walking steps. Keep the scale, change the noun.
const RIR_HELP: Record<Measure, Record<number, string>> = {
  reps: {
    0: 'Nothing left — taken to failure',
    1: 'One more rep, maybe',
    2: 'Two more in the tank',
    3: 'Three more — comfortable',
    4: 'Four or more — easy',
  },
  seconds: {
    0: 'Nothing left — the hold broke',
    1: 'A couple more seconds, maybe',
    2: 'A few more seconds in the tank',
    3: 'Comfortably more',
    4: 'Easy — could have held far longer',
  },
  steps: {
    0: 'Nothing left — had to put it down',
    1: 'A couple more steps, maybe',
    2: 'A few more steps in the tank',
    3: 'Comfortably more',
    4: 'Easy — could have carried far longer',
  },
};

const LEGEND: Record<Measure, string> = {
  reps: `The row of numbers is how many more reps you could have done. Aim to leave ${AUTOREGULATION.defaultTargetRIR}.`,
  seconds: 'The row of numbers is how much longer you could have held on. Aim to leave a little.',
  steps: 'The row of numbers is how much further you could have carried. Aim to leave a little.',
};

interface SetLoggerProps {
  name: string;
  sets: number;
  target: number;
  load: number;
  unitLabel: string;
  measure: Measure;
  onSave: (sets: LoggedSet[]) => void;
}

export function SetLogger({
  name,
  sets,
  target,
  load,
  unitLabel,
  measure,
  onSave,
}: SetLoggerProps) {
  // Pre-filled with the prescription, so a textbook set is one tap.
  const [rows, setRows] = useState<LoggedSet[]>(() =>
    Array.from({ length: sets }, () => ({
      reps: target,
      load,
      rir: AUTOREGULATION.defaultTargetRIR,
    }))
  );

  const update = (i: number, patch: Partial<LoggedSet>) =>
    setRows((prev) => prev.map((r, j) => (j === i ? { ...r, ...patch } : r)));

  const step = measure === 'reps' ? 1 : 5;
  const measureLabel = measure === 'reps' ? 'reps' : measure === 'seconds' ? 'sec' : 'steps';

  return (
    <div class="set-logger">
      <h2 class="session-name">{name}</h2>
      <p class="session-cue">What did you actually do?</p>

      {rows.map((row, i) => (
        <div key={i} class="set-row">
          <span class="set-row-label">Set {i + 1}</span>

          <div class="set-row-stepper">
            <button
              class="score-stepper-btn"
              aria-label={`Decrease ${measureLabel} for set ${i + 1}`}
              onClick={() => update(i, { reps: Math.max(0, row.reps - step) })}
            >
              <Minus size={18} />
            </button>
            <span class="set-row-value">
              {row.reps}
              <span class="set-row-unit">{measureLabel}</span>
            </span>
            <button
              class="score-stepper-btn"
              aria-label={`Increase ${measureLabel} for set ${i + 1}`}
              onClick={() => update(i, { reps: row.reps + step })}
            >
              <Plus size={18} />
            </button>
          </div>

          {load > 0 && (
            <span class="set-row-load">
              {row.load} {unitLabel}
            </span>
          )}

          <div
            class="rir-row"
            role="radiogroup"
            aria-label={`How much was left in reserve for set ${i + 1}`}
          >
            {RIR_CHOICES.map((n) => (
              <button
                key={n}
                type="button"
                role="radio"
                aria-checked={row.rir === n}
                aria-label={RIR_HELP[measure][n]}
                title={RIR_HELP[measure][n]}
                class={`rir-key ${row.rir === n ? 'selected' : ''} ${n === 0 ? 'failure' : ''}`}
                onClick={() => update(i, { rir: n })}
              >
                {n === 4 ? '4+' : n}
              </button>
            ))}
          </div>
        </div>
      ))}

      <p class="set-logger-legend">{LEGEND[measure]}</p>

      <button class="session-btn-primary session-btn-wide" onClick={() => onSave(rows)}>
        <Check size={18} /> Save
      </button>
    </div>
  );
}
