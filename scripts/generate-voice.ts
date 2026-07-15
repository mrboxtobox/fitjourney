// Render the coach's voice — every line in src/lib/voice.ts VOICE_LINES — to
// mp3 under public/voice, using Kokoro TTS (hexgrad/Kokoro-82M, Apache 2.0)
// via kokoro-js. The model (~90MB, q8) downloads once into the HF cache; no
// model weight ever ships to the app.
//
// Run: npx tsx scripts/generate-voice.ts [file-ids…]   (no args = every line;
// pass file names like enc-1.mp3 to regenerate specific clips)
// Requires ffmpeg on PATH for the wav → mp3 encode.
//
// LISTEN to a sample after generating: TTS misreads are rare but real
// (numbers, "RDL", em-dashes). Fix by rewording the line, not by patching audio.

import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { KokoroTTS } from 'kokoro-js';
import { VOICE_LINES } from '../src/lib/voice';

const OUT_DIR = path.join(process.cwd(), 'public', 'voice');
const VOICE = 'af_heart'; // warm, unhurried — the coach, not a announcer
const SPEED = 1.0;

fs.mkdirSync(OUT_DIR, { recursive: true });

const requested = new Set(process.argv.slice(2));
const lines = requested.size ? VOICE_LINES.filter((l) => requested.has(l.file)) : VOICE_LINES;
if (requested.size && lines.length !== requested.size) {
  const known = new Set(VOICE_LINES.map((l) => l.file));
  console.error(`Unknown files: ${[...requested].filter((f) => !known.has(f)).join(', ')}`);
  process.exit(1);
}

console.log(`Loading Kokoro (first run downloads ~90MB into the HF cache)…`);
const tts = await KokoroTTS.from_pretrained('onnx-community/Kokoro-82M-v1.0-ONNX', {
  dtype: 'q8',
});

let done = 0;
for (const line of lines) {
  const wav = path.join(OUT_DIR, line.file.replace(/\.mp3$/, '.wav'));
  const mp3 = path.join(OUT_DIR, line.file);
  const audio = await tts.generate(line.text, { voice: VOICE, speed: SPEED });
  await audio.save(wav);
  // Mono 64k is plenty for a close-mic voice; keeps ~70 clips a few MB total.
  execFileSync('ffmpeg', ['-y', '-loglevel', 'error', '-i', wav, '-ac', '1', '-b:a', '64k', mp3]);
  fs.unlinkSync(wav);
  done++;
  console.log(`  ✓ ${line.file}  (${done}/${lines.length}) — "${line.text.slice(0, 60)}"`);
}

console.log(`\nDone: ${done} clips in public/voice. Listen to a few before shipping.`);
