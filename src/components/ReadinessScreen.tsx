import { useState } from 'preact/hooks';
import { ArrowRight, Check } from 'lucide-preact';
import { RED_FLAG_STOP_RULE } from '../clinical/parameters';

// The first-run notice, shown once: what this app is, what it is not, and one tap
// to acknowledge it. The PAR-Q+ questionnaire that used to live here was removed at
// the owner's request — it never blocked anyone (a "yes" only surfaced advice), so
// the acknowledgment below carries the same weight with seven fewer questions.
//
// This app is not a physiotherapist and does not claim to be. It applies published
// principles — the McGill anti-movement core trio, RPE/RIR autoregulation, and the
// pain-monitoring rules used to supervise loaded rehabilitation — to a general
// strength program. That is a different thing from clinical advice, and the copy
// below is careful never to blur them.

interface ReadinessScreenProps {
  onComplete: () => void;
}

export function ReadinessScreen({ onComplete }: ReadinessScreenProps) {
  const [acknowledged, setAcknowledged] = useState(false);

  return (
    <div class="readiness">
      <div class="readiness-inner">
        <h1 class="readiness-title">Before you start</h1>

        <div class="readiness-disclaimer">
          <h2 class="readiness-disclaimer-title">What this app is, and is not</h2>
          <p>
            Idaraya is a general strength and mobility program. It follows established training
            principles — anti-movement core work, autoregulation by reps in reserve, and the
            pain-monitoring rules used to supervise loaded rehabilitation.
          </p>
          <p>
            <strong>It is not medical advice, and it has not been reviewed or approved by a
            physiotherapist.</strong>{' '}
            It cannot see you move, cannot examine you, and cannot diagnose anything. If you have
            an injury, persistent pain, a heart condition, or a diagnosed condition that limits
            physical activity, speak with a clinician before starting this or any program.
          </p>
          <p>{RED_FLAG_STOP_RULE}</p>
        </div>

        <button
          type="button"
          class={`readiness-ack ${acknowledged ? 'selected' : ''}`}
          role="checkbox"
          aria-checked={acknowledged}
          onClick={() => setAcknowledged((v) => !v)}
        >
          <span class={`checkbox-min ${acknowledged ? 'checked' : ''}`}>
            {acknowledged && <Check size={12} color="white" strokeWidth={3} />}
          </span>
          <span>I have read the above and understand this is not medical advice.</span>
        </button>

        <button
          class="session-btn-primary session-btn-wide readiness-continue"
          disabled={!acknowledged}
          onClick={onComplete}
        >
          Start <ArrowRight size={18} />
        </button>

        {!acknowledged && (
          <p class="readiness-hint">Acknowledge the notice above to continue.</p>
        )}
      </div>
    </div>
  );
}
