import { useState } from 'preact/hooks';
import { AlertTriangle, ArrowRight, Check } from 'lucide-preact';
import {
  READINESS_QUESTIONS,
  READINESS_FLAG_ADVICE,
  RED_FLAG_STOP_RULE,
} from '../clinical/parameters';

// A pre-participation screen, shown once, modelled on the PAR-Q+ (Physical Activity
// Readiness Questionnaire). It does not diagnose anything and it does not block
// anyone — a "yes" surfaces the advice to speak to a clinician first, and is stored
// so the app can keep showing it.
//
// This app is not a physiotherapist and does not claim to be. It applies published
// principles — the McGill anti-movement core trio, RPE/RIR autoregulation, and the
// pain-monitoring rules used to supervise loaded rehabilitation — to a general
// strength program. That is a different thing from clinical advice, and the copy
// below is careful never to blur them.

interface ReadinessScreenProps {
  onComplete: (flaggedQuestionIds: string[]) => void;
}

export function ReadinessScreen({ onComplete }: ReadinessScreenProps) {
  const [answers, setAnswers] = useState<Record<string, boolean>>({});
  const [acknowledged, setAcknowledged] = useState(false);

  const answered = READINESS_QUESTIONS.every((q) => q.id in answers);
  const flagged = READINESS_QUESTIONS.filter((q) => answers[q.id]).map((q) => q.id);
  const hasFlag = flagged.length > 0;

  return (
    <div class="readiness">
      <div class="readiness-inner">
        <h1 class="readiness-title">Before you start</h1>
        <p class="readiness-lede">
          {READINESS_QUESTIONS.length} questions, once. They come from the standard physical
          activity readiness questionnaire.
        </p>

        <div class="readiness-questions">
          {READINESS_QUESTIONS.map((q) => (
            <div key={q.id} class="readiness-question">
              <p class="readiness-question-text">{q.text}</p>
              <div class="readiness-answers" role="radiogroup" aria-label={q.text}>
                {[
                  { label: 'No', value: false },
                  { label: 'Yes', value: true },
                ].map((opt) => (
                  <button
                    key={opt.label}
                    type="button"
                    role="radio"
                    aria-checked={answers[q.id] === opt.value}
                    class={`readiness-answer ${answers[q.id] === opt.value ? 'selected' : ''} ${
                      opt.value && answers[q.id] === true ? 'flagged' : ''
                    }`}
                    onClick={() => setAnswers((a) => ({ ...a, [q.id]: opt.value }))}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>

        {hasFlag && (
          <div class="readiness-flag">
            <AlertTriangle size={18} class="flex-shrink-0" style={{ color: 'var(--caution)' }} />
            <p>{READINESS_FLAG_ADVICE}</p>
          </div>
        )}

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
            an injury, persistent pain, or a diagnosed condition, work with a clinician who can.
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
          disabled={!answered || !acknowledged}
          onClick={() => onComplete(flagged)}
        >
          Start <ArrowRight size={18} />
        </button>

        {!answered && (
          <p class="readiness-hint">
            Answer all {READINESS_QUESTIONS.length} questions to continue.
          </p>
        )}
        {answered && !acknowledged && (
          <p class="readiness-hint">Acknowledge the notice above to continue.</p>
        )}
      </div>
    </div>
  );
}
