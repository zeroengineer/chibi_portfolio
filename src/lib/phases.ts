/**
 * The frame video is one continuous take of the character walking *and*
 * aging. Each phase is the run of frames where the outfit is stable; the
 * frames between two phases are the morph from one look to the next.
 */
export const PHASES = {
  student: { label: 'Student', frames: [0, 13] },
  member: { label: 'IEEE Member', frames: [19, 31] },
  leader: { label: 'IEEE Leader', frames: [35, 49] },
  professional: { label: 'Professional', frames: [53, 98] },
} as const satisfies Record<string, { label: string; frames: readonly [number, number] }>;

export type PhaseId = keyof typeof PHASES;

export const PHASE_ORDER = Object.keys(PHASES) as PhaseId[];

export function isPhaseId(value: unknown): value is PhaseId {
  return typeof value === 'string' && value in PHASES;
}
