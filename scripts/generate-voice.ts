// Render the coach's voice — every line in src/lib/voice.ts VOICE_LINES — to
// mp3 under public/voice, using Gemini TTS (gemini-3.1-flash-tts-preview),
// which takes ACTING DIRECTION. Kokoro (the first pipeline) synthesized clean
// speech but flat delivery — "no life" was the verdict; a style-promptable TTS
// is the fix, not post-processing.
//
// Run: GOOGLE_AI_API_KEY=... npx tsx scripts/generate-voice.ts [files…]
// (no args = every line; pass file names like enc-1.mp3 to redo specific clips)
// Requires ffmpeg. LISTEN to a sample after generating.

import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { VOICE_LINES } from '../src/lib/voice';

const KEY = process.env.GOOGLE_AI_API_KEY;
if (!KEY) {
  console.error('GOOGLE_AI_API_KEY is required');
  process.exit(1);
}

const MODEL = process.env.TTS_MODEL ?? 'gemini-3.1-flash-tts-preview';
const VOICE = process.env.TTS_VOICE ?? 'Aoede';
const OUT_DIR = path.join(process.cwd(), 'public', 'voice');
fs.mkdirSync(OUT_DIR, { recursive: true });

// The acting direction — this is where the life comes from.
const DIRECTION =
  'You are a warm, genuinely energized personal trainer coaching a friend mid-workout. ' +
  'Sound alive and human: real enthusiasm, easy confidence, a smile in the voice, natural ' +
  'conversational pacing with light emphasis where it matters. Never flat, never robotic, ' +
  'never like a station announcer. Say exactly this, nothing more: ';

const requested = new Set(process.argv.slice(2));
const lines = requested.size ? VOICE_LINES.filter((l) => requested.has(l.file)) : VOICE_LINES;
if (requested.size && lines.length !== requested.size) {
  const known = new Set(VOICE_LINES.map((l) => l.file));
  console.error(`Unknown files: ${[...requested].filter((f) => !known.has(f)).join(', ')}`);
  process.exit(1);
}

async function synth(text: string): Promise<Buffer> {
  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent?key=${KEY}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: DIRECTION + text }] }],
        generationConfig: {
          responseModalities: ['AUDIO'],
          speechConfig: { voiceConfig: { prebuiltVoiceConfig: { voiceName: VOICE } } },
        },
      }),
    }
  );
  const data = (await res.json()) as {
    error?: { message: string };
    candidates?: Array<{
      content?: { parts?: Array<{ inlineData?: { data: string; mimeType: string } }> };
    }>;
  };
  if (data.error) throw new Error(data.error.message);
  const part = data.candidates?.[0]?.content?.parts?.find((p) => p.inlineData);
  if (!part?.inlineData) throw new Error('no audio in response');
  return Buffer.from(part.inlineData.data, 'base64');
}

let done = 0;
for (const line of lines) {
  const pcm = path.join(OUT_DIR, line.file.replace(/\.mp3$/, '.pcm'));
  const mp3 = path.join(OUT_DIR, line.file);
  try {
    fs.writeFileSync(pcm, await synth(line.text));
    // Gemini TTS returns 24kHz mono s16le PCM. Loudness-matched with soft edges.
    execFileSync('ffmpeg', [
      '-y', '-loglevel', 'error',
      '-f', 's16le', '-ar', '24000', '-ac', '1', '-i', pcm,
      '-af', 'loudnorm=I=-18:TP=-2,afade=t=in:d=0.03,areverse,afade=t=in:d=0.08,areverse',
      '-b:a', '96k', mp3,
    ]);
    done++;
    console.log(`  ✓ ${line.file}  (${done}/${lines.length}) — "${line.text.slice(0, 55)}"`);
  } catch (e) {
    console.error(`  ✗ ${line.file}: ${(e as Error).message}`);
  } finally {
    if (fs.existsSync(pcm)) fs.unlinkSync(pcm);
  }
}
console.log(`\nDone: ${done}/${lines.length} clips. Listen before shipping.`);
