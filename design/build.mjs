// Builds the claude.ai/design bundle. Every preview inlines tokens.css so a card
// renders standalone — one source of truth, copied at build time rather than linked.
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = dirname(fileURLToPath(import.meta.url));
const TOKENS = readFileSync(join(HERE, 'tokens.css'), 'utf8');
const PLATE = 'https://idaraya.pages.dev/exercises';

// A cream plate that shows the real illustration when the network allows it and
// degrades to the plate colour when it does not. Never a broken-image icon.
const plate = (id, size = 44) => `<span class="plate" style="--s:${size}px;background-image:url('${PLATE}/${id}.webp')"></span>`;

const page = (title, card, body, extraCss = '') => `<!-- @dsCard group="${card.group}" -->
<meta charset="utf-8">
<title>${title}</title>
<style>
${TOKENS}
.plate{display:block;width:var(--s);height:var(--s);flex:0 0 var(--s);border-radius:var(--radius);
  background-color:var(--plate);background-size:cover;background-position:center}
.stack{display:flex;flex-direction:column}
.row-note{font-size:var(--step-1);color:var(--faint);margin:1.5rem 0 0;line-height:1.5}
${extraCss}
</style>
${body}
`;

/* ── The row. One exercise, one line, one dose. ─────────────────────────────
   Today is the plan, not a second place to perform the workout. The standard,
   the fault list, the muscle map and the knee note live behind a tap, in the
   detail sheet, and in the guided session where they are actually needed. */
const ROW_CSS = `
.row{display:flex;align-items:center;gap:var(--gap);width:100%;padding:0.6875rem 0;
  min-height:var(--tap);background:none;border:0;border-bottom:1px solid var(--hair);
  font:inherit;color:inherit;text-align:left;cursor:pointer}
.row:last-of-type{border-bottom:0}
.row-main{flex:1 1 auto;min-width:0}
.row-name{font-size:var(--step1);font-weight:500;letter-spacing:-0.005em;
  overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
/* The engine's own sentence, under the exercise it explains. Colour carries the
   verdict; the words carry the reason. It appears only when a decision was made. */
.why{font-size:var(--step-1);line-height:1.35;margin-top:0.125rem}
.why[data-action=advance]{color:var(--band-ok)}
.why[data-action=hold]{color:var(--band-caution)}
.why[data-action=regress]{color:var(--arrow)}
.row[data-done=true]{opacity:0.45}
.row[data-done=true] .row-name{text-decoration:line-through;text-decoration-thickness:1px}
.row:focus-visible{outline:0;box-shadow:inset 0 0 0 2px var(--ink);border-radius:var(--radius)}
.check{font-family:var(--rx);font-size:var(--step0);color:var(--band-ok)}
`;

const row = ({ id, name, dose, why, action, done }) => `
  <button class="row" ${done ? 'data-done="true"' : ''} type="button">
    ${plate(id)}
    <span class="row-main stack">
      <span class="row-name">${name}</span>
      ${why ? `<span class="why" data-action="${action}">${why}</span>` : ''}
    </span>
    ${done ? '<span class="check">done</span>' : `<span class="rx">${dose}</span>`}
  </button>`;

const files = [];

