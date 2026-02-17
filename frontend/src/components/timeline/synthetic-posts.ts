import type { TimelinePostItem } from '~/components/timeline/types'

const now = Date.now()

export const syntheticTimelinePosts: TimelinePostItem[] = [
  {
    post: {
      _id: 'synthetic-1',
      _creationTime: now - 20 * 60_000,
      githubUsername: 'demo-user',
      title: 'Shipping an Instagram-like post card for code sessions',
      description:
        '## What changed\n\nBuilt a compact timeline post inspired by Instagram, but focused on coding sessions.\n\n- Added an expandable markdown description\n- Added a right-side timeline with edit deltas\n- Tightened spacing for a denser feed',
      promptCount: 9,
      totalWords: 1340,
      totalLinesAdded: 132,
      totalLinesRemoved: 41,
      status: 'completed',
    },
    timeline: [
      {
        _id: 'synthetic-1-1',
        timestamp: now - 18 * 60_000,
        linesAddedCount: 24,
        linesRemovedCount: 3,
        microSummary: 'Kickoff: established post layout and compact spacing rules.',
      },
      {
        _id: 'synthetic-1-2',
        timestamp: now - 14 * 60_000,
        linesAddedCount: 7,
        linesRemovedCount: 10,
        microSummary: 'Adjusted hierarchy: bigger title and cleaner metadata row.',
      },
      {
        _id: 'synthetic-1-3',
        timestamp: now - 10 * 60_000,
        linesAddedCount: 13,
        linesRemovedCount: 2,
        microSummary: 'Integrated markdown renderer with safe defaults.',
      },
      {
        _id: 'synthetic-1-4',
        timestamp: now - 7 * 60_000,
        linesAddedCount: 9,
        linesRemovedCount: 6,
        microSummary: 'Added see-more behavior to keep cards short by default.',
      },
      {
        _id: 'synthetic-1-5',
        timestamp: now - 4 * 60_000,
        linesAddedCount: 13,
        linesRemovedCount: 2,
        microSummary: 'Finalized timeline panel and polish pass.',
      },
    ],
  },
  {
    post: {
      _id: 'synthetic-2',
      _creationTime: now - 30 * 60_000,
      githubUsername: 'product-dev',
      title: 'User timeline page with incremental feed loading',
      description:
        '### User page\n\nEach username now has a focused timeline view.\n\n1. Route: `/users/$username`\n2. Feed: infinite load using Convex paginated query\n3. Post card: same UI as home feed for consistency',
      promptCount: 6,
      totalWords: 920,
      totalLinesAdded: 88,
      totalLinesRemoved: 19,
      status: 'active',
    },
    timeline: [
      {
        _id: 'synthetic-2-1',
        timestamp: now - 26 * 60_000,
        linesAddedCount: 18,
        linesRemovedCount: 2,
        microSummary: 'Defined route-level shell for user timeline.',
      },
      {
        _id: 'synthetic-2-2',
        timestamp: now - 21 * 60_000,
        linesAddedCount: 9,
        linesRemovedCount: 5,
        microSummary: 'Connected paginated query and intersection load trigger.',
      },
      {
        _id: 'synthetic-2-3',
        timestamp: now - 16 * 60_000,
        linesAddedCount: 11,
        linesRemovedCount: 1,
        microSummary: 'Aligned post card visual language across feed and user page.',
      },
    ],
  },
]
