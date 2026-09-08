"use client";

import { z } from "zod";
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

import { noteSchema } from "@/lib/note-schema";
import type { Note } from "@/lib/note-schema";
import { createSeedNotes } from "@/lib/seed-notes";

/** Fields the UI and the AI are allowed to change on an existing note. */
export type NotePatch = Partial<Pick<Note, "title" | "content" | "tags">>;

export interface NotesState {
  notes: Note[];
  activeNoteId: string | null;
  /** Whether the one-time seed has run — prevents seeds resurrecting after a full clear. */
  seeded: boolean;
  /** Create a note locally (manual "new note" button). Returns the new note. */
  createNote: (partial?: NotePatch) => Note;
  /** Insert a fully-formed note (AI `createNote` tool — id comes from the server). */
  insertNote: (note: Note) => void;
  /** Patch a note and bump `updatedAt`. No-op when the id is unknown. */
  updateNote: (id: string, patch: NotePatch) => void;
  deleteNote: (id: string) => void;
  setActiveNote: (id: string | null) => void;
  seed: () => void;
}

/**
 * localStorage boundary: every persisted note is zod-parsed on read and any
 * malformed entry is dropped, so corrupt/tampered storage can't crash
 * downstream consumers.
 */
const persistedStateSchema = z.object({
  activeNoteId: z.string().nullable().optional(),
  notes: z.array(z.unknown()).transform((notes) =>
    notes.flatMap((note) => {
      const parsed = noteSchema.safeParse(note);
      return parsed.success ? [parsed.data] : [];
    }),
  ),
  seeded: z.boolean().optional(),
});

export const useNotesStore = create<NotesState>()(
  persist(
    (set) => ({
      activeNoteId: null,
      createNote: (partial) => {
        const now = new Date().toISOString();
        const note: Note = {
          content: partial?.content ?? "",
          createdAt: now,
          id: crypto.randomUUID(),
          tags: partial?.tags ?? [],
          title: partial?.title ?? "Untitled",
          updatedAt: now,
        };
        set((state) => ({
          activeNoteId: note.id,
          notes: [note, ...state.notes],
        }));
        return note;
      },
      deleteNote: (id) => {
        set((state) => ({
          activeNoteId: state.activeNoteId === id ? null : state.activeNoteId,
          notes: state.notes.filter((note) => note.id !== id),
        }));
      },
      insertNote: (note) => {
        set((state) => ({
          activeNoteId: note.id,
          notes: [note, ...state.notes.filter((n) => n.id !== note.id)],
        }));
      },
      notes: [],
      seed: () =>
        set((state) => {
          const notes = [
            ...state.notes,
            ...createSeedNotes().filter((seed) => !state.notes.some((n) => n.id === seed.id)),
          ];
          return {
            activeNoteId: state.activeNoteId ?? notes[0]?.id ?? null,
            notes,
            seeded: true,
          };
        }),
      seeded: false,
      setActiveNote: (id) => set({ activeNoteId: id }),
      updateNote: (id, patch) => {
        set((state) => ({
          notes: state.notes.map((note) =>
            note.id === id ? { ...note, ...patch, updatedAt: new Date().toISOString() } : note,
          ),
        }));
      },
    }),
    {
      merge: (persisted, current) => {
        const parsed = persistedStateSchema.safeParse(persisted);
        if (!parsed.success) {
          return current;
        }
        return {
          ...current,
          activeNoteId: parsed.data.activeNoteId ?? null,
          notes: parsed.data.notes,
          seeded: parsed.data.seeded ?? false,
        };
      },
      name: "ai-notes",
      onRehydrateStorage: () => (state, error) => {
        if (error || !state) {
          return;
        }
        if (!state.seeded) {
          state.seed();
        }
      },
      partialize: (state) => ({
        activeNoteId: state.activeNoteId,
        notes: state.notes,
        seeded: state.seeded,
      }),
      storage: createJSONStorage(() => localStorage),
    },
  ),
);