// ── Screen: Today ──────────────────────────────────────────────────────────
files.push([
  'screens/today.html',
  page('Today', { group: 'Screens' }, `
<div class="frame">
  <header class="head">
    <h1>Idaraya</h1>
    <button class="link" type="button">Settings</button>
  </header>

  <!-- Week is named once. It used to appear here and again in the header. -->
  <div class="meta">
    <span>Week 79 · Sustain</span>
    <span class="rx">0 / 15</span>
  </div>
  <div class="track"><span class="fill" style="width:0%"></span></div>

  <!-- Left-aligned to the reading column. The pager is a control, not a title. -->
  <div class="datebar">
    <span class="date">Wednesday, Jul 8</span>
    <span class="pager">
      <button type="button" aria-label="Previous day">‹</button>
      <button type="button" aria-label="Next day">›</button>
    </span>
  </div>

  <button class="cta" type="button">Start guided session</button>

  <h2 class="label">WARM-UP</h2>
  ${row({ id: 'cat-cow', name: 'Cat-Cow', dose: '0:45' })}
  ${row({ id: 'leg-swings', name: 'Leg Swings', dose: '0:30' })}
  ${row({ id: 'hip-circles', name: 'Hip Circles', dose: '0:30' })}
  ${row({ id: 'glute-bridge-warmup', name: 'Glute Bridge', dose: '0:30' })}

  <h2 class="label">CORE &amp; ABS</h2>
  ${row({ id: 'mcgill-curl-up', name: 'Curl-Up', dose: '3 × 8s', why: 'Two clean sessions at the top. Harder today.', action: 'advance' })}
  ${row({ id: 'mcgill-side-plank', name: 'Side Plank', dose: '2 × 10s' })}
  ${row({ id: 'mcgill-bird-dog', name: 'Bird Dog', dose: '2 × 6' })}
  ${row({ id: 'dead-bug', name: 'Dead Bug', dose: '2 × 8', why: 'Knee pain was 4/10. Holding here.', action: 'hold' })}

  <h2 class="label">GLUTES &amp; STRENGTH</h2>
  ${row({ id: 'hip-thrust', name: 'Hip Thrust', dose: '3 × 10 · 12kg', done: true })}
  ${row({ id: 'goblet-squat', name: 'Goblet Squat', dose: '3 × 8 · 8kg', why: 'Back six weeks off. Starting lighter.', action: 'regress' })}
  ${row({ id: 'band-lateral-walk', name: 'Band Lateral Walk', dose: '2 × 12' })}

  <p class="row-note">One exercise, one line, one dose. Tap a row for the movement
  standard, the faults to watch for, and the muscles it trains.</p>
</div>`, `
.head{display:flex;align-items:baseline;justify-content:space-between}
h1{font-size:var(--step2);font-weight:600;letter-spacing:-0.015em;margin:0}
.link{background:none;border:0;font:inherit;font-size:var(--step0);color:var(--muted);cursor:pointer;padding:0}
.meta{display:flex;justify-content:space-between;align-items:center;
  font-size:var(--step0);color:var(--muted);margin-top:1.375rem;margin-bottom:0.5rem}
.track{height:2px;background:var(--hair);border-radius:1px;overflow:hidden}
.fill{display:block;height:100%;background:var(--ink)}
.datebar{display:flex;align-items:center;justify-content:space-between;margin-top:1.125rem}
.date{font-size:var(--step1);font-weight:500;letter-spacing:-0.01em}
.pager{display:flex;gap:0.25rem}
.pager button{width:var(--tap);height:2rem;background:none;border:0;color:var(--muted);
  font-size:1.125rem;line-height:1;cursor:pointer;border-radius:var(--radius)}
.pager button:hover{background:color-mix(in srgb, var(--ink) 6%, transparent)}
.cta{display:block;width:100%;margin-top:1.125rem;padding:0.875rem;border:0;border-radius:999px;
  background:var(--ink);color:var(--paper);font:inherit;font-size:var(--step1);font-weight:500;cursor:pointer}
${ROW_CSS}`),
]);

// ── Component: the row, every state ────────────────────────────────────────
files.push([
  'components/exercise-row.html',
  page('Exercise row', { group: 'Components' }, `
<div class="frame">
  <h2 class="label">TIMED — A HOLD OR A CARRY</h2>
  ${row({ id: 'cat-cow', name: 'Cat-Cow', dose: '0:45' })}

  <h2 class="label">PRESCRIBED SETS AND REPS</h2>
  ${row({ id: 'mcgill-bird-dog', name: 'Bird Dog', dose: '2 × 6' })}

  <h2 class="label">LOADED — THE WEIGHT IS PART OF THE DOSE</h2>
  ${row({ id: 'hip-thrust', name: 'Hip Thrust', dose: '3 × 10 · 12kg' })}

  <h2 class="label">THE ENGINE ADVANCED IT</h2>
  ${row({ id: 'mcgill-curl-up', name: 'Curl-Up', dose: '3 × 8s', why: 'Two clean sessions at the top. Harder today.', action: 'advance' })}

  <h2 class="label">PAIN HELD IT</h2>
  ${row({ id: 'dead-bug', name: 'Dead Bug', dose: '2 × 8', why: 'Knee pain was 4/10. Holding here.', action: 'hold' })}

  <h2 class="label">TIME AWAY COST IT</h2>
  ${row({ id: 'goblet-squat', name: 'Goblet Squat', dose: '3 × 8 · 8kg', why: 'Back six weeks off. Starting lighter.', action: 'regress' })}

  <h2 class="label">DONE</h2>
  ${row({ id: 'mcgill-side-plank', name: 'Side Plank', dose: '2 × 10s', done: true })}

  <p class="row-note">The dose is stated once. The reason line appears only when the
  engine actually decided something — never as decoration. Colour carries the verdict,
  the words carry the reason, and the words come from the engine, not the designer.</p>
</div>`, ROW_CSS),
]);

