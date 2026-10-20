import type { PhaseId } from '../lib/phases';

export interface Role {
  title: string;
  period: string;
  desc: string;
}

export interface Org {
  org: string;
  tag: string;
  /** Age phase the walker shows while passing this organisation. */
  phase: PhaseId;
  roles: Role[];
}

/** Chronological: where the IEEE journey started, through to the national level. */
export const leadership: Org[] = [
  {
    org: 'IEEE Student Branch CEV',
    tag: 'Student Branch',
    phase: 'member',
    roles: [
      {
        title: 'Membership Development Coordinator',
        period: 'Apr 2023 – Apr 2024',
        desc: 'Drove membership growth, volunteer onboarding, and community-engagement programs.',
      },
      {
        title: 'Chairperson',
        period: 'Apr 2024 – Mar 2026',
        desc: 'Leading one of the region’s most active branches: strategic planning, volunteer development, industry collaboration, technical events, and student engagement.',
      },
    ],
  },
  {
    org: 'IEEE LINK',
    tag: 'Malabar Hub',
    phase: 'leader',
    roles: [
      {
        title: 'Co-Treasurer',
        period: 'Feb 2024 – Jan 2025',
        desc: 'Managed financial planning, budgeting, and operational support for flagship programs.',
      },
      {
        title: 'Co Hub Student Representative',
        period: 'Jun 2024 – Jan 2025',
        desc: 'Supported hub-level operations, event coordination, and volunteer management.',
      },
      {
        title: 'Student Representative — Malabar Hub',
        period: 'Feb 2025 – Jan 2026',
        desc: 'Representing branches across the Malabar Hub; facilitating collaboration, organizing regional initiatives, and connecting students with IEEE opportunities.',
      },
    ],
  },
  {
    org: 'IEEE India Council',
    tag: 'National',
    phase: 'leader',
    roles: [
      {
        title: 'Chapter & Affinity Group Coordinator',
        period: 'Apr 2025 – Mar 2026',
        desc: 'Coordinating chapter and affinity-group activity across India — strengthening engagement and enabling collaboration between volunteers and organizational units.',
      },
    ],
  },
];
