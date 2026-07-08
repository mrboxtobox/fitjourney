// Guards the app's honesty about its own authority.
//
// CLINICAL.md §14: until a physiotherapist signs off, the app must state it has NOT been
// clinician-reviewed, and no approval claim may appear in the UI, the README, the app
// store listing, or marketing copy.
//
// That is a promise about text, and text drifts. A well-meaning copy edit — "physio-
// approved knee-friendly training!" — is exactly the kind of change that sails through
// code review. So it fails a test instead.
//
// This suite is deliberately fs-based: it reads the shipped source, not a mock.

import { describe, it, expect } from 'vitest';
import { readFileSync, readdirSync, statSync, existsSync } from 'node:fs';
import { join, extname } from 'node:path';

const ROOT = process.cwd();
const SRC = join(ROOT, 'src');

function walk(dir: string): string[] {
  return readdirSync(dir).flatMap((entry) => {
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) return walk(full);
    return ['.ts', '.tsx', '.html', '.css'].includes(extname(full)) ? [full] : [];
  });
}

// Files whose job is to talk ABOUT the claim (this test, and the disclaimer copy) are
// exempt from the phrase ban by construction — they are checked separately below.
const EXEMPT = ['claims.guard.test.ts'];

function shippedText(): Array<{ file: string; text: string }> {
  const files = [...walk(SRC), join(ROOT, 'index.html')].filter(
    (f) => existsSync(f) && !EXEMPT.some((e) => f.endsWith(e))
  );
  return files.map((file) => ({ file, text: readFileSync(file, 'utf8') }));
}

// Phrases that assert clinical endorsement the app does not have. Matched
// case-insensitively against the shipped source.
const FORBIDDEN_CLAIMS: RegExp[] = [
  /physio(therapist)?[-\s]?approved/i,
  /physio(therapist)?[-\s]?reviewed/i,
  /clinically[-\s]?(approved|proven|validated)/i,
  /doctor[-\s]?approved/i,
  /medically[-\s]?approved/i,
  /\bprescribed by a (physio|doctor|clinician)/i,
  /designed by a physiotherapist/i,
  /\bFDA[-\s]?(approved|cleared)/i,
];

describe('the app claims no clinical authority it does not have', () => {
  it('contains no approval claim anywhere in the shipped source', () => {
    const violations: string[] = [];
    for (const { file, text } of shippedText()) {
      for (const pattern of FORBIDDEN_CLAIMS) {
        const match = text.match(pattern);
        // "has not been reviewed or approved by a physiotherapist" is the disclaimer,
        // not a claim. Only flag a match that is not immediately negated.
        if (match && !isNegated(text, match.index ?? 0)) {
          violations.push(`${file.replace(ROOT + '/', '')}: "${match[0]}"`);
        }
      }
    }
    expect(violations).toEqual([]);
  });

  it('self-test: the guard actually fires on a bare approval claim', () => {
    // Without this, the negation-detection below could quietly swallow everything and
    // the suite would pass on an app that shouts "PHYSIOTHERAPIST APPROVED" on its
    // splash screen.
    const bare = 'Idaraya is a physiotherapist-approved program for knees.';
    const hit = FORBIDDEN_CLAIMS.some((p) => {
      const m = bare.match(p);
      return m && !isNegated(bare, m.index ?? 0);
    });
    expect(hit).toBe(true);
  });

  it('self-test: the guard does not fire on the disclaimer that negates the claim', () => {
    const disclaimer =
      'It is not medical advice, and it has not been reviewed or approved by a physiotherapist.';
    const hit = FORBIDDEN_CLAIMS.some((p) => {
      const m = disclaimer.match(p);
      return m && !isNegated(disclaimer, m.index ?? 0);
    });
    expect(hit).toBe(false);
  });
});

// A claim preceded closely by a negation ("has not been reviewed or approved by a
// physiotherapist") is a disclaimer, not a claim.
function isNegated(text: string, index: number): boolean {
  const window = text.slice(Math.max(0, index - 90), index).toLowerCase();
  return /\bnot\b|\bnever\b|\bno\b|\bwithout\b/.test(window);
}

describe('the disclaimer the app ships is intact', () => {
  const readiness = readFileSync(join(SRC, 'components', 'ReadinessScreen.tsx'), 'utf8');

  it('tells the user this is not medical advice', () => {
    expect(readiness.toLowerCase()).toContain('not medical advice');
  });

  it('tells the user no physiotherapist has reviewed or approved it', () => {
    expect(readiness).toMatch(/not been\s+reviewed or approved by a\s+physiotherapist/);
  });

  it('requires the user to acknowledge the notice before the program starts', () => {
    // The continue button must be disabled until the acknowledgement is checked.
    expect(readiness).toMatch(/disabled=\{!answered \|\| !acknowledged\}/);
  });

  it('ships a standing red-flag stop rule', () => {
    const params = readFileSync(join(SRC, 'clinical', 'parameters.ts'), 'utf8');
    expect(params).toContain('RED_FLAG_STOP_RULE');
    expect(params.toLowerCase()).toContain('chest pain');
  });
});

describe('the clinical design document exists and stays honest', () => {
  const path = join(ROOT, 'CLINICAL.md');

  it('is present at the repo root', () => {
    expect(existsSync(path)).toBe(true);
  });

  it('states up front that it has not been reviewed or approved', () => {
    const doc = readFileSync(path, 'utf8');
    expect(doc).toContain('Status: not reviewed. Not approved.');
  });

  it('leaves the reviewer sign-off unsigned', () => {
    // If someone fills this in, they must also remove this test — deliberately, and with
    // a real name attached. That is the point.
    const doc = readFileSync(path, 'utf8');
    expect(doc).toContain('Reviewer name and registration number:');
    expect(doc).toMatch(/\| ☐ \|/); // at least one unchecked review box remains
  });

  it('points the reviewer at the single file they edit', () => {
    const doc = readFileSync(path, 'utf8');
    expect(doc).toContain('src/clinical/parameters.ts');
  });
});