// ── Component: the pain scale ──────────────────────────────────────────────
// The single most important control in the app. It outranks every performance rule.
files.push([
  'components/pain-scale.html',
  page('Pain scale', { group: 'Components' }, `
<div class="frame">
  <h2 class="label">HOW MUCH DID YOUR KNEE HURT?</h2>
  <div class="keys">
    ${Array.from({ length: 11 }, (_, n) => {
      const band = n <= 3 ? 'ok' : n <= 5 ? 'caution' : 'stop';
      return `<button class="key" data-band="${band}" ${n === 4 ? 'aria-pressed="true"' : ''} type="button">${n}</button>`;
    }).join('')}
  </div>
  <div class="legend">
    <span><i style="background:var(--band-ok)"></i>0–3 keep going</span>
    <span><i style="background:var(--band-caution)"></i>4–5 hold</span>
    <span><i style="background:var(--band-stop)"></i>6+ ease off</span>
  </div>
  <p class="verdict">Holding this movement at its current dose.</p>
  <p class="row-note">The numbers are the prescription face, sized for a thumb at
  arm's length. The bands mirror <code>PAIN_BANDS</code>; the app states the consequence
  in plain words the moment a number is chosen, because a score with no visible
  consequence teaches people to under-report.</p>
</div>`, `
.keys{display:grid;grid-template-columns:repeat(6,1fr);gap:0.5rem}
.key{font-family:var(--rx);font-size:1rem;height:var(--tap);border:0;border-radius:var(--radius);
  background:var(--plate);color:var(--ink);cursor:pointer;font-variant-numeric:tabular-nums}
.key:hover{background:color-mix(in srgb, var(--ink) 8%, var(--plate))}
.key[aria-pressed=true]{color:var(--paper)}
.key[aria-pressed=true][data-band=ok]{background:var(--band-ok)}
.key[aria-pressed=true][data-band=caution]{background:var(--band-caution)}
.key[aria-pressed=true][data-band=stop]{background:var(--band-stop)}
.key:focus-visible{outline:0;box-shadow:inset 0 0 0 2px var(--ink)}
.legend{display:flex;flex-wrap:wrap;gap:0.875rem;margin-top:1rem;font-size:var(--step-1);color:var(--muted)}
.legend i{display:inline-block;width:0.5rem;height:0.5rem;border-radius:50%;margin-right:0.375rem}
.verdict{margin-top:1.25rem;padding:0.75rem 0.875rem;border-radius:var(--radius);
  background:color-mix(in srgb, var(--band-caution) 12%, var(--paper));
  color:var(--band-caution);font-size:var(--step0)}
code{font-family:var(--rx);font-size:0.9em}`),
]);

// ── Component: logging a set ───────────────────────────────────────────────
files.push([
  'components/set-logger.html',
  page('Set logger', { group: 'Components' }, `
<div class="frame">
  <h2 class="label">SET 2 OF 3 · HIP THRUST</h2>
  <div class="fields">
    <div class="field">
      <span class="flabel">Reps</span>
      <div class="stepper"><button type="button">–</button><span class="rx big">10</span><button type="button">+</button></div>
    </div>
    <div class="field">
      <span class="flabel">Weight</span>
      <div class="stepper"><button type="button">–</button><span class="rx big">12<small>kg</small></span><button type="button">+</button></div>
    </div>
  </div>

  <h2 class="label">HOW MANY MORE COULD YOU HAVE DONE?</h2>
  <div class="rir">
    ${[0, 1, 2, 3, 4].map((n) => `<button class="key" ${n === 2 ? 'aria-pressed="true"' : ''} type="button">${n === 4 ? '4+' : n}</button>`).join('')}
  </div>
  <p class="hint">Aim for 2. Nought means you could not have lifted it again.</p>
  <button class="cta" type="button">Log set</button>
  <p class="row-note">Reps and weight are pre-filled with the prescription, so a
  textbook set is one tap. Reps-in-reserve is the engine's other input: without it
  the dose can never move.</p>
</div>`, `
.fields{display:grid;grid-template-columns:1fr 1fr;gap:var(--gap)}
.field{display:flex;flex-direction:column;gap:0.5rem}
.flabel{font-size:var(--step-1);color:var(--muted)}
.stepper{display:flex;align-items:center;justify-content:space-between;gap:0.5rem;
  background:var(--plate);border-radius:var(--radius);padding:0.375rem}
.stepper button{width:2.25rem;height:2.25rem;border:0;border-radius:var(--radius);background:transparent;
  font-size:1.125rem;color:var(--ink);cursor:pointer}
.stepper button:hover{background:color-mix(in srgb, var(--ink) 8%, transparent)}
.big{font-size:1.375rem;color:var(--ink);font-weight:500}
.big small{font-size:0.6em;color:var(--muted);margin-left:0.125rem}
.rir{display:grid;grid-template-columns:repeat(5,1fr);gap:0.5rem}
.key{font-family:var(--rx);font-size:1rem;height:var(--tap);border:0;border-radius:var(--radius);
  background:var(--plate);color:var(--ink);cursor:pointer}
.key[aria-pressed=true]{background:var(--ink);color:var(--paper)}
.key:focus-visible{outline:0;box-shadow:inset 0 0 0 2px var(--ink)}
.hint{font-size:var(--step-1);color:var(--muted);margin:0.75rem 0 0}
.cta{display:block;width:100%;margin-top:1.5rem;padding:0.875rem;border:0;border-radius:999px;
  background:var(--ink);color:var(--paper);font:inherit;font-size:var(--step1);font-weight:500;cursor:pointer}`),
]);

