// Offline, deterministic first-boot content for the local "Drafts" notebook.
//
// The application has no backend: the notebook lives in the browser's own
// lightning-fs (IndexedDB) volume, and the upstream first-boot branch that
// cloned a welcome notebook from github.com is commented out in
// src/containers/crossnote.ts. A fresh browser profile therefore starts with a
// single README.md, which is not enough surface to exercise ordering,
// filtering, pinning or quick-access behaviour, and every browser context would
// otherwise have to type its own corpus in before anything could be observed.
//
// These notes are written once, locally, at first boot, from literals in this
// file. Nothing here is fetched, nothing here depends on the wall clock, and
// the same file is present in every tree state, so the corpus is identical
// wherever it is measured.
//
// The front matter keys are exactly the ones src/lib/notebook.ts reads back
// (created / modified / pinned / favorited / icon / aliases); quoted ISO-8601
// strings are used for the two timestamps so the parsed value cannot depend on
// how the YAML parser chooses to type an unquoted date.
export interface FixtureNote {
  filePath: string;
  markdown: string;
}

export const DRAFTS_FIXTURE_NOTES: FixtureNote[] = [
  {
    filePath: "Grocery List.md",
    markdown: `---
created: "2026-01-05T09:00:00.000Z"
modified: "2026-01-06T18:30:00.000Z"
---
# Grocery List

- sourdough flour
- sea salt
- coffee beans

Pick the order up before the weekend. #shopping
`,
  },
  {
    filePath: "Meeting Notes.md",
    markdown: `---
created: "2026-02-11T10:15:00.000Z"
modified: "2026-03-02T08:45:00.000Z"
---
# Meeting Notes

Agenda for the quarterly review with the design team.

## Decisions

- Ship the offline cache first
- Defer the sync panel
`,
  },
  {
    filePath: "Quarterly Goals.md",
    markdown: `---
created: "2026-03-20T07:05:00.000Z"
modified: "2026-03-21T22:10:00.000Z"
pinned: true
---
# Quarterly Goals

Three outcomes the team committed to.

1. Cut cold start time in half
2. Ship the offline cache
3. Retire the legacy importer
`,
  },
  {
    filePath: "Trip Planning.md",
    markdown: `---
created: "2026-04-02T14:00:00.000Z"
modified: "2026-04-09T11:20:00.000Z"
---
# Trip Planning

Ferries leave the harbour at 07:40 and 16:10.

The return leg depends on the afternoon tide, so the later ferry is the safer
one to book.
`,
  },
  {
    filePath: "Sourdough Recipe.md",
    markdown: `---
created: "2026-05-15T07:30:00.000Z"
modified: "2026-05-15T07:30:00.000Z"
---
# Sourdough Recipe

Hydration seventy eight percent.

## Steps

- Feed the starter the night before
- Autolyse for one hour
- Fold every thirty minutes
`,
  },
  {
    filePath: "Weekly Review.md",
    markdown: `---
created: "2026-06-01T20:00:00.000Z"
modified: "2026-06-08T06:05:00.000Z"
aliases: "retro, weekly-log"
---
# Weekly Review

What shipped and what slipped this week.

- Shipped the offline cache, see [[Meeting Notes]]
- Slipped the importer, tracked in [[Quarterly Goals]]
`,
  },
];
