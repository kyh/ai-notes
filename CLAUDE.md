# Agent Instructions

> **Agent-driven development:** read [`AGENTS.md`](./AGENTS.md) first. It's the tool-agnostic
> runbook — headless quickstart, what works without an API key, the seeded notes, and a
> verified agent-browser recipe for driving the real UI (including the hydration gate that
> makes an early snapshot return nothing but skeletons). This file is the Claude-specific
> conventions layer; keep the two in sync.

AI-native notes app. Next.js 16 (App Router, Turbopack), React 19, TypeScript, Tailwind CSS v4, eve (Vercel's agent framework) + `ai@7`.

## Tech Stack

- **Framework**: Next.js 16, React 19
- **UI**: Tailwind v4, shadcn/ui **base-vega** style (Base UI primitives — `@base-ui/react`, `render` prop, NOT Radix), lucide icons, sonner toasts
- **AI**: `eve` (agent runtime, `withEve` Next integration, `useEveAgent` client hook) via Vercel AI Gateway (`openai/gpt-5.1-instant`); BYO-key via bearer auth + dynamic model resolver
- **State**: zustand + localStorage persist (zod-validated on rehydrate)
- **Package Manager**: pnpm

## Architecture

```
agent/agent.ts                  # defineAgent: model + step.started BYO-key resolver + limits
agent/instructions.md           # system prompt (documents the per-turn context JSON)
agent/channels/eve.ts           # auth walk: gatewayKeyBearer → vercelOidc → localDev
agent/tools/create_note.ts      # defineTool; snake_case filename = tool name
agent/tools/{update,delete}_note.ts
agent/tools/<builtin>.ts        # disableTool() sentinels (bash, web_fetch, …)
src/lib/assistant-schemas.ts    # zod contract: tool input + payload schemas (shared both sides)
src/lib/notes-context.ts        # per-turn app state shape (notes index + active note)
src/components/chat/chat-panel.tsx  # useEveAgent bridge: clientContext out, action.result in
src/components/chat/api-key-dialog.tsx
src/components/notes/           # notes-app, note-list, note-editor, markdown-preview
src/lib/notes-store.ts          # zustand store, seeds from src/lib/seed-notes.ts
```

Flow: chat panel `send({ message, clientContext: notesSnapshot })` → eve channel authenticates (user bearer key / OIDC / localhost) → dynamic model resolver picks the user's gateway key from session auth (fallback: server `AI_GATEWAY_API_KEY`) → tools return structured payloads → client `onEvent` zod-parses `action.result` events → store mutation + sonner toast.

## Commands

```bash
pnpm dev          # dev server — boots Next.js AND the eve agent runtime
pnpm build        # production build (Next). Vercel builds the eve service via withEve
pnpm verify       # typecheck · lint · format — the gate; run before every commit
pnpm lint:fix     # oxlint --fix
pnpm format:fix   # oxfmt --write
```

`lint` and `format` are check-only (`--deny-warnings`, `--check`) so `verify` fails instead
of rewriting the tree. `pnpm test` runs Node's built-in runner via tsx, but no tests are
written yet, so it is deliberately not part of `pnpm verify` (a node:test run that matches no
files exits non-zero); add `&& pnpm test` back with the first test file. There is no CI
workflow — `pnpm verify` is the gate.

**NEVER run `eve build` while `pnpm dev` is running** — it corrupts the eve dev workflow cache. If dev breaks mysteriously: delete `.eve/` + `.workflow-data/` and restart.

## Conventions

- Path alias: `@/*` → `./src/*` — but files imported by `agent/` code MUST use relative imports (eve's compiler doesn't read tsconfig paths)
- kebab-case filenames for TS/TSX; `agent/tools/*` are snake_case (eve derives tool names from filenames)
- No `any`, no `!`, no `as` — zod-parse at boundaries (stream events, tool payloads, localStorage)
- Add ui components ONLY via `pnpm dlx shadcn@latest add <name>` (base-vega registry); never hand-copy
- Base UI idioms: `render` prop (not `asChild`), `data-open:`/`data-closed:` variants
