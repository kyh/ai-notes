import type { UIMessage, UIMessageStreamWriter } from "ai";
import type { z } from "zod";

import type {
  createNoteInputSchema,
  DataPart,
  deleteNoteInputSchema,
  updateNoteInputSchema,
} from "./data-parts";
import type { Metadata } from "./metadata";

/**
 * Typed tool set so the transcript UI can narrow `tool-*` message parts
 * (e.g. render "Created note" chips with typed `input`).
 */
export type NotesTools = {
  createNote: {
    input: z.infer<typeof createNoteInputSchema>;
    output: string;
  };
  updateNote: {
    input: z.infer<typeof updateNoteInputSchema>;
    output: string;
  };
  deleteNote: {
    input: z.infer<typeof deleteNoteInputSchema>;
    output: string;
  };
};

export type NotesChatUIMessage = UIMessage<Metadata, DataPart, NotesTools>;

/** Typed writer for streaming data parts to the UI. */
export type NotesStreamWriter = UIMessageStreamWriter<NotesChatUIMessage>;
