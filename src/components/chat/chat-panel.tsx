"use client";

import * as React from "react";
import { useChat } from "@ai-sdk/react";
import { ArrowUpIcon, CheckIcon, KeyIcon, Loader2Icon, SparklesIcon, XIcon } from "lucide-react";
import { toast } from "sonner";

import {
  createNoteDataSchema,
  deleteNoteDataSchema,
  updateNoteDataSchema,
} from "@/ai/messages/data-parts";
import type { ChatUIMessage } from "@/ai/messages/types";
import { MarkdownPreview } from "@/components/notes/markdown-preview";
import { Button } from "@/components/ui/button";
import { Kbd } from "@/components/ui/kbd";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Textarea } from "@/components/ui/textarea";
import { useLocalStorage } from "@/hooks/use-local-storage";
import type { NotesContext } from "@/lib/notes-context";
import { useNotesStore, type NotePatch } from "@/lib/notes-store";
import { cn } from "@/lib/utils";
import { ApiKeyDialog, GATEWAY_API_KEY_STORAGE_KEY } from "./api-key-dialog";
import { demoTransport } from "./demo-transport";

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
      ...(note.id === activeNoteId ? { content: note.content } : {}),
    })),
  };
};

interface ChatPanelProps {
  open: boolean;
  onClose: () => void;
}

export function ChatPanel({ open, onClose }: ChatPanelProps) {
  const [input, setInput] = React.useState("");
  const [showApiKeyDialog, setShowApiKeyDialog] = React.useState(false);
  const [apiKey, , removeApiKey] = useLocalStorage(GATEWAY_API_KEY_STORAGE_KEY, "");
  const bottomRef = React.useRef<HTMLDivElement>(null);

  const { messages, sendMessage, status } = useChat<ChatUIMessage>({
    id: apiKey === "" ? "keyless" : apiKey,
    transport: apiKey === "demo" ? demoTransport : undefined,
    onError: (error) => {
      const message = error.message.toLowerCase();
      const isAuthError =
        message.includes("unauthorized") ||
        message.includes("authentication") ||
        message.includes("invalid api key") ||
        message.includes("gateway api key is required") ||
        message.includes("401") ||
        message.includes("403");
      if (isAuthError) {
        removeApiKey();
        toast.error("Invalid API key. Please enter a valid Vercel Gateway API key.");
        setShowApiKeyDialog(true);
      } else {
        toast.error(error.message || "Something went wrong");
      }
    },
    onData: (dataPart) => {
      const store = useNotesStore.getState();
      switch (dataPart.type) {
        case "data-create-note": {
          const parsed = createNoteDataSchema.safeParse(dataPart.data);
          if (!parsed.success) return;
          store.insertNote(parsed.data.note);
          toast.success(`Created "${parsed.data.note.title}"`);
          break;
        }
        case "data-update-note": {
          const parsed = updateNoteDataSchema.safeParse(dataPart.data);
          if (!parsed.success) return;
          const { id, title, content, tags } = parsed.data;
          const note = store.notes.find((n) => n.id === id);
          if (!note) {
            toast.error("The assistant tried to update a note that no longer exists");
            return;
          }
          const patch: NotePatch = {};
          if (title !== undefined) patch.title = title;
          if (content !== undefined) patch.content = content;
          if (tags !== undefined) patch.tags = tags;
          store.updateNote(id, patch);
          toast.success(`Updated "${patch.title ?? note.title}"`);
          break;
        }
        case "data-delete-note": {
          const parsed = deleteNoteDataSchema.safeParse(dataPart.data);
          if (!parsed.success) return;
          const note = store.notes.find((n) => n.id === parsed.data.id);
          if (!note) return;
          store.deleteNote(note.id);
          toast.success(`Deleted "${note.title}"`);
          break;
        }
      }
    },
  });

  const isLoading = status === "submitted" || status === "streaming";

  React.useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, status]);

  const needsKey = !apiKey && process.env.NODE_ENV !== "development";

  const send = (text: string) => {
    const trimmed = text.trim();
    if (!trimmed || isLoading) return;
    if (needsKey) {
      setShowApiKeyDialog(true);
      return;
    }
    sendMessage(
      { text: trimmed },
      {
        body: {
          ...(apiKey ? { gatewayApiKey: apiKey } : {}),
          notesContext: buildNotesContext(),
        },
      },
    );
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

        <ScrollArea className="min-h-0 flex-1">
          <div className="flex flex-col gap-4 p-4">
            {messages.length === 0 ? (
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
              messages.map((message) => <ChatMessage key={message.id} message={message} />)
            )}
            {status === "submitted" && (
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <Loader2Icon className="size-3 animate-spin" />
                Thinking…
              </div>
            )}
            <div ref={bottomRef} />
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
// Message rendering
// -----------------------------------------------------------------------------

function ChatMessage({ message }: { message: ChatUIMessage }) {
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
        if (part.type === "text") {
          return <MarkdownPreview key={key} content={part.text} />;
        }
        if (
          part.type === "tool-createNote" ||
          part.type === "tool-updateNote" ||
          part.type === "tool-deleteNote"
        ) {
          return <ToolChip key={key} part={part} />;
        }
        return null;
      })}
    </div>
  );
}

type NotesToolPart = Extract<
  ChatUIMessage["parts"][number],
  { type: "tool-createNote" | "tool-updateNote" | "tool-deleteNote" }
>;

const TOOL_LABELS: Record<NotesToolPart["type"], string> = {
  "tool-createNote": "Creating note",
  "tool-updateNote": "Updating note",
  "tool-deleteNote": "Deleting note",
};

const TOOL_LABELS_DONE: Record<NotesToolPart["type"], string> = {
  "tool-createNote": "Created note",
  "tool-updateNote": "Updated note",
  "tool-deleteNote": "Deleted note",
};

function ToolChip({ part }: { part: NotesToolPart }) {
  const notes = useNotesStore((state) => state.notes);

  const done = part.state === "output-available";
  const failed = part.state === "output-error";
  const label = done
    ? TOOL_LABELS_DONE[part.type]
    : failed
      ? "Tool call failed"
      : TOOL_LABELS[part.type];

  let detail = "";
  if (part.state === "input-available" || part.state === "output-available") {
    if (part.type === "tool-createNote") {
      detail = part.input.title;
    } else {
      const note = notes.find((n) => n.id === part.input.id);
      detail = note?.title ?? "";
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
