"use client";

import * as React from "react";
import { formatDistanceToNow } from "date-fns";
import { PlusIcon, SearchIcon } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Empty, EmptyDescription, EmptyHeader, EmptyTitle } from "@/components/ui/empty";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import { useNotesStore } from "@/stores/notes-store";

/** Cheap markdown → plain text for list snippets. */
const noteSnippet = (content: string) =>
  content
    .split("\n")
    .map((line) =>
      line
        .replace(/^#{1,6}\s+/, "")
        .replace(/^[-*]\s+(\[[ xX]\]\s+)?/, "")
        .replace(/^\d+[.)]\s+/, "")
        .replace(/^>\s?/, "")
        .replace(/(\*\*|\*|`)/g, ""),
    )
    .filter((line) => line.trim() !== "" && !/^-{3,}$/.test(line.trim()))
    .join(" ")
    .slice(0, 160);

export function NoteList() {
  const notes = useNotesStore((state) => state.notes);
  const activeNoteId = useNotesStore((state) => state.activeNoteId);
  const setActiveNote = useNotesStore((state) => state.setActiveNote);
  const createNote = useNotesStore((state) => state.createNote);

  const [query, setQuery] = React.useState("");
  const [tagFilter, setTagFilter] = React.useState<string | null>(null);

  const allTags = React.useMemo(
    () => [...new Set(notes.flatMap((note) => note.tags))].sort(),
    [notes],
  );

  const visibleNotes = React.useMemo(() => {
    const q = query.trim().toLowerCase();
    return [...notes]
      .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
      .filter((note) => tagFilter === null || note.tags.includes(tagFilter))
      .filter(
        (note) =>
          q === "" ||
          note.title.toLowerCase().includes(q) ||
          note.content.toLowerCase().includes(q),
      );
  }, [notes, query, tagFilter]);

  return (
    <div className="flex w-72 shrink-0 flex-col border-r lg:w-80">
      <div className="flex shrink-0 items-center gap-2 p-3 pb-2">
        <div className="relative flex-1">
          <SearchIcon className="pointer-events-none absolute top-1/2 left-2.5 size-3.5 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search notes…"
            className="h-8 pl-8 text-sm"
          />
        </div>
        <Tooltip>
          <TooltipTrigger
            render={
              <Button
                variant="outline"
                size="icon-sm"
                onClick={() => createNote()}
                aria-label="New note"
              />
            }
          >
            <PlusIcon />
          </TooltipTrigger>
          <TooltipContent>New note</TooltipContent>
        </Tooltip>
      </div>

      {allTags.length > 0 && (
        <div className="flex shrink-0 flex-wrap gap-1 px-3 pb-2">
          {allTags.map((tag) => (
            <Badge
              key={tag}
              variant={tagFilter === tag ? "default" : "outline"}
              className="cursor-pointer select-none"
              render={<button type="button" />}
              onClick={() => setTagFilter(tagFilter === tag ? null : tag)}
            >
              {tag}
            </Badge>
          ))}
        </div>
      )}

      <ScrollArea className="min-h-0 flex-1">
        <div className="flex flex-col gap-0.5 p-2">
          {visibleNotes.length === 0 ? (
            <Empty className="py-10">
              <EmptyHeader>
                <EmptyTitle className="text-sm">No notes found</EmptyTitle>
                <EmptyDescription>
                  {notes.length === 0
                    ? "Create your first note to get started."
                    : "Try a different search or tag filter."}
                </EmptyDescription>
              </EmptyHeader>
            </Empty>
          ) : (
            visibleNotes.map((note) => (
              <button
                key={note.id}
                type="button"
                onClick={() => setActiveNote(note.id)}
                className={cn(
                  "flex w-full flex-col gap-1 rounded-md p-2.5 text-left transition-colors",
                  note.id === activeNoteId ? "bg-muted" : "hover:bg-muted/60",
                )}
              >
                <div className="flex items-baseline justify-between gap-2">
                  <span className="truncate text-sm font-medium">{note.title || "Untitled"}</span>
                  <span className="shrink-0 text-[11px] text-muted-foreground">
                    {formatDistanceToNow(new Date(note.updatedAt), {
                      addSuffix: true,
                    })}
                  </span>
                </div>
                <span className="line-clamp-2 text-xs text-muted-foreground">
                  {noteSnippet(note.content) || "Empty note"}
                </span>
                {note.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1 pt-0.5">
                    {note.tags.slice(0, 3).map((tag) => (
                      <Badge key={tag} variant="secondary" className="px-1.5 py-0 text-[10px]">
                        {tag}
                      </Badge>
                    ))}
                    {note.tags.length > 3 && (
                      <span className="text-[10px] text-muted-foreground">
                        +{note.tags.length - 3}
                      </span>
                    )}
                  </div>
                )}
              </button>
            ))
          )}
        </div>
      </ScrollArea>
    </div>
  );
}
