import { describe, expect, it } from 'vitest';
import { PHASES, type PhaseId } from '../../src/lib/phases';
import { buildKeyframes, frameAt, type Anchor } from '../../src/lib/timeline';

const LAST = 98;

/** A desktop-ish track: contiguous anchors laid out left to right. */
function layout(spec: [PhaseId, number][], gap = 0): Anchor[] {
  let x = 0;
  return spec.map(([phase, width]) => {
    const anchor = { phase, start: x, end: x + width };
    x += width + gap;
    return anchor;
  });
}

const VIEWPORT = 1440;
const anchors = layout([
  ['student', 1380], // hero
  ['student', 1120], // about
  ['student', 950], // education
  ['member', 700], // IEEE SB CEV
  ['leader', 900], // IEEE LINK
  ['leader', 420], // India Council
  ['leader', 1300], // highlights
  ['professional', 1150], // experience
  ['professional', 1000], // skills
  ['professional', 1180], // philosophy
  ['professional', 1270], // contact
]);
const trackWidth = anchors.at(-1)!.end + 115;
const maxScroll = trackWidth - VIEWPORT;
const focusX = VIEWPORT / 2;
const keyframes = buildKeyframes({ anchors, maxScroll, focusX, lastFrame: LAST, morphPx: 500 });

const progressUnderFocus = (x: number) => (x - focusX) / maxScroll;

describe('frameAt', () => {
  it('starts on the first frame and ends on the last frame', () => {
    expect(frameAt(0, keyframes)).toBe(0);
    expect(frameAt(1, keyframes)).toBe(LAST);
  });

  it('clamps progress outside [0, 1]', () => {
    expect(frameAt(-0.5, keyframes)).toBe(0);
    expect(frameAt(1.5, keyframes)).toBe(LAST);
  });

  it('never goes backwards while scrolling forward (and so rewinds exactly when reversing)', () => {
    let prev = -1;
    const forward: number[] = [];
    for (let i = 0; i <= 1000; i++) {
      const f = frameAt(i / 1000, keyframes);
      expect(f).toBeGreaterThanOrEqual(prev);
      forward.push(f);
      prev = f;
    }
    const backward = Array.from({ length: 1001 }, (_, i) => frameAt((1000 - i) / 1000, keyframes));
    expect(backward).toEqual([...forward].reverse());
  });

  it('shows each anchor in its own phase while the anchor is under the character', () => {
    for (const anchor of anchors) {
      const mid = progressUnderFocus((anchor.start + anchor.end) / 2);
      if (mid <= 0 || mid >= 1) continue;
      const [lo, hi] = PHASES[anchor.phase].frames;
      const f = frameAt(mid, keyframes);
      expect(f, `${anchor.phase} @ ${anchor.start}`).toBeGreaterThanOrEqual(lo);
      expect(f, `${anchor.phase} @ ${anchor.start}`).toBeLessThanOrEqual(hi);
    }
  });

  it('plays the morph frames only on the approach to a phase change', () => {
    const morphFrames = new Set([14, 15, 16, 17, 18, 32, 33, 34, 50, 51, 52]);
    const boundaries = anchors
      .slice(1)
      .filter((a, j) => a.phase !== anchors[j]!.phase)
      .map((a) => a.start);
    const seen = new Set<number>();
    for (let i = 0; i <= 4000; i++) {
      const p = i / 4000;
      const f = frameAt(p, keyframes);
      if (!morphFrames.has(f)) continue;
      seen.add(f);
      const x = p * maxScroll + focusX;
      expect(boundaries.some((b) => x >= b - 500 && x <= b + 1)).toBe(true);
    }
    expect(seen.size).toBeGreaterThan(5);
  });

  it('has fully changed phase once the next chapter reaches the walker', () => {
    for (const [j, a] of anchors.slice(1).entries()) {
      if (a.phase === anchors[j]!.phase) continue;
      const p = progressUnderFocus(a.start);
      if (p <= 0 || p >= 1) continue;
      expect(frameAt(p, keyframes)).toBe(PHASES[a.phase].frames[0]);
    }
  });
});

describe('buildKeyframes', () => {
  it('returns strictly increasing progress with non-decreasing frames', () => {
    for (let i = 1; i < keyframes.length; i++) {
      expect(keyframes[i]!.progress).toBeGreaterThan(keyframes[i - 1]!.progress);
      expect(keyframes[i]!.frame).toBeGreaterThanOrEqual(keyframes[i - 1]!.frame);
    }
  });

  it('falls back to a straight 0 → last mapping when nothing scrolls or there are no anchors', () => {
    for (const kf of [
      buildKeyframes({ anchors, maxScroll: 0, focusX, lastFrame: LAST, morphPx: 500 }),
      buildKeyframes({ anchors: [], maxScroll, focusX, lastFrame: LAST, morphPx: 500 }),
    ]) {
      expect(frameAt(0, kf)).toBe(0);
      expect(frameAt(0.5, kf)).toBe(49);
      expect(frameAt(1, kf)).toBe(LAST);
    }
  });

  it('copes with anchors clamped onto the same progress at either end', () => {
    const squashed = layout([
      ['student', 100],
      ['member', 100],
      ['leader', 100],
      ['professional', 100],
    ]);
    const kf = buildKeyframes({ anchors: squashed, maxScroll: 50, focusX: 200, lastFrame: LAST, morphPx: 40 });
    expect(frameAt(0, kf)).toBe(0);
    expect(frameAt(1, kf)).toBe(LAST);
    let prev = -1;
    for (let i = 0; i <= 100; i++) {
      const f = frameAt(i / 100, kf);
      expect(f).toBeGreaterThanOrEqual(prev);
      prev = f;
    }
  });
});
