import type { PhaseId } from '../lib/phases';

export interface Chapter {
  id: string;
  /** Label in the navigation. */
  nav: string;
  /** Label on the roadside signpost; chapters without one get no signpost. */
  sign?: string;
  /**
   * Age phase the walker is in while this chapter is under them. Leave unset
   * when the chapter marks its own sub-blocks with `data-phase` instead.
   */
  phase?: PhaseId;
}

/** Chapter order is the story order: the walker ages as they move through it. */
export const CHAPTERS = [
  { id: 'hero', nav: 'Start', phase: 'student' },
  { id: 'about', nav: 'About', sign: 'About', phase: 'student' },
  { id: 'education', nav: 'Education', sign: 'Education', phase: 'student' },
  { id: 'leadership', nav: 'Leadership', sign: 'Leadership' },
  { id: 'highlights', nav: 'Highlights', sign: 'Highlights', phase: 'leader' },
  { id: 'experience', nav: 'Experience', sign: 'Experience', phase: 'professional' },
  { id: 'skills', nav: 'What I Do', sign: 'Skills', phase: 'professional' },
  { id: 'philosophy', nav: 'Philosophy', sign: 'Philosophy', phase: 'professional' },
  { id: 'contact', nav: 'Contact', phase: 'professional' },
] as const satisfies readonly Chapter[];

export type ChapterId = (typeof CHAPTERS)[number]['id'];

export function getChapter(id: ChapterId): Chapter & { number: string } {
  const index = CHAPTERS.findIndex((c) => c.id === id);
  return { ...CHAPTERS[index]!, number: String(index).padStart(2, '0') };
}
