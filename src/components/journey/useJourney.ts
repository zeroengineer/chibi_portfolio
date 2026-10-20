import Lenis from 'lenis';
import { useCallback, useEffect, useRef, useState } from 'react';
import { CHAPTERS } from '../../data/chapters';
import { FRAME_COUNT } from '../../lib/frames';
import { isPhaseId } from '../../lib/phases';
import {
  activeChapterIndex,
  chapterOffset,
  clamp,
  maxScrollFor,
  scrollState,
  spacerHeight,
} from '../../lib/scrollMath';
import { buildKeyframes, frameAt, type Anchor, type Keyframe } from '../../lib/timeline';

export interface JourneyState {
  /** Horizontal distance the track has travelled, in px. */
  offset: number;
  /** 0 at the first chapter, 1 at the very end. */
  progress: number;
  /** Walk/aging frame to show. */
  frame: number;
  /** True while the world is moving under the walker. */
  moving: boolean;
}

export type JourneyListener = (state: JourneyState) => void;

interface Layout {
  spacerTop: number;
  maxScroll: number;
  viewportWidth: number;
  chapters: { id: string; start: number; end: number }[];
  keyframes: Keyframe[];
}

const MOVING_IDLE_MS = 160;

/**
 * The scroll engine. Native vertical scroll (smoothed by Lenis) drives a pinned
 * stage whose track slides horizontally; every frame the derived state is
 * pushed straight to subscribers so nothing re-renders on scroll.
 */
