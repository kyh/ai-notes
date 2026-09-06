"use client";

import * as React from "react";
import type { EveMessage, EveMessagePart } from "eve/react";
import { useEveAgent } from "eve/react";
import { ArrowUpIcon, CheckIcon, KeyIcon, Loader2Icon, SparklesIcon, XIcon } from "lucide-react";
import { toast } from "sonner";
import { z } from "zod";

import { MarkdownPreview } from "@/components/notes/markdown-preview";
import { Button } from "@/components/ui/button";
import { Kbd } from "@/components/ui/kbd";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Textarea } from "@/components/ui/textarea";
import { useLocalStorage } from "@/hooks/use-local-storage";
import { isAtBottom } from "@/lib/autoscroll";
import { applyStreamEvent, type AgentStreamEvent } from "@/lib/chat-bridge";
import type { NotesContext } from "@/lib/notes-context";
import { useNotesStore } from "@/lib/notes-store";
import { cn } from "cn";
import { ApiKeyDialog, GATEWAY_API_KEY_STORAGE_KEY } from "./api-key-dialog";

const EXAMPLE_PROMPTS = [
  "Summarize my meeting notes",
  "Tag all my notes",
  "Rewrite the blog draft to be punchier",
  "Turn my week plan into a checklist",
  "What did I say about hiring?",
];

const buildNotesContext = (): NotesContext => {
  const { notes, activeNoteId } = useNotesStore.getState();
  return {
    now: new Date().toISOString(),
    timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    activeNoteId,
    notes: notes.map((note) => ({
      id: note.id,
      title: note.title,
      tags: note.tags,
      updatedAt: note.updatedAt,
      snippet: note.content.slice(0, 200),
      // Full body only for the active note; `undefined` is dropped by JSON.
      content: note.id === activeNoteId ? note.content : undefined,
    })),
  };
};

/**
 * BYO-key transport: the stored gateway key rides as a bearer header on
 * every eve request (the channel verifier hands it to the dynamic model
 * resolver). Read from localStorage on every request — eve captures this
 * resolver once at store creation, so React state would go stale.
 */
const resolveAuthHeaders = (): Readonly<Record<string, string>> => {
  if (typeof window === "undefined") return {};
  const key = window.localStorage.getItem(GATEWAY_API_KEY_STORAGE_KEY);
  return key !== null && key.length > 0 ? { authorization: `Bearer ${key}` } : {};
};

const applyToolResult = (event: AgentStreamEvent): void => {
  // Read the store per event: a create and its follow-up update arrive as two
  // events, and the second has to see the first one's note.
  const notification = applyStreamEvent(event, useNotesStore.getState());
  if (notification === null) return;
  if (notification.tone === "error") toast.error(notification.message);
  else toast.success(notification.message);
};

/**
 * Auth-shaped failures: a 401 from the channel (keyless in prod), a
 * rejected gateway key at the model call, or a missing server key in dev.
 * All of them route back to the key dialog.
 */
const isAuthError = (error: Error): boolean =>
  /unauthorized|forbidden|authentication|api.?key|credential|401|403/i.test(error.message);

interface ChatPanelProps {
  open: boolean;
  onClose: () => void;
}

