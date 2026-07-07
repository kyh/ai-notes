# Agent Instructions

AI-native notes app. Next.js 16 (App Router, Turbopack), React 19, TypeScript, Tailwind CSS v4, Vercel AI SDK (`ai@6`).

## Tech Stack

- **Framework**: Next.js 16, React 19
- **UI**: Tailwind v4, shadcn/ui **base-vega** style (Base UI primitives — `@base-ui/react`, `render` prop, NOT Radix), lucide icons, sonner toasts
- **AI**: `ai@6` + `@ai-sdk/react` — `ToolLoopAgent` via Vercel AI Gateway (`openai/gpt-5.1-instant`); demo mode via `@loremllm/transport`
- **State**: zustand + localStorage persist (zod-validated on rehydrate)
- **Package Manager**: pnpm

## Architecture

```
src/ai/gateway.ts                     # MODEL_ID + createModel(apiKey) — single provider factory
src/ai/agents/notes-agent.ts          # ToolLoopAgent: createNote/updateNote/deleteNote tools
src/ai/agents/notes-agent-prompt.ts   # system prompt
src/ai/messages/data-parts.ts         # zod schemas + DataPart map — client<->server contract
src/ai/messages/notes-context.ts      # per-request app state (notes index + active note)
src/ai/response/stream-chat-response.ts
src/app/api/chat/route.ts             # zod body parse + validateUIMessages + key resolution
src/components/chat/                  # chat-panel (useChat + onData), api-key-dialog, demo-transport
src/components/notes/                 # notes-app, note-list, note-editor, markdown-preview
src/stores/notes-store.ts             # zustand store, seeds from src/lib/seed-notes.ts
```

Flow: client ships `notesContext` (index snippets + full active note + datetime) in every request body → server appends it to instructions → agent tools `writer.write` `data-*` parts → client `onData` zod-parses each payload → store mutation + sonner toast.

## Commands

```bash
pnpm dev          # dev server (Turbopack)
pnpm build        # production build
pnpm lint         # oxlint
pnpm format:fix   # oxfmt
```

## Conventions

- Path alias: `@/*` → `./src/*`
- kebab-case filenames for all TS/TSX
- No `any`, no `!`, no `as` — zod-parse at boundaries (request body, onData, localStorage)
- Add ui components ONLY via `pnpm dlx shadcn@latest add <name>` (base-vega registry); never hand-copy
- Base UI idioms: `render` prop (not `asChild`), `data-open:`/`data-closed:` variants