export function useJourney() {
  const spacerRef = useRef<HTMLDivElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);
  const listeners = useRef(new Set<JourneyListener>());
  const goToRef = useRef<(id: string) => void>(() => {});
  const lockRef = useRef<(locked: boolean) => void>(() => {});
  const [activeId, setActiveId] = useState<string>(CHAPTERS[0].id);

  const subscribe = useCallback((listener: JourneyListener) => {
    listeners.current.add(listener);
    return () => {
      listeners.current.delete(listener);
    };
  }, []);

  useEffect(() => {
    const spacer = spacerRef.current;
    const stage = stageRef.current;
    const track = trackRef.current;
    if (!spacer || !stage || !track) return;

    const lenis = new Lenis({ lerp: 0.09, autoRaf: true });
    const root = document.documentElement;
    let layout: Layout | undefined;
    let lastOffset = -1;
    let lastState: JourneyState | undefined;
    let idleTimer: ReturnType<typeof setTimeout> | undefined;

    function measure() {
      const viewportWidth = stage!.clientWidth;
      const maxScroll = maxScrollFor(track!.scrollWidth, viewportWidth);
      spacer!.style.height = `${spacerHeight(maxScroll, stage!.clientHeight)}px`;

      const trackLeft = track!.getBoundingClientRect().left;
      const span = (el: Element) => {
        const r = el.getBoundingClientRect();
        return { start: r.left - trackLeft, end: r.right - trackLeft };
      };
      const chapters = [...track!.querySelectorAll<HTMLElement>('[data-chapter]')].map((el) => ({
        id: el.id,
        ...span(el),
      }));
      const anchors: Anchor[] = [...track!.querySelectorAll<HTMLElement>('[data-phase]')].flatMap((el) => {
        const phase = el.dataset.phase;
        if (!isPhaseId(phase)) return [];
        const anchor = { phase, ...span(el) };
        // A chapter that phases its sub-blocks hands its leading padding to the first one.
        const chapter = el.closest('[data-chapter]');
        if (chapter && chapter !== el && chapter.querySelector('[data-phase]') === el) {
          anchor.start = span(chapter).start;
        }
        return [anchor];
      });

      layout = {
        spacerTop: spacer!.getBoundingClientRect().top + window.scrollY,
        maxScroll,
        viewportWidth,
        chapters,
        keyframes: buildKeyframes({
          anchors,
          maxScroll,
          // A chapter's look is reached as it settles fully into view (its left
          // edge at the viewport's left edge), wherever the walker stands on the
          // current layout; so landing on a chapter always shows its look.
          focusX: 0,
          lastFrame: FRAME_COUNT - 1,
          morphPx: clamp(viewportWidth * 0.4, 240, 560),
        }),
      };
      lenis.resize();
      update(true);
    }

    function emit(state: JourneyState) {
      lastState = state;
      listeners.current.forEach((l) => l(state));
    }

    function update(force = false) {
      if (!layout) return;
      const { offset, progress } = scrollState(window.scrollY, layout.spacerTop, layout.maxScroll);
      if (offset === lastOffset && !force) return;
      const moved = lastOffset !== -1 && offset !== lastOffset;
      lastOffset = offset;

      track!.style.transform = `translate3d(${-offset}px, 0, 0)`;
      emit({ offset, progress, frame: frameAt(progress, layout.keyframes), moving: moved || !!lastState?.moving });

      if (moved) {
        clearTimeout(idleTimer);
        idleTimer = setTimeout(() => lastState && emit({ ...lastState, moving: false }), MOVING_IDLE_MS);
      }

      const index = activeChapterIndex(layout.chapters, offset, layout.viewportWidth / 2);
      const chapter = layout.chapters[index];
      if (chapter) setActiveId(chapter.id);
    }

    function scrollToChapter(id: string, immediate = false) {
      const chapter = layout?.chapters.find((c) => c.id === id);
      if (!layout || !chapter) return;
      const target = layout.spacerTop + chapterOffset(chapter.start, layout.maxScroll);
      const distance = Math.abs(target - window.scrollY);
      lenis.scrollTo(target, { immediate, duration: clamp(distance / 2400, 0.8, 2.4), force: true });
    }

    goToRef.current = (id) => {
      scrollToChapter(id);
      history.replaceState(null, '', id === CHAPTERS[0].id ? location.pathname + location.search : `#${id}`);
    };
    lockRef.current = (locked) => (locked ? lenis.stop() : lenis.start());

    const onScroll = () => update();
    // The browser scrolls the stage itself to reveal hash targets or a focused
    // link (keyboard Tab). Turn that into walking there instead.
    const onStageScroll = () => {
      const nudge = stage.scrollLeft;
      if (!nudge || !layout) return;
      stage.scrollLeft = 0;
      const { offset } = scrollState(window.scrollY, layout.spacerTop, layout.maxScroll);
      lenis.scrollTo(layout.spacerTop + clamp(offset + nudge, 0, layout.maxScroll), { immediate: true, force: true });
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.defaultPrevented || e.altKey || e.ctrlKey || e.metaKey) return;
      if (e.target instanceof HTMLElement && e.target.closest('input, textarea, select, [contenteditable]')) return;
      const step = e.key === 'ArrowRight' ? 1 : e.key === 'ArrowLeft' ? -1 : 0;
      if (!step || !layout) return;
      e.preventDefault();
      lenis.scrollTo(window.scrollY + step * layout.viewportWidth * 0.8);
    };

    // Reveal-on-enter for panels; works with the transformed track because
    // IntersectionObserver uses rendered (transformed) boxes.
    const reveal = new IntersectionObserver(
      (entries) =>
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          entry.target.classList.add('is-revealed');
          reveal.unobserve(entry.target);
        }),
      { threshold: 0.12 },
    );
    track.querySelectorAll('[data-reveal]').forEach((el) => reveal.observe(el));

    const resize = new ResizeObserver(() => measure());
    resize.observe(track);
    resize.observe(stage);

    root.dataset.journey = 'ready';
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('keydown', onKey);
    stage.addEventListener('scroll', onStageScroll, { passive: true });
    measure();
    onStageScroll();

    // Deep links (#experience) once fonts have settled the layout.
    const initialHash = decodeURIComponent(location.hash.slice(1));
    if (initialHash) document.fonts.ready.then(() => scrollToChapter(initialHash, true));

    return () => {
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('keydown', onKey);
      stage.removeEventListener('scroll', onStageScroll);
      resize.disconnect();
      reveal.disconnect();
      clearTimeout(idleTimer);
      lenis.destroy();
      delete root.dataset.journey;
    };
  }, []);

  const goTo = useCallback((id: string) => goToRef.current(id), []);
  const setLocked = useCallback((locked: boolean) => lockRef.current(locked), []);

  return {
    spacerRef,
    stageRef,
    trackRef,
    subscribe,
    activeId,
    goTo,
    setLocked,
  };
}
