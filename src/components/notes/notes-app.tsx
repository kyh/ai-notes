"use client";

import * as React from "react";
import { NotebookPenIcon, SparklesIcon } from "lucide-react";

import { ChatPanel } from "@/components/chat/chat-panel";
import { ThemeToggle } from "@/components/theme-toggle";
import { NoteEditor } from "@/components/notes/note-editor";
import { NoteList } from "@/components/notes/note-list";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";

export function NotesApp() {
  const [chatOpen, setChatOpen] = React.useState(true);
  // Notes hydrate from localStorage on the client; gate the panes behind a
  // mount check so server and first client render agree.
  const [mounted, setMounted] = React.useState(false);
  React.useEffect(() => setMounted(true), []);

  return (
    <div className="flex h-dvh flex-col">
      <header className="flex h-12 shrink-0 items-center justify-between border-b px-4">
        <div className="flex items-center gap-2">
          <NotebookPenIcon className="size-4" />
          <h1 className="text-sm font-semibold tracking-tight">AI Notes</h1>
        </div>
        <div className="flex items-center gap-1">
          <ThemeToggle />
          <Button
            variant={chatOpen ? "secondary" : "ghost"}
            size="sm"
            onClick={() => setChatOpen((open) => !open)}
            aria-label="Toggle assistant"
          >
            <SparklesIcon />
            Assistant
          </Button>
        </div>
      </header>
      <div className="flex min-h-0 flex-1">
        {mounted ? (
          <>
            <NoteList />
            <NoteEditor />
            <ChatPanel open={chatOpen} onClose={() => setChatOpen(false)} />
          </>
        ) : (
          <AppSkeleton />
        )}
      </div>
    </div>
  );
}

function AppSkeleton() {
  return (
    <>
      <div className="flex w-72 shrink-0 flex-col gap-2 border-r p-3 lg:w-80">
        <Skeleton className="h-8 w-full" />
        <div className="flex gap-1">
          <Skeleton className="h-5 w-14" />
          <Skeleton className="h-5 w-12" />
          <Skeleton className="h-5 w-16" />
        </div>
        {Array.from({ length: 5 }, (_, index) => (
          <Skeleton key={index} className="h-20 w-full" />
        ))}
      </div>
      <div className="flex min-w-0 flex-1 flex-col gap-3 p-6">
        <Skeleton className="h-7 w-64" />
        <Skeleton className="h-4 w-40" />
        <Skeleton className="mt-3 h-4 w-full max-w-xl" />
        <Skeleton className="h-4 w-full max-w-lg" />
        <Skeleton className="h-4 w-full max-w-md" />
      </div>
      <div className="hidden w-[24rem] shrink-0 border-l p-4 md:block">
        <Skeleton className="h-8 w-full" />
      </div>
    </>
  );
}
