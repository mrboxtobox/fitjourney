# Idaraya — Clinical Design Document

**Status: not reviewed. Not approved. Prepared for review.**

> **Review log**
>
> **2026-07-08** — A physiotherapist was consulted informally, in conversation. **No written
> review was performed**, no section was signed off, and no changes were requested or recorded.
> This note exists so the conversation is not later mistaken for a review. The sign-off table
> in §14 remains blank, the app continues to state that it has not been clinician-reviewed, and
> `src/clinical/claims.guard.test.ts` continues to fail CI on any approval claim.

Idaraya is a general strength and mobility program delivered as an offline web app. It is
**not medical advice**, has **not** been reviewed or approved by a physiotherapist, and
makes no claim to have been. This document exists so that a physiotherapist *can* review
it — and so that every dose decision the software makes is traceable to a stated reason
rather than to a developer's intuition buried in a function body.

This document is written for a clinician who has never seen the code.

---

## 1. What the software actually does

The core claim is narrow and worth stating precisely, because it is the only thing that
distinguishes this from a workout list:

> The program the user sees tomorrow is a function of what they logged today — the
> repetitions they completed, how close to failure they were, and what hurt.

Concretely, after every exercise the user records:

- **Repetitions completed** per set (or seconds held, or steps carried).
- **Reps in reserve (RIR)** on each set — "how many more could you have done?"

And after every session:

- **Pain**, 0–10, per body region (knee, low back, hip, shoulder, other).
- **Pain the following morning**, for any region flagged the day before.

An engine folds that history and decides, per exercise, one of four actions: **grow** the
target, **advance** the difficulty, **hold** the dose, or **regress**.

Nothing else in the app can change the prescription. There is no separate "coach" nudging
things. If a rule is not written below, the software does not do it.

---

## 2. Scope, population, and assumptions

**Intended user.** An adult without a diagnosed musculoskeletal condition, training
unsupervised at home, who describes themselves as "learning to exercise." The stated goals
are glutes, core and abdominals, arm tone, and cardiovascular effort.

**Stated constraint.** The user asked for a **knee-friendly** program. Section 9 sets out
what that means in practice.

**Equipment.** Bodyweight, one kettlebell, dumbbells, mini loop bands, a chair or couch,
and a counter or table.

**Session.** Roughly 30 minutes, six days a week, one rest day, over 52+ weeks.

**Assumptions the software makes that a clinician should scrutinise:**

1. That a self-reported 0–10 pain score, entered on a phone after a workout, is a
   sufficient safety signal in an unsupervised setting.
2. That an untrained person can estimate reps-in-reserve accurately enough to
   autoregulate. (Evidence generally suggests novices *under*-estimate proximity to
   failure. See §12.)
3. That a written movement standard plus a list of common faults is an adequate
   substitute for a clinician watching the movement. It plainly is not; the question is
   whether it is adequate *enough* for these movements at these loads.
4. That an unlocalised complaint ("somewhere else") should gate the whole program.

---

## 3. Where the reviewer edits

**Every clinical judgement lives in one file: [`src/clinical/parameters.ts`](src/clinical/parameters.ts).**

It contains, in order: pain bands; which pain regions gate which movement patterns;
autoregulation targets; the detraining rule for time away; progression increments; load
increments; the training calendar (rest day, deload frequency and magnitude, phase
boundaries); the **per-exercise dose** (sets, rep range, tempo, target RIR, rest); the
**movement ladders** and their entry criteria; and the pre-participation screening questions.

The engine reads these numbers and hardcodes none of them.

Two things are *not* in that file, deliberately:

- **Coaching prose** — each movement's standard ("what a good rep looks like") and its
  common faults — lives in [`src/data/exercises.ts`](src/data/exercises.ts), because it is
  long-form text rather than dose. It is equally open to review.
- **Which movement pattern an exercise belongs to** is declared with the exercise, since
  it is a property of the movement rather than of the program.

### Verifying a change

```
yarn verify     # typecheck + the full guard suite
```

