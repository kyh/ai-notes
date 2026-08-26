"use client";

import { z } from "zod";
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

import { noteSchema, type Note } from "@/lib/note-schema";
import { createSeedNotes } from "@/lib/seed-notes";

/** Fields the UI and the AI are allowed to change on an existing note. */
export type NotePatch = Partial<Pick<Note, "title" | "content" | "tags">>;

export type NotesState = {
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
};

/**
 * localStorage boundary: every persisted note is zod-parsed on read and any
 * malformed entry is dropped, so corrupt/tampered storage can't crash
 * downstream consumers.
 */
const persistedStateSchema = z.object({
  notes: z.array(z.unknown()).transform((notes) =>
    notes.flatMap((note) => {
      const parsed = noteSchema.safeParse(note);
      return parsed.success ? [parsed.data] : [];
    }),
  ),
  activeNoteId: z.string().nullable().optional(),
  seeded: z.boolean().optional(),
});

export const useNotesStore = create<NotesState>()(
  persist(
    (set) => ({
      notes: [],
      activeNoteId: null,
      seeded: false,

      createNote: (partial) => {
        const now = new Date().toISOString();
        const note: Note = {
          id: crypto.randomUUID(),
          title: partial?.title ?? "Untitled",
          content: partial?.content ?? "",
          tags: partial?.tags ?? [],
          createdAt: now,
          updatedAt: now,
        };
        set((state) => ({
          notes: [note, ...state.notes],
          activeNoteId: note.id,
        }));
        return note;
      },

      insertNote: (note) => {
        set((state) => ({
          notes: [note, ...state.notes.filter((n) => n.id !== note.id)],
          activeNoteId: note.id,
        }));
      },

      updateNote: (id, patch) => {
        set((state) => ({
          notes: state.notes.map((note) =>
            note.id === id ? { ...note, ...patch, updatedAt: new Date().toISOString() } : note,
          ),
        }));
      },

      deleteNote: (id) => {
        set((state) => ({
          notes: state.notes.filter((note) => note.id !== id),
          activeNoteId: state.activeNoteId === id ? null : state.activeNoteId,
        }));
      },

      setActiveNote: (id) => set({ activeNoteId: id }),

      seed: () =>
        set((state) => {
          const notes = [
            ...state.notes,
            ...createSeedNotes().filter((seed) => !state.notes.some((n) => n.id === seed.id)),
          ];
          return {
            notes,
            activeNoteId: state.activeNoteId ?? notes[0]?.id ?? null,
            seeded: true,
          };
        }),
    }),
    {
      name: "ai-notes",
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        notes: state.notes,
        activeNoteId: state.activeNoteId,
        seeded: state.seeded,
      }),
      merge: (persisted, current) => {
        const parsed = persistedStateSchema.safeParse(persisted);
        if (!parsed.success) return current;
        return {
          ...current,
          notes: parsed.data.notes,
          activeNoteId: parsed.data.activeNoteId ?? null,
          seeded: parsed.data.seeded ?? false,
        };
      },
      onRehydrateStorage: () => (state, error) => {
        if (error || !state) return;
        if (!state.seeded) state.seed();
      },
    },
  ),
);
