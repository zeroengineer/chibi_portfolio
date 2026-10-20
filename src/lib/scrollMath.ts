export const clamp = (n: number, min: number, max: number) => Math.min(max, Math.max(min, n));

/** How far the track has to travel horizontally to reveal its last pixel. */
export const maxScrollFor = (trackWidth: number, viewportWidth: number) => Math.max(0, trackWidth - viewportWidth);

/** Height of the vertical runway that pins the stage while the track travels. */
export const spacerHeight = (maxScroll: number, viewportHeight: number) => maxScroll + viewportHeight;

/** Converts window scroll into the track's horizontal offset and overall progress. */
export function scrollState(scrollY: number, spacerTop: number, maxScroll: number) {
  if (maxScroll <= 0) return { offset: 0, progress: scrollY > spacerTop ? 1 : 0 };
  const offset = clamp(scrollY - spacerTop, 0, maxScroll);
  return { offset, progress: offset / maxScroll };
}

/** Horizontal offset that brings a chapter to the left edge of the viewport. */
export const chapterOffset = (chapterStart: number, maxScroll: number) => clamp(chapterStart, 0, maxScroll);

/** Index of the chapter currently under the focus point (or the last one past the end). */
export function activeChapterIndex(chapters: { start: number; end: number }[], offset: number, focusX: number) {
  const x = offset + focusX;
  let index = -1;
  chapters.forEach((c, i) => {
    if (c.start <= x) index = i;
  });
  return index;
}
