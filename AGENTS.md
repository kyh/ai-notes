# AGENTS.md

**ai-notes** is a forkable, agent-native Next.js template: a local-first notes app whose
assistant edits your notes through typed [eve](https://eve.dev) tools. This is the
tool-agnostic guide for coding agents — it's meant to be run, not just read. Claude also
reads `CLAUDE.md`; both point back here.

## Quickstart (headless)

```sh
pnpm install
pnpm dev        # → http://localhost:3000
```

That's the whole setup. **No Docker, no database, no migrations, no login, no seed step.**
Notes live in `localStorage` and the store seeds itself on first visit. `pnpm dev` boots
_two_ runtimes: the Next.js dev server on `:3000` and eve's agent dev server on an ephemeral
port, proxied same-origin by `withEve` (`next.config.ts`).

Liveness: `curl -s -o /dev/null -w '%{http_code}' localhost:3000` → `200`.

## Credentials — what works without a key

One optional env var, `AI_GATEWAY_API_KEY` (a [Vercel AI Gateway](https://vercel.com/docs/ai-gateway)
key, `vck_…`). See `.env.example`. It is not needed to run or verify the app:

```sh
echo "AI_GATEWAY_API_KEY=vck_..." > .env.local   # optional; only the AI path needs it
```

| Surface                                    | Needs a key? |
| ------------------------------------------ | ------------ |
| Notes CRUD, search, tags, markdown preview | **No**       |
| Sending a message to the assistant         | **Yes**      |

`src/components/chat/chat-panel.tsx` gates the key dialog on
`!apiKey && process.env.NODE_ENV !== "development"`, so under `pnpm dev` the dialog is
skipped entirely and the turn goes straight to the server key. With no key set, the turn
fails at the model call — the panel renders _"The assistant needs a Vercel AI Gateway key…"_
and the dev server logs `[eve:harness.tool-loop] AI Gateway authentication failed`. There is
**no offline/emulated model path**; an AI turn cannot be verified without a real key.

So: drive and assert the entire notes UI headlessly with zero credentials. For an AI turn,
supply a key or stop at the static gate.

## Seeded content

`src/lib/seed-notes.ts` + the `onRehydrateStorage` hook in `src/lib/notes-store.ts` plant six
hand-authored notes on first visit, so the assistant has real material to summarize, tag,
rewrite and query. Stable ids you can target: `week-plan` (exported as `WEEK_PLAN_NOTE_ID`),
`blog-draft`, `product-sync-notes`, `project-ideas`, `reading-list`, `weeknight-ragu`.

To reset to the seed, clear the browser's `localStorage` for `localhost:3000`.

## Verify a change end-to-end

Static gate — **run before every commit** (there is no CI workflow in this repo; this is the
gate):

```sh
pnpm verify     # typecheck · lint · format
```

`format` is `oxfmt --check` and `lint` is `--deny-warnings`, so `verify` fails rather than
rewrites. Use `pnpm format:fix` / `pnpm lint:fix` to apply. There is no test suite.

Runtime — drive the real UI with [agent-browser](https://github.com/vercel-labs/agent-browser).
This exact sequence is verified against the seeded app:

```sh
agent-browser open http://localhost:3000
agent-browser wait 'input[aria-label="Note title"]'        # ← hydration gate, see below
agent-browser click 'button[aria-label="New note"]'
agent-browser fill  'input[aria-label="Note title"]'      "Ported from init"
agent-browser fill  'textarea[aria-label="Note content"]' "Verified headlessly."
agent-browser snapshot -i -c                               # assert the note is in the list
agent-browser click 'button[aria-label="Delete note"]'     # clean up
```

**The hydration gate matters.** `src/components/notes/notes-app.tsx` holds the three panes
behind a `mounted` flag set in `useEffect`, because notes rehydrate from `localStorage` on the
client. Server HTML is _only_ `<Skeleton>` elements — snapshot before hydration and you see
nothing but placeholders. Wait for a post-mount element (the note-title input, not the `<h1>`,
which renders in both passes). The `mounted` gate is load-bearing; removing it is a real
hydration mismatch.

Two selector gotchas learned the hard way: `agent-browser find role button click "New note"`
matches the Base UI `TooltipTrigger` wrapper and silently does nothing — use the CSS selector
form above. And the chat input's placeholder ends in a real ellipsis (`…`), so match it with
`textarea[placeholder^="Ask about"]`.

Don't stop at `pnpm verify` — exercise the actual flow and observe the result.

## Platform matrix

| Platform                    | Dev command | Agent-verifiable at runtime?         |
| --------------------------- | ----------- | ------------------------------------ |
| Web (Next.js + eve runtime) | `pnpm dev`  | **Yes** — headless via agent-browser |

One surface, one command. The eve agent runtime is not a separate target: `withEve` mounts it
behind the Next.js origin in dev and deploys as one Vercel project in prod.

## Rules that matter

- **Never run `eve build` while `pnpm dev` is running** — it corrupts eve's dev workflow
  cache, and the symptom is a dev server that breaks with no hint of the cause. Recovery:
  `rm -rf .eve .workflow-data` and restart. Both dirs are gitignored.
- **`agent/tools/*.ts` are snake_case on purpose.** eve derives the model-visible tool name
  from the filename. Everything else is kebab-case.
- **Files imported by `agent/` must use relative imports** (`../../src/lib/…`), not the `@/*`
  alias — eve's compiler does not read tsconfig `paths`.
- **The `disableTool()` files in `agent/tools/` are not dead code.** They are the only way to
  remove eve's built-in harness tools (bash, glob, grep, web_fetch, …).
- **No `any`, no non-null `!`, no `as` casts** — enforced by `.oxlintrc.json`. Parse at the
  boundaries instead (stream events, tool payloads, `localStorage`) with the zod schemas in
  `src/lib/`.
- **Add UI only via `pnpm dlx shadcn@latest add <name>`** (shadcn/ui **base-vega** style on
  Base UI). Base UI idioms: `render` prop, not `asChild`; `data-open:` / `data-closed:`
  variants.
- `maxSubagentDepth: 1` in `agent/agent.ts` and the `subagent.event` unwrapping in the chat
  panel are two halves of one workaround (eve 0.22 rejects `0`). Don't "simplify" either.

## Map

- `agent/agent.ts` — `defineAgent`: gateway model + `step.started` BYO-key resolver + limits
- `agent/instructions.md` — system prompt, incl. the per-turn context contract
- `agent/channels/eve.ts` — auth walk: user bearer key → Vercel OIDC → localhost dev
- `agent/tools/{create,update,delete}_note.ts` — the mutations the model can call
- `src/lib/assistant-schemas.ts` — the zod contract shared by agent tools and the chat panel
- `src/lib/notes-context.ts` — per-turn app state the client ships with every request
- `src/lib/notes-store.ts` · `src/lib/seed-notes.ts` — zustand + localStorage persist, seed
- `src/components/chat/` — chat panel (`useEveAgent` bridge), API key dialog
- `src/components/notes/` — app shell, list, editor, markdown preview
- `CLAUDE.md` — conventions + command list (Claude-specific) · `README.md` — product overview