The suite includes tests that run the engine against **modified** parameters and assert
the behaviour moves (`src/clinical/parameters.test.ts`). A number that nothing reads is a
number that lies to the reviewer, so those tests exist to make that impossible. It also
checks internal consistency: no ladder rung may name a movement that does not exist, no
rep range may have `max < min`, no exercise may lack a dose, and the pain bands may not
invert.

---

## 4. Pre-participation screening

**What we do.** On first launch, before any exercise is shown, the user answers seven
yes/no questions adapted from the **PAR-Q+** (Physical Activity Readiness Questionnaire),
and must explicitly acknowledge a notice stating that the app is not medical advice and has
not been clinician-reviewed.

**A "yes" does not block use.** It surfaces advice to be cleared by a doctor or
physiotherapist first, and is stored so the advice can be shown again.

**A standing red-flag rule** is displayed to everyone: *stop and seek help if you feel
chest pain, faintness, or sudden severe pain.*

**Reviewer questions.**
- Should any answer be a hard block rather than advice? The current design assumes a
  consumer fitness app has no standing to refuse, and that a hard block simply teaches
  users to lie. That is a product judgement, not a clinical one — please overrule it if
  you disagree.
- Is a seven-item adaptation sufficient, or should the full PAR-Q+ follow-up branch be
  implemented?
- The pregnancy/postpartum item currently only triggers generic advice. It arguably
  warrants a different program, not a caveat.

---

## 5. The symptom gate

This is the single most important safety rule in the app, and it **outranks every
performance rule**. A textbook session that hurt too much still regresses.

Pain is recorded on the **Numeric Pain Rating Scale (NPRS, 0–10)** per region.

| Pain during the session | Action taken by the engine |
| --- | --- |
| **0–3** | Proceed. Progression is decided on performance alone. |
| **4–5** | **Hold** the current dose for that movement. |
| **> 5** | **Regress** that movement. |

| Pain the following morning | Action |
| --- | --- |
| **≥ 4** | **Regress**, regardless of how the session itself felt. |

The morning rule encodes the requirement that symptoms **settle within 24 hours**. It is
the reason progression is recomputed as a fold over the entire logged history rather than
applied once at the end of a session: a pain score entered on Tuesday morning must be able
to retroactively gate Monday's session. (See §11.)

**Provenance.** This "acceptable pain" / pain-monitoring model — permitting loading within
a tolerable band, with a requirement that symptoms return to baseline within 24 hours — is
the approach commonly used to supervise loaded rehabilitation, and is most often associated
in the literature with tendinopathy and patellofemoral pain loading protocols.
**The exact thresholds below are convention, not a derived result, and this document does
not cite a specific trial in support of the 3 / 5 / 4 numbers.** They are set in
`PAIN_BANDS` and are the first thing a reviewer should challenge.

### Pain is scoped by region

A sore shoulder does not hold back a glute bridge; a sore knee does not hold back a band
pull-apart. `PATTERN_PAIN_REGIONS` maps each movement pattern to the regions that gate it.

The reasoning is behavioural as much as biomechanical: if one irritable joint freezes the
entire program, the user learns not to report pain. The safety system must not punish
honesty.

`other` (an unlocalised complaint) is deliberately unmapped and therefore gates
**everything**.

**Reviewer questions.**
- Are the region→pattern mappings right? Specifically: `carry` is gated on knee, low back
  and shoulder; `horizontalPull` on shoulder and low back; `bridge` on low back and hip but
  **not** knee. Is excluding the knee from `bridge` and `hinge` defensible?
- Should pain in a region regress *every* movement loading that region, or only the one
  performed? Currently: every one, because the gate is evaluated per exercise against all
  reports from that session.
- Should there be an absolute stop — a pain score that suspends the program rather than
  regressing it?

---

## 6. Autoregulation: reps in reserve

**What we do.** The user reports, per set, how many further repetitions they believe they
could have completed with good form. The default target is **2 RIR** on the working sets.

**Why RIR rather than RPE.** They are the same construct inverted (RPE 8 ≈ 2 RIR). RIR is
phrased as a question untrained people answer more reliably: *"how many more could you have
done?"* rather than *"how hard was that, out of ten?"*

**Where it bites.** A set that reaches the top of the rep range **by grinding to failure
(RIR 0)** does **not** count as a qualifying session. Reaching a target and reaching it
with something left are different events, and the engine treats them as such. This is
`AUTOREGULATION.minRirToQualify`.

