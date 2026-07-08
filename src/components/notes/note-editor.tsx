"use client";

import * as React from "react";
import { formatDistanceToNow } from "date-fns";
import { FileTextIcon, Trash2Icon, XIcon } from "lucide-react";
import { toast } from "sonner";

import { MarkdownPreview } from "@/components/notes/markdown-preview";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { useNotesStore } from "@/lib/notes-store";

export function NoteEditor() {
  const notes = useNotesStore((state) => state.notes);
  const activeNoteId = useNotesStore((state) => state.activeNoteId);
  const updateNote = useNotesStore((state) => state.updateNote);
  const deleteNote = useNotesStore((state) => state.deleteNote);
  const createNote = useNotesStore((state) => state.createNote);

  const [tab, setTab] = React.useState<"edit" | "preview">("edit");
  const [confirmDelete, setConfirmDelete] = React.useState(false);
  const [tagInput, setTagInput] = React.useState("");

  const activeNote = notes.find((note) => note.id === activeNoteId);

  if (!activeNote) {
    return (
      <div className="flex min-w-0 flex-1 items-center justify-center">
        <Empty>
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <FileTextIcon />
            </EmptyMedia>
            <EmptyTitle>No note selected</EmptyTitle>
            <EmptyDescription>Pick a note from the list, or start a fresh one.</EmptyDescription>
          </EmptyHeader>
          <Button size="sm" onClick={() => createNote()}>
            New note
          </Button>
        </Empty>
      </div>
    );
  }

  const addTag = () => {
    const tag = tagInput.trim().toLowerCase();
    setTagInput("");
    if (!tag || activeNote.tags.includes(tag)) return;
    updateNote(activeNote.id, { tags: [...activeNote.tags, tag] });
  };

  const removeTag = (tag: string) => {
    updateNote(activeNote.id, {
      tags: activeNote.tags.filter((t) => t !== tag),
    });
  };

  return (
    <div className="flex min-w-0 flex-1 flex-col">
      <div className="flex shrink-0 flex-col gap-2 border-b px-6 pt-4 pb-3">
        <div className="flex items-center gap-2">
          <input
            value={activeNote.title}
            onChange={(e) => updateNote(activeNote.id, { title: e.target.value })}
            placeholder="Untitled"
            aria-label="Note title"
            className="min-w-0 flex-1 bg-transparent text-lg font-semibold tracking-tight outline-none placeholder:text-muted-foreground"
          />
          <Tabs
            value={tab}
            onValueChange={(value) => setTab(value === "preview" ? "preview" : "edit")}
          >
            <TabsList>
              <TabsTrigger value="edit">Edit</TabsTrigger>
              <TabsTrigger value="preview">Preview</TabsTrigger>
            </TabsList>
          </Tabs>
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={() => setConfirmDelete(true)}
            aria-label="Delete note"
          >
            <Trash2Icon />
          </Button>
        </div>

        <div className="flex flex-wrap items-center gap-1.5">
          <span className="text-xs text-muted-foreground">
            Updated{" "}
            {formatDistanceToNow(new Date(activeNote.updatedAt), {
              addSuffix: true,
            })}
          </span>
          <span className="text-xs text-muted-foreground">·</span>
          {activeNote.tags.map((tag) => (
            <Badge key={tag} variant="secondary" className="gap-1 pr-1">
              {tag}
              <button
                type="button"
                onClick={() => removeTag(tag)}
                aria-label={`Remove tag ${tag}`}
                className="rounded-sm opacity-60 transition-opacity hover:opacity-100"
              >
                <XIcon className="size-3" />
              </button>
            </Badge>
          ))}
          <input
            value={tagInput}
            onChange={(e) => setTagInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                addTag();
              }
            }}
            onBlur={addTag}
            placeholder="+ tag"
            aria-label="Add tag"
            className="w-16 bg-transparent text-xs text-muted-foreground outline-none placeholder:text-muted-foreground/70"
          />
        </div>
      </div>

      {tab === "edit" ? (
        <Textarea
          value={activeNote.content}
          onChange={(e) => updateNote(activeNote.id, { content: e.target.value })}
          placeholder="Write in markdown…"
          aria-label="Note content"
          className="min-h-0 flex-1 resize-none rounded-none border-none p-6 font-mono text-sm leading-relaxed shadow-none focus-visible:ring-0 dark:bg-transparent"
        />
      ) : (
        <ScrollArea className="min-h-0 flex-1">
          <MarkdownPreview content={activeNote.content} className="mx-auto max-w-2xl p-6" />
        </ScrollArea>
      )}

      <Dialog open={confirmDelete} onOpenChange={setConfirmDelete}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete note?</DialogTitle>
            <DialogDescription>
              “{activeNote.title || "Untitled"}” will be permanently deleted. This cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setConfirmDelete(false)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={() => {
                deleteNote(activeNote.id);
                setConfirmDelete(false);
                toast.success(`Deleted "${activeNote.title || "Untitled"}"`);
              }}
            >
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
