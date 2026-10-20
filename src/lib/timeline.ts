import { PHASES, type PhaseId } from './phases';

/** A stretch of the track (in track pixels) that belongs to one age phase. */
export interface Anchor {
  phase: PhaseId;
  start: number;
  end: number;
}

export interface Keyframe {
  progress: number;
  frame: number;
}

export interface TimelineInput {
  /** Phase anchors in left-to-right order. */
  anchors: Anchor[];
  /** Horizontal distance the track travels from start to end. */
  maxScroll: number;
  /** Where the character stands, measured from the left edge of the viewport. */
  focusX: number;
  lastFrame: number;
  /** Scroll distance over which the morph between two phases plays. */
  morphPx: number;
}

const clamp01 = (n: number) => Math.min(1, Math.max(0, n));

/**
 * Builds the progress → frame keyframes for the walk.
 *
 * Each anchor plays its phase's stable frames while it passes under the
 * character, sharing the phase's frame range with the other anchors of that
 * phase in proportion to width. Where the phase changes, the end of the outgoing
 * anchor is pulled back by `morphPx` so the morph plays out on the approach and
 * the walker has fully changed by the time the next anchor reaches them.
 */
export function buildKeyframes({ anchors, maxScroll, focusX, lastFrame, morphPx }: TimelineInput): Keyframe[] {
  const ends: Keyframe[] = [
    { progress: 0, frame: 0 },
    { progress: 1, frame: lastFrame },
  ];
  if (maxScroll <= 0 || anchors.length === 0) return ends;

  const phaseWidth = new Map<PhaseId, number>();
  for (const a of anchors) phaseWidth.set(a.phase, (phaseWidth.get(a.phase) ?? 0) + (a.end - a.start));

  const consumed = new Map<PhaseId, number>();
  const inner: Keyframe[] = [];

  anchors.forEach((anchor, i) => {
    const width = anchor.end - anchor.start;
    const [lo, hi] = PHASES[anchor.phase].frames;
    const total = phaseWidth.get(anchor.phase) || 1;
    const before = consumed.get(anchor.phase) ?? 0;
    consumed.set(anchor.phase, before + width);

    const next = anchors[i + 1];
    const endInset = next && next.phase !== anchor.phase ? Math.min(morphPx, width / 2) : 0;

    inner.push(
      { progress: (anchor.start - focusX) / maxScroll, frame: lo + ((hi - lo) * before) / total },
      { progress: (anchor.end - endInset - focusX) / maxScroll, frame: lo + ((hi - lo) * (before + width)) / total },
    );
  });

  const sorted = inner
    .filter((k) => k.progress > 0 && k.progress < 1)
    .map((k) => ({ progress: clamp01(k.progress), frame: Math.min(lastFrame, Math.max(0, k.frame)) }))
    .sort((a, b) => a.progress - b.progress || a.frame - b.frame);

  const keyframes: Keyframe[] = [ends[0]!];
  for (const k of sorted) {
    const prev = keyframes[keyframes.length - 1]!;
    const frame = Math.max(prev.frame, k.frame);
    if (k.progress === prev.progress) prev.frame = frame;
    else keyframes.push({ progress: k.progress, frame });
  }
  keyframes.push(ends[1]!);
  return keyframes;
}

/** Frame index for a scroll progress in [0, 1]. Pure, so scrolling back rewinds exactly. */
export function frameAt(progress: number, keyframes: Keyframe[]): number {
  const p = clamp01(progress);
  let i = 1;
  while (i < keyframes.length - 1 && keyframes[i]!.progress < p) i++;
  const a = keyframes[i - 1]!;
  const b = keyframes[i]!;
  const t = b.progress === a.progress ? 1 : (p - a.progress) / (b.progress - a.progress);
  return Math.round(a.frame + (b.frame - a.frame) * t);
}