export function ChatPanel({ open, onClose }: ChatPanelProps) {
  const [input, setInput] = React.useState("");
  const [showApiKeyDialog, setShowApiKeyDialog] = React.useState(false);
  const [apiKey, , removeApiKey] = useLocalStorage(GATEWAY_API_KEY_STORAGE_KEY, "");
  const viewportRef = React.useRef<HTMLDivElement>(null);
  const transcriptRef = React.useRef<HTMLDivElement>(null);
  const pinnedToBottomRef = React.useRef(true);

  const agent = useEveAgent({
    headers: resolveAuthHeaders,
    onEvent: applyToolResult,
    onError: (error) => {
      if (isAuthError(error)) {
        removeApiKey();
        toast.error("Invalid API key. Please enter a valid Vercel AI Gateway API key.");
        setShowApiKeyDialog(true);
      } else {
        toast.error(error.message || "Something went wrong");
      }
    },
  });
  const { data, status, error } = agent;

  const isLoading = status === "submitted" || status === "streaming";
  const showKeyNotice = status === "error" && error !== undefined && isAuthError(error);

  // Follow the transcript as it grows. Watching the rendered height catches
  // streamed tokens too, which appending-message deps would miss.
  React.useEffect(() => {
    const viewport = viewportRef.current;
    const transcript = transcriptRef.current;
    if (!viewport || !transcript) return;

    // Only user scrolls decide whether to keep following; the jump below is
    // instant so the scroll it fires re-reads a bottomed-out viewport rather
    // than a smooth-scroll frame somewhere in between.
    const handleScroll = () => {
      pinnedToBottomRef.current = isAtBottom(viewport);
    };
    const observer = new ResizeObserver(() => {
      if (pinnedToBottomRef.current) viewport.scrollTop = viewport.scrollHeight;
    });

    viewport.addEventListener("scroll", handleScroll, { passive: true });
    observer.observe(transcript);
    return () => {
      viewport.removeEventListener("scroll", handleScroll);
      observer.disconnect();
    };
  }, []);

  const needsKey = !apiKey && process.env.NODE_ENV !== "development";

  const send = (text: string) => {
    const trimmed = text.trim();
    if (!trimmed || isLoading) return;
    if (needsKey) {
      setShowApiKeyDialog(true);
      return;
    }
    agent.send(trimmed, { clientContext: buildNotesContext() }).catch(() => undefined); // failures surface via status/error/onError
    setInput("");
  };

  const handleTextareaFocus = () => {
    if (needsKey) setShowApiKeyDialog(true);
  };

  return (
    <>
      <aside
        className={cn(
          "w-[24rem] shrink-0 flex-col border-l bg-background",
          open ? "flex" : "hidden",
        )}
      >
        <div className="flex h-12 shrink-0 items-center justify-between border-b px-4">
          <div className="flex items-center gap-2 text-sm font-medium">
            <SparklesIcon className="size-3.5" />
            Assistant
          </div>
          <Button variant="ghost" size="icon-xs" onClick={onClose} aria-label="Close assistant">
            <XIcon />
          </Button>
        </div>

        <ScrollArea className="min-h-0 flex-1" viewportRef={viewportRef}>
          <div ref={transcriptRef} className="flex flex-col gap-4 p-4">
            {data.messages.length === 0 ? (
              <div className="flex flex-col gap-3 pt-6">
                <p className="text-sm text-muted-foreground">
                  Ask about your notes, or have them rewritten, tagged, and reorganized for you.
                  Try:
                </p>
                <div className="flex flex-col items-start gap-1.5">
                  {EXAMPLE_PROMPTS.map((prompt) => (
                    <Button
                      key={prompt}
                      variant="outline"
                      size="sm"
                      className="h-auto whitespace-normal py-1.5 text-left font-normal"
                      onClick={() => send(prompt)}
                    >
                      {prompt}
                    </Button>
                  ))}
                </div>
              </div>
            ) : (
              data.messages.map((message) => <ChatMessage key={message.id} message={message} />)
            )}
            {status === "submitted" && (
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <Loader2Icon className="size-3 animate-spin" />
                Thinking…
              </div>
            )}
            {showKeyNotice && (
              <div className="rounded-md border bg-muted/50 px-3 py-2 text-xs text-muted-foreground">
                The assistant needs a Vercel AI Gateway key —{" "}
                <button
                  type="button"
                  className="underline"
                  onClick={() => setShowApiKeyDialog(true)}
                >
                  add yours
                </button>{" "}
                or set <code className="font-mono">AI_GATEWAY_API_KEY</code> on the server.
              </div>
            )}
          </div>
        </ScrollArea>

        <form
          className="shrink-0 border-t p-3"
          onSubmit={(e) => {
            e.preventDefault();
            send(input);
          }}
        >
          <div className="rounded-lg border bg-background transition-colors focus-within:border-ring focus-within:ring-3 focus-within:ring-ring/50">
            <Textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onFocus={handleTextareaFocus}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  send(input);
                }
              }}
              placeholder="Ask about your notes…"
              className="max-h-40 min-h-16 resize-none border-none shadow-none focus-visible:ring-0 dark:bg-transparent"
              disabled={isLoading}
            />
            <div className="flex items-center gap-2 px-2 pb-2">
              <Button
                type="button"
                variant="ghost"
                size="icon-xs"
                onClick={() => setShowApiKeyDialog(true)}
                aria-label="Set API key"
              >
                <KeyIcon />
              </Button>
              <span className="ml-auto flex items-center gap-1 text-[11px] text-muted-foreground">
                <Kbd>Enter</Kbd> to send
              </span>
              <Button
                type="submit"
                size="icon-xs"
                disabled={!input.trim() || isLoading}
                aria-label="Send message"
              >
                <ArrowUpIcon />
              </Button>
            </div>
          </div>
        </form>
      </aside>
      <ApiKeyDialog open={showApiKeyDialog} onOpenChange={setShowApiKeyDialog} />
    </>
  );
}