**The one exception.** The kettlebell swing targets **3 RIR**, not 2. A ballistic hinge
performed under fatigue is how a hip hinge becomes a rounded-back lift, and the swing is
the only movement in the program where the failure mode is a spinal one at speed. This is
pinned by a test.

**Reviewer questions.**
- Is 2 RIR appropriate for a novice population training unsupervised? An argument exists
  for 3–4 RIR throughout the Foundation phase, on the grounds that novices systematically
  under-estimate proximity to failure and that early adaptation is largely neural.
- Should target RIR vary by *phase* (a calendar concept) as well as by exercise? It
  currently does not.
- Holds and carries reuse the RIR scale, reworded ("how much longer could you have held
  on?"). Is this a defensible translation, or should timed work autoregulate differently?

---

## 7. Progression: double progression

Once the symptom gate is clear, one rule decides the dose.

**Grow first, then add difficulty.**

1. **Grow.** If every prescribed set hit the current target with ≥1 rep in reserve, the
   target increases by one step (§8) — up to the top of the exercise's range.
2. **Prove it.** On reaching the top of the range, the user must repeat a clean session at
   the top **twice consecutively** before difficulty rises. One good day is luck; two is
   adaptation. (`AUTOREGULATION.sessionsAtTopOfRangeToAdvance`.)
3. **Advance.** Then:
   - If the exercise **can hold external load**, add the smallest available load increment
     and reset the target to the bottom of the range.
   - Otherwise, climb to the **next rung of the movement's ladder** (§9).
   - If already on the top rung of a bodyweight ladder, the rep range itself moves up.
4. **Hold.** If the target was not met on every prescribed set, repeat the same dose.
5. **Regress.** If the best set could not reach the bottom of the range — or the symptom
   gate fired — make it easier: shed load first, then drop a ladder rung, then reduce the
   target. Load is shed first because it is the least disruptive thing to take away.

**Only a clean session at the top of the range counts toward the two-session gate.** A hold
forced by pain, or by a missed target, resets the streak to zero. Pain must never
accumulate into permission to train harder.

**Volume matters, not just difficulty.** "Every prescribed set" means the sets the user was
*prescribed that day* — Foundation and deload weeks legitimately prescribe fewer sets, and
completing them counts as completing the work.

### Detraining after a layoff

Time away reduces the dose. A user who stops for two months must not resume where they left
off: strength decays, and the tissue tolerance that made the dose *safe* decays faster than
the strength does.

| Days since that exercise was last trained | Effect |
| --- | --- |
| **0–14** (grace period) | Nothing. A missed week, or a planned deload, costs nothing. |
| **Every further 14 days** | One regression step. |
| **Beyond 4 steps** | Capped. A layoff never walks the dose to zero. |

A regression step is the same operation the symptom gate uses: shed load, else drop a ladder
rung, else reduce the target.

Two implementation notes that matter clinically:

- **Detraining is applied on read, against today's date** — not folded into the history. The
  user's position genuinely depends on when you ask: nothing has decayed on the day they
  stopped, and six weeks later it has. Asking twice on the same day gives the same answer.
- **A deload week counts as attendance.** Deload sessions are excluded from *progression*,
  but not from the last-trained date. Excluding them from both would detrain a user for
  recovering exactly as instructed.

The user is told why: *"You have been away a while. Starting lighter and building back up."*

**Provenance.** The direction is not in question. **The magnitudes — 14 days of grace, one
step per 14 days, a cap of 4 — are a conservative guess, not a derived result**, and are the
second thing a reviewer should challenge after the pain bands. They live in
`CLINICAL_PARAMETERS.detraining`.

**Reviewer questions.**
- Is a two-session confirmation the right gate, or too slow/too fast?
- Regression currently reduces load by exactly one increment. Should a high pain score
  (say 8+/10) regress further, or drop a ladder rung immediately?
- Is a 14-day grace period too generous? Too harsh? Should detraining be faster for loaded
  movements than for bodyweight ones — the code currently treats them identically.
- Detraining is per-exercise, keyed on when that movement was last performed. A user who
  trained only their upper body for a month detrains only their lower body. Is that right,
  or should a whole-program absence be treated differently from a selective one?

---

## 8. Progression increments

| Prescription | One step of progress |
| --- | --- |
| Repetitions | +1 rep |
| Timed hold | +5 seconds |
| Loaded carry | +5 steps |

| Load, by equipment | kg | lbs |
| --- | --- | --- |
| Dumbbell | 2.5 | 5 |
| Kettlebell | 4 | 8 |

The load increments assume a household set of dumbbells and a single kettlebell. A 4 kg
jump on a kettlebell is a large relative increase on a light bell; a reviewer may wish to
argue for a rep-based bridge instead.

---

## 9. Movement ladders and the knee-friendly constraint

### The ladders

Each movement pattern is an ordered chain of variants, easiest first. The engine holds a
*level* per pattern. The weekly template chooses which **pattern** you train; the engine
chooses which **rung** and at what load. Each rung carries a plain-English criterion shown
to the user, which is intended to say the same thing as the engine's rule in a different
register.

**Ordering principles used:** bilateral before unilateral; bodyweight before loaded;
controlled before ballistic; and — the one worth challenging — **load a bilateral movement
before asking for an unloaded single-leg one**, on the grounds that a novice stabilises a
loaded bilateral pattern more safely than an unloaded single-leg pattern.

That principle produces this bridge ladder:

```
glute bridge → banded glute bridge → hip thrust (loaded) → single-leg glute bridge
```

and this hinge ladder:

```
kettlebell deadlift → dumbbell RDL → B-stance RDL → kettlebell swing
```

**Reviewer questions.**
- Is the bridge ordering correct, or should the single-leg bridge precede the loaded hip
  thrust?
- The hinge ladder terminates in the **kettlebell swing** — a ballistic movement — as the
  "power expression" of the pattern. Is a swing an appropriate terminal rung for an
  unsupervised novice at all?
- `antiRotation` progresses bird dog → Pallof press. This removes the bird dog from the
  program once the user advances, which arguably removes a valuable movement rather than
  progressing it. Should some patterns not be ladders?

### Knee-friendly, concretely

The program is hinge- and bridge-dominant. Specifically:

- **No jumping, no plyometrics, no running.**
- **No lunges under load**, and no step-ups.
- **Squat depth is capped by a physical object** — the squat ladder begins with a box
  squat, where a chair sets the depth, before progressing to a goblet squat with an
  explicit "stop at the depth where the knee stays quiet" cue.
- **Banded walks are performed in a quarter squat**, not a deep one.
- Every knee-loading movement carries a `kneeNote` shown on the card.
- The `squat`, `abduction` and `carry` patterns are gated on knee pain (§5).

**Reviewer questions.**
- Is the goblet squat appropriate at all for a self-described knee-sensitive user, even at
  a self-selected depth?
- Banded lateral and monster walks put the knee in sustained shallow flexion under valgus
  resistance. Is that a concern, and should they be gated more aggressively?

---

## 10. Programming

**Weekly template.** Six training days plus one rest day (Sunday). Each training day is
deliberately lean — five working exercises, gone deep, rather than ten gone shallow: two
core anti-movement patterns (alternating A/B days), one **main lift** run as straight sets,
one glute accessory, one upper-body pattern, one mobility stretch, and a scored
conditioning finisher. Depth comes from per-exercise set counts (§6): main-lift patterns
carry 4 sets, core and accessory work 3.

**Core.** The four anti-movement patterns (the McGill trio plus anti-extension) alternate
two per day, so each pattern is trained **three times a week in every phase** — coverage
comes from the week, not the day. They are prescribed as short, repeated holds rather than
long ones — endurance without accumulating spinal compression.

**Supersets.** Non-competing patterns are paired back-to-back with rest only after the
pair, to raise cardiovascular demand within a 30-minute session. Rest between pairs is
20–30 seconds.

**Finishers.** A 2–5 minute scored metabolic block: kettlebell swings, banded circuits,
loaded carries, bridge circuits, or fast deadlifts. All hinge/bridge/carry-based; **no
jumping**. The score is recorded so the user competes against their own best.

**Upper-body balance.** One upper-body pattern per day rotates so the week still trains a
horizontal push, a horizontal pull, a vertical push, elbow flexion and extension, and the
two shoulder accessories — Saturday's slot alternates between lateral raise and scapular
retraction week by week, so neither goes untrained. (The pull was absent from an earlier
version of this program; a band pull-apart is scapular retraction, not a row.)

**Phases** govern **volume only** — never difficulty, which belongs entirely to the engine.

| Phase | Weeks | Effect |
| --- | --- | --- |
| Foundation | 1–4 | One fewer set on any exercise prescribed >2 sets; easier finisher |
| Build | 5–12 | Full volume |
| Strength | 13–26 | Full volume |
| Sustain | 27+ | Full volume |

**Deload.** Every 4th week: one fewer set of everything, and a shorter finisher. Foundation
and deload reductions **stack**, so a deload week inside Foundation is genuinely easier than
the Foundation week before it.

**Deload sessions are excluded from progression.** They prescribe fewer sets by design, so
they could never "hit the target," and folding them in would silently punish a user for
recovering on schedule.

**Reviewer questions.**
- Six training days a week is a lot for a novice, even at 30 minutes. Is the single rest
  day defensible, given that every day trains core and glutes?
- Is a deload every 4th week the right cadence when weekly load progression is this
  conservative? An argument exists that autoregulation makes fixed deloads redundant.
- Mobility work is prescribed as a single cooldown stretch, held, never progressed. Is that
  the right treatment?

---

## 11. Tempo, and how the data is handled

**Tempo** is prescribed in the conventional four-figure order in seconds — eccentric, pause
at the bottom, concentric, pause at the top — and shown on the card. RDLs use `3-0-1-0` and
the kettlebell deadlift `3-0-1-1`, both emphasising a slow eccentric; bridges use `2-0-1-2`
(a two-second squeeze at the top); squats and push-ups use a one-second bottom pause.
Ballistic lifts, carries, and stretches carry no tempo.

Tempo is **displayed but not verified**. The app cannot see the user. It is a cue, not a
measurement.

### Illustrations

Every movement ships two diagrams: a **form illustration** (the movement, with a ghosted
figure showing the other end of the range, red motion arrows, and dashed alignment guides)
and a **muscle map** (an anatomical figure with the target muscle highlighted).

These are clinical content. **A wrong diagram teaches the exact fault the text warns
against**, and users look at pictures before they read standards. They were produced by an
image model against a written style guide that includes an explicit anatomical-accuracy
block (joint hinge directions, neutral spine, limb proportions, muscle-belly placement,
contact and weight-bearing), and every image was visually reviewed.

Generation is non-deterministic, so the review is per-image, not per-batch. Known model
failure modes, all of which have occurred: a black border frame drawn around the artwork; a
side plank drawn with a straight arm instead of a forearm; a seated floor pose drifting into
a kneeling lunge; a mini loop band drawn around one thigh instead of both; and ghosted
overlay figures rendered as disembodied limbs or a different camera angle.

Regenerate with `scripts/generate-exercise-images.ts` and `scripts/generate-muscle-maps.ts`,
then `scripts/convert-to-webp.mjs`. **Look at every regenerated image.** `assets.guard.test.ts`
asserts that a file exists for every movement — it cannot assert that the file is correct.

**Reviewer question.** Please check the form illustrations against the movement standards in
§9 and `src/data/exercises.ts`. A diagram that contradicts its own written standard is worse
than no diagram.

**Data.** Everything is stored locally on the device (IndexedDB). Nothing is transmitted,
and there is no account, no server, and no analytics. Pain scores never leave the phone.

**Progression is derived, never stored.** The user's position is recomputed from scratch by
folding the entire logged history on every load. This is deliberate:

- It makes replay idempotent — the same history always produces the same prescription.
- It allows a **next-morning pain score, entered a day after the session it describes, to
  retroactively gate that session.** An "apply once at the end of a session" design
  cannot do this, and getting the morning rule right was worth the recomputation.

---

## 12. Known limitations and open questions

Listed plainly, because a review document that hides these is worthless.

1. **The detraining magnitudes are guessed.** The *rule* now exists (§7): time away reduces
   the dose, after a 14-day grace period, one regression step per further 14 days, capped at
   four. But 14 / 14 / 4 are conservative round numbers, not values derived from anything.
   They are also uniform across every movement, though a loaded hip thrust and a bodyweight
   dead bug almost certainly decay at different rates.
2. **RIR accuracy in novices is assumed, not established.** The literature generally
   suggests untrained lifters under-estimate proximity to failure. If so, the engine
   advances people slightly faster than intended, in exactly the population least able to
   absorb it. Raising `defaultTargetRIR` during Foundation would be the cheapest mitigation.
3. **The symptom gate is only as good as the reporting.** A user who skips the check-in
   simply has no symptom data, and the engine then progresses on performance alone. It does
   not treat a missing report as a cause for caution. Should it?
4. **The morning check is prompted, not enforced,** and can be dismissed.
5. **No differentiation between pain types.** A 6/10 sharp, localised knee pain and a 6/10
   diffuse muscular ache are treated identically. This is a real simplification.
6. **Form is unobserved.** The movement standards and fault lists are the entire quality
   control mechanism, and they depend on the user reading them.
7. **No absolute contraindication logic.** The readiness screen advises; it never restricts
   which exercises are offered. A user who reports a bone/joint problem still receives the
   full program.
8. **The 3 / 5 / 4 pain thresholds and the 2-session advance gate are conventions**, chosen
   as defaults, not derived from a specific trial in this population. See §5.
9. **No warm-up progression, and no autoregulation of the finisher.** The conditioning block
   is scored but not gated on pain or fatigue.
10. **Single-user, single-device.** No mechanism for a clinician to view the log.

### A note on provenance

This document names frameworks (PAR-Q+; the NPRS; the McGill anti-movement trio; RPE/RIR
autoregulation; double progression; the "acceptable pain" loading model used in tendinopathy
and patellofemoral rehabilitation) because the design draws on them. **It deliberately does
not cite specific papers, years, or effect sizes**, because the author of this document is
not a clinician and would rather present an honestly unsourced rationale than a
confidently wrong citation. Where a specific number matters, §12 says so.

The reviewer should treat every number in `src/clinical/parameters.ts` as a proposal.

---

## 13. Change protocol

1. Edit `src/clinical/parameters.ts` (and, for coaching prose, `src/data/exercises.ts`).
2. Update the corresponding section of this document. **A changed number with an unchanged
   rationale is worse than either alone.**
3. Run `yarn verify`. The guard suite will fail if a parameter becomes internally
   inconsistent, if a ladder rung names a movement that does not exist, or if a threshold
   stops being read by the engine.
4. If a rung's `criteria` sentence changes, check it still says the same thing as the
   engine's rule. The two are meant to agree in different registers, and nothing enforces
   that but a human.

---

## 14. Reviewer sign-off

*To be completed by a reviewing physiotherapist. Until every box below is signed, the app
must continue to state that it has not been clinician-reviewed, and no approval claim may
appear in the UI, the README, the app store listing, or marketing copy.*

| Section | Reviewed | Changes required | Reviewer | Date |
| --- | --- | --- | --- | --- |
| 4. Pre-participation screening | ☐ | | | |
| 5. The symptom gate | ☐ | | | |
| 6. Autoregulation (RIR) | ☐ | | | |
| 7. Progression rules, incl. detraining | ☐ | | | |
| 8. Progression increments | ☐ | | | |
| 9. Ladders and knee-friendly constraints | ☐ | | | |
| 10. Programming and calendar | ☐ | | | |
| 11. Tempo and data handling | ☐ | | | |
| 12. Limitations | ☐ | | | |
| Per-exercise dose (`EXERCISE_DOSE`) | ☐ | | | |
| Movement standards and fault lists | ☐ | | | |
| Form illustrations (`public/exercises/`) | ☐ | | | |
| Muscle maps (`public/exercises/muscles/`) | ☐ | | | |

**Reviewer name and registration number:** ______________________

**Signature:** ______________________  **Date:** ______________

**Scope of approval (what, exactly, is being approved):**

_____________________________________________________________

**Stated limitations of this approval:**

_____________________________________________________________
