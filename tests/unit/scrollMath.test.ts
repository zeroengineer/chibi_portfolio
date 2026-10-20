import { describe, expect, it } from 'vitest';
import { activeChapterIndex, chapterOffset, maxScrollFor, scrollState, spacerHeight } from '../../src/lib/scrollMath';

describe('scroll math', () => {
  it('pins for exactly the horizontal overflow of the track', () => {
    expect(maxScrollFor(5000, 1440)).toBe(3560);
    expect(maxScrollFor(800, 1440)).toBe(0);
    expect(spacerHeight(3560, 900)).toBe(4460);
  });

  it('maps vertical scroll to a clamped horizontal offset and progress', () => {
    expect(scrollState(0, 0, 3560)).toEqual({ offset: 0, progress: 0 });
    expect(scrollState(1780, 0, 3560)).toEqual({ offset: 1780, progress: 0.5 });
    expect(scrollState(9999, 0, 3560)).toEqual({ offset: 3560, progress: 1 });
    expect(scrollState(50, 100, 3560)).toEqual({ offset: 0, progress: 0 });
    expect(scrollState(500, 0, 0)).toEqual({ offset: 0, progress: 1 });
  });

  it('brings a chapter to the left edge, within the scrollable range', () => {
    expect(chapterOffset(0, 3560)).toBe(0);
    expect(chapterOffset(2000, 3560)).toBe(2000);
    expect(chapterOffset(4200, 3560)).toBe(3560);
  });

  it('reports the chapter under the focus point', () => {
    const chapters = [
      { start: 0, end: 1000 },
      { start: 1000, end: 1800 },
      { start: 1800, end: 3000 },
    ];
    expect(activeChapterIndex(chapters, 0, 720)).toBe(0);
    expect(activeChapterIndex(chapters, 300, 720)).toBe(1);
    expect(activeChapterIndex(chapters, 1100, 720)).toBe(2);
    expect(activeChapterIndex(chapters, 9000, 720)).toBe(2);
    expect(activeChapterIndex([], 0, 720)).toBe(-1);
  });
});
