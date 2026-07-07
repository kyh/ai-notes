# AI Notes

AI-native notes — capture, organize, and rewrite your notes in natural language. A forkable Next.js template.

## Features

- **Two-pane notes app** — searchable, taggable notes list + markdown editor with live preview (tiny hand-rolled safe renderer, no markdown deps)
- **AI assistant sidebar** — chat with your notes: summarize, tag, rewrite, reorganize, and query them in natural language
- **Tool-driven mutations** — the agent creates/updates/deletes notes through typed tools; changes stream into the UI live (active note updates as you watch)
- **Local-first** — notes persist to localStorage (zod-validated), seeded with real content so the AI has something to work with
- **Demo mode** — try the marquee flow without an API key ("Turn my week plan into a checklist")

## Setup

```bash
pnpm install
echo "AI_GATEWAY_API_KEY=vck_..." > .env.local   # optional: SECRET_KEY=... for a shared sentinel key
pnpm dev
```

In development the server uses `AI_GATEWAY_API_KEY` automatically. In production, users bring their own [Vercel AI Gateway key](https://vercel.com/docs/ai-gateway) (stored in the browser), or enter `demo` in the key dialog for the scripted offline demo.

## Architecture

```
src/ai/
├── gateway.ts                     # one provider factory: createModel(apiKey) → AI Gateway model
├── agents/notes-agent.ts          # ToolLoopAgent + createNote/updateNote/deleteNote tools
├── agents/notes-agent-prompt.ts   # system prompt
├── messages/data-parts.ts         # zod schemas + DataPart map — the client<->server contract
├── messages/notes-context.ts      # app state shipped with each request (stateless server)
└── response/stream-chat-response.ts
src/app/api/chat/route.ts          # zod-parsed body, validateUIMessages, key resolution
src/components/chat/               # chat panel (useChat + onData), api key dialog, demo transport
src/components/notes/              # app shell, list, editor, markdown preview
src/stores/notes-store.ts          # zustand + localStorage persist
```

The streaming contract: each agent tool writes a `data-*` part (`data-create-note`, `data-update-note`, `data-delete-note`); the client's `onData` zod-parses the payload and applies it to the store, so AI edits appear in the editor in real time. The demo transport (`@loremllm/transport` `StaticChatTransport`) replays the same wire format with no network.

## Notes

- UI: shadcn/ui **base-vega** style (Base UI primitives). Add components with `pnpm dlx shadcn@latest add <name>`.
- Replace `public/og.jpg` and `public/favicon/` with your own brand assets before shipping a fork.