// -----------------------------------------------------------------------------
// Message rendering — eve's default reducer projects `data.messages` in the
// AI SDK UIMessage convention: text parts plus `dynamic-tool` parts.
// -----------------------------------------------------------------------------

function ChatMessage({ message }: { message: EveMessage }) {
  if (message.role === "user") {
    const text = message.parts.map((part) => (part.type === "text" ? part.text : "")).join("");
    return (
      <div className="max-w-[85%] self-end rounded-lg bg-primary px-3 py-2 text-sm text-primary-foreground">
        {text}
      </div>
    );
  }

  return (
    <div className="flex max-w-full flex-col gap-2 self-start">
      {message.parts.map((part, index) => {
        const key = `${message.id}-${index}`;
        if (part.type === "text" && part.text.length > 0) {
          return <MarkdownPreview key={key} content={part.text} />;
        }
        if (part.type === "dynamic-tool") {
          return <ToolChip key={key} part={part} />;
        }
        return null;
      })}
    </div>
  );
}

type DynamicToolPart = Extract<EveMessagePart, { type: "dynamic-tool" }>;

const TOOL_LABELS = {
  create_note: { active: "Creating note", done: "Created note" },
  update_note: { active: "Updating note", done: "Updated note" },
  delete_note: { active: "Deleting note", done: "Deleted note" },
} satisfies Record<string, { active: string; done: string }>;

const isLabeledTool = (toolName: string): toolName is keyof typeof TOOL_LABELS =>
  toolName in TOOL_LABELS;

/** Loose view of tool inputs, for the chip detail line only. */
const toolInputPreviewSchema = z.object({
  title: z.string().optional(),
  id: z.string().optional(),
});

function ToolChip({ part }: { part: DynamicToolPart }) {
  const notes = useNotesStore((state) => state.notes);

  if (!isLabeledTool(part.toolName)) return null;
  const labels = TOOL_LABELS[part.toolName];

  const done = part.state === "output-available";
  const failed = part.state === "output-error" || part.state === "output-denied";
  const label = done ? labels.done : failed ? "Tool call failed" : labels.active;

  let detail = "";
  if (part.state === "input-available" || part.state === "output-available") {
    const input = toolInputPreviewSchema.safeParse(part.input);
    if (input.success) {
      detail =
        part.toolName === "create_note"
          ? (input.data.title ?? "")
          : (notes.find((n) => n.id === input.data.id)?.title ?? "");
    }
  }

  return (
    <div className="flex w-fit max-w-full items-center gap-1.5 rounded-md border bg-muted/50 px-2 py-1 text-xs text-muted-foreground">
      {done ? (
        <CheckIcon className="size-3 shrink-0" />
      ) : failed ? (
        <XIcon className="size-3 shrink-0" />
      ) : (
        <Loader2Icon className="size-3 shrink-0 animate-spin" />
      )}
      <span className="truncate">
        {label}
        {detail ? ` — ${detail}` : ""}
      </span>
    </div>
  );
}
