import { z } from "zod";
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

import { noteSchema, type Note } from "@/lib/note-schema";
import { createSeedNotes } from "@/lib/seed-notes";

/** Fields the UI and the AI are allowed to change on an existing note. */
export type NotePatch = Partial<Pick<Note, "title" | "content" | "tags">>;

type NotesState = {
  notes: Note[];
  activeNoteId: string | null;
  /** Create a note locally (manual "new note" button). Returns the new note. */
  createNote: (partial?: NotePatch) => Note;
  /** Insert a fully-formed note (AI `createNote` tool — id comes from the server). */
  insertNote: (note: Note) => void;
  /** Patch a note and bump `updatedAt`. No-op when the id is unknown. */
  updateNote: (id: string, patch: NotePatch) => void;
  deleteNote: (id: string) => void;
  setActiveNote: (id: string | null) => void;
};

/** Zod boundary for what we read back from localStorage. */
const persistedStateSchema = z.object({
  notes: z.array(noteSchema),
  activeNoteId: z.string().nullable(),
});

const seedNotes = createSeedNotes();

export const useNotesStore = create<NotesState>()(
  persist(
    (set) => ({
      notes: seedNotes,
      activeNoteId: seedNotes[0]?.id ?? null,

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
    }),
    {
      name: "ai-notes",
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        notes: state.notes,
        activeNoteId: state.activeNoteId,
      }),
      merge: (persisted, current) => {
        const parsed = persistedStateSchema.safeParse(persisted);
        return parsed.success ? { ...current, ...parsed.data } : current;
      },
    },
  ),
);
