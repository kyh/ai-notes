import type { Note } from "./note-schema";

/** Stable id so the demo transport can target this note. */
export const WEEK_PLAN_NOTE_ID = "week-plan";

const hoursAgo = (hours: number) => new Date(Date.now() - hours * 60 * 60 * 1000).toISOString();

/**
 * Hand-authored seed content so the AI features have something real
 * to summarize, tag, rewrite, and answer questions about.
 */
export const createSeedNotes = (): Note[] => [
  {
    content: `## Monday
- Ship the notes list refactor
- 1:1 with Sam at 2pm
- Review Priya's onboarding PR

## Tuesday
- Write the Q3 planning doc outline
- Gym before work
- Book flights for the offsite

## Wednesday
- Deep work block: editor performance
- Interview: senior design candidate at 11am

## Thursday
- Q3 planning review with the team
- Draft release notes for v0.4
- Dinner with Alex

## Friday
- Bug triage + cleanup day
- Publish the blog post if it's ready
- Plan next week before logging off`,
    createdAt: hoursAgo(160),
    id: WEEK_PLAN_NOTE_ID,
    tags: ["planning"],
    title: "Week plan",
    updatedAt: hoursAgo(0.5),
  },
  {
    content: `I used to write constantly. A blog nobody read, long emails, notebooks full of half-formed arguments with myself. Then work happened, and somewhere along the way I convinced myself that shipping code was the only writing that counted.

I was wrong, and it took a decade to notice.

Writing is the only way I know to find out what I actually think. Code tells you whether an idea works; prose tells you whether you understand it. When I try to explain a design decision in plain sentences and the sentences won't come, that's not a writing problem. That's the design telling me it isn't done.

So I'm starting again, with rules this time:

- One post a month, no matter how rough
- No drafts older than two weeks — publish or delete
- Write the way I talk, not the way LinkedIn talks

The goal isn't an audience. The goal is a habit of thinking in public, where lazy reasoning has nowhere to hide.

(TODO: ending feels abrupt — maybe close with the notebook story?)`,
    createdAt: hoursAgo(72),
    id: "blog-draft",
    tags: ["writing", "draft"],
    title: "Draft: Why I'm learning to write again",
    updatedAt: hoursAgo(3),
  },
  {
    content: `Attendees: me, Sam, Priya, Alex

## Decisions
- Cutting the collaborative cursors feature from v0.4 — not enough signal, revisit after launch
- Editor performance is the top priority for the next two sprints
- Pricing page copy goes to Priya, due Friday

## Hiring
- Agreed to open a senior design role — Sam writing the JD this week
- Pause on backend hiring until Q3 budget is confirmed
- Alex flagged that our interview loop is too long: 5 rounds → target 3

## Action items
- [ ] Me: profile the editor on large documents, report numbers Thursday
- [ ] Sam: senior design JD draft by Friday
- [ ] Priya: pricing copy v1
- [ ] Alex: propose the shorter interview loop

Next sync: Mar 19, same time.`,
    createdAt: hoursAgo(50),
    id: "product-sync-notes",
    tags: ["work", "meetings"],
    title: "Product sync — Mar 12",
    updatedAt: hoursAgo(48),
  },
  {
    content: `Things I might build when there's a free weekend:

- **Shelf** — a read-later app that actually deletes things. Anything unread after 30 days disappears. The queue guilt is the product.
- **Ambient standup** — a bot that writes your standup from your commits, PRs, and calendar. You edit two lines instead of writing ten.
- **Recipe diff** — track how a recipe changes each time you cook it. Version control for dinner.
- **One-page CRM** — for people who hate CRMs. A single markdown table with reminders. That's it.
- **Trail conditions** — crowd-sourced "is it muddy?" for local trails. Binary answer, photo optional.

Rule of thumb: if I can't build the core loop in a weekend, it goes on the someday list, and the someday list is a lie.`,
    createdAt: hoursAgo(30),
    id: "project-ideas",
    tags: ["ideas"],
    title: "Project ideas",
    updatedAt: hoursAgo(26),
  },
  {
    content: `## Now reading
- **The Making of the Atomic Bomb** — Rhodes. Slow, worth it. The Szilard chapters are the best thing I've read this year.

## Up next
- **A Philosophy of Software Design** — Ousterhout. Re-read; skim the deep modules chapters before the Q3 architecture review.
- **Piranesi** — Clarke. Everyone says go in blind, so that's all I wrote down.

## Someday
- **Working in Public** — Eghbal. For the open source template project.
- **The Design of Everyday Things** — Norman. Embarrassing that it's still on this list.

## Finished
- **Tomorrow, and Tomorrow, and Tomorrow** — better about collaboration than any management book. The Ichigo chapters dragged.`,
    createdAt: hoursAgo(120),
    id: "reading-list",
    tags: ["reading"],
    title: "Reading list",
    updatedAt: hoursAgo(96),
  },
  {
    content: `Faster than the Sunday version, still tastes like you tried. Serves 4.

## Ingredients
- 500g ground beef (20% fat, don't go lean)
- 1 onion, 1 carrot, 1 celery stalk — all diced small
- 4 cloves garlic, sliced
- 2 tbsp tomato paste
- 400g can crushed tomatoes
- 150ml whole milk
- Splash of red wine (optional but not really)
- Rigatoni or pappardelle, parmesan, olive oil, salt

## Method
1. Brown the beef hard in a wide pan — don't stir too much, you want crust. Remove.
2. Same pan: soffritto (onion, carrot, celery) with a pinch of salt, ~8 min.
3. Garlic and tomato paste, 2 min, until the paste darkens.
4. Wine to deglaze, scrape the pan. Beef back in.
5. Crushed tomatoes + milk. Simmer 25 min while the pasta water comes up.
6. Finish the pasta in the sauce with a ladle of pasta water. Parmesan off the heat.

Notes: the milk is non-negotiable, it rounds out the acidity. Leftovers are better the next day on toast.`,
    createdAt: hoursAgo(240),
    id: "weeknight-ragu",
    tags: ["cooking"],
    title: "Weeknight ragù",
    updatedAt: hoursAgo(240),
  },
];