// ── Foundations ────────────────────────────────────────────────────────────
files.push([
  'foundations/type.html',
  page('Type', { group: 'Foundations' }, `
<div class="frame">
  <h2 class="label">TWO FACES, ONE RULE</h2>
  <p class="lede">Inter carries the interface. The typewriter face carries every
  number the engine decided.</p>

  <div class="spec"><span class="s1">Curl-Up</span><span class="rx">3 × 8s</span></div>
  <div class="spec"><span class="s1">Hip Thrust</span><span class="rx">3 × 10 · 12kg</span></div>
  <div class="spec"><span class="s1">Side Plank</span><span class="rx">2 × 10s</span></div>

  <p class="row-note">The app writes prescriptions. Setting the prescribed values in a
  typewriter face — tabular, so a column of doses aligns — makes the engine's output
  legible as output, distinct from the interface that surrounds it. It also means the
  dose never needs a label: the face is the label. This is the one place the design
  spends any boldness.</p>
</div>`, `
.lede{font-size:var(--step1);line-height:1.5;color:var(--muted);margin:0 0 1.5rem}
.spec{display:flex;justify-content:space-between;align-items:baseline;
  padding:0.75rem 0;border-bottom:1px solid var(--hair)}
.s1{font-size:var(--step1);font-weight:500}`),
]);

files.push([
  'foundations/color.html',
  page('Color', { group: 'Foundations' }, `
<div class="frame">
  <h2 class="label">TAKEN FROM THE ARTWORK, NOT INVENTED</h2>
  <div class="sw"><i style="background:var(--ink)"></i><b>ink</b><span class="rx">#14110E</span><em>the pen line</em></div>
  <div class="sw"><i style="background:var(--plate);box-shadow:inset 0 0 0 1px var(--hair)"></i><b>plate</b><span class="rx">#F5F0E6</span><em>the cream the figures sit on</em></div>
  <div class="sw"><i style="background:var(--paper);box-shadow:inset 0 0 0 1px var(--hair)"></i><b>paper</b><span class="rx">#FBFAF7</span><em>page</em></div>
  <div class="sw"><i style="background:var(--arrow)"></i><b>arrow</b><span class="rx">#C41E3A</span><em>the motion arrow — regression, never error</em></div>
  <div class="sw"><i style="background:var(--band-ok)"></i><b>band-ok</b><span class="rx">0–3</span><em>proceed</em></div>
  <div class="sw"><i style="background:var(--band-caution)"></i><b>band-caution</b><span class="rx">4–5</span><em>hold</em></div>
  <div class="sw"><i style="background:var(--band-stop)"></i><b>band-stop</b><span class="rx">6–10</span><em>regress</em></div>
  <p class="row-note">The pain bands mirror <code>PAIN_BANDS</code> in
  <code>src/clinical/parameters.ts</code>. A physiotherapist edits them there, in one
  diff; these swatches follow. They are never edited here.</p>
</div>`, `
.sw{display:grid;grid-template-columns:1.5rem 6rem 1fr;gap:0.75rem;align-items:center;
  padding:0.625rem 0;border-bottom:1px solid var(--hair)}
.sw i{width:1.5rem;height:1.5rem;border-radius:var(--radius)}
.sw b{font-size:var(--step0);font-weight:500}
.sw em{grid-column:2/4;font-style:normal;font-size:var(--step-1);color:var(--faint)}
code{font-family:var(--rx);font-size:0.9em}`),
]);

for (const [path, html] of files) {
  const full = join(HERE, path);
  mkdirSync(dirname(full), { recursive: true });
  writeFileSync(full, html);
}
console.log(files.map(([p]) => p).join('\n'));
