// Salvage a Veo motion clip whose FIRST half is correct: trim to the good
// segment and play it forward-then-reversed, which yields one clean looping
// repetition. Veo's consistent failure shape is drift/freeze in the final
// seconds — the opening seconds, anchored by the seed frame, are reliable.
//
// Usage: node scripts/palindrome-motion.mjs <id> <goodSeconds> [id seconds ...]
// Operates in place on public/motion/<id>.mp4.

import { execFileSync } from 'node:child_process';
import fs from 'node:fs';

const args = process.argv.slice(2);
if (args.length === 0 || args.length % 2 !== 0) {
  console.error('usage: node scripts/palindrome-motion.mjs <id> <goodSeconds> [...]');
  process.exit(1);
}

for (let i = 0; i < args.length; i += 2) {
  const id = args[i];
  const secs = Number(args[i + 1]);
  const file = `public/motion/${id}.mp4`;
  const tmp = `public/motion/${id}.pal.mp4`;
  execFileSync('ffmpeg', [
    '-y', '-loglevel', 'error', '-i', file,
    '-filter_complex',
    `[0:v]trim=0:${secs},setpts=PTS-STARTPTS,split[a][b];[b]reverse[r];[a][r]concat=n=2:v=1[out]`,
    '-map', '[out]',
    '-an', '-c:v', 'libx264', '-crf', '27', '-preset', 'slow', '-pix_fmt', 'yuv420p',
    '-movflags', '+faststart', tmp,
  ]);
  fs.renameSync(tmp, file);
  console.log(`  ↔ ${id}: palindromed at ${secs}s`);
}
