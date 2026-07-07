import { z } from "zod";

import { noteSchema } from "@/lib/note-schema";

// -----------------------------------------------------------------------------
// Tool input schemas (what the model produces)
// -----------------------------------------------------------------------------

export const createNoteInputSchema = z.object({
  title: z.string().describe("Title of the note"),
  content: z.string().describe("Markdown body of the note"),
  tags: z.array(z.string()).describe("Lowercase, single-word tags (e.g. 'work', 'ideas')"),
});

export const updateNoteInputSchema = z.object({
  id: z.string().describe("Id of the note to update"),
  title: z.string().optional().describe("New title, if changing it"),
  content: z.string().optional().describe("Full replacement markdown body, if changing it"),
  tags: z.array(z.string()).optional().describe("Full replacement tag list, if changing it"),
});

export const deleteNoteInputSchema = z.object({
  id: z.string().describe("Id of the note to delete"),
});

// -----------------------------------------------------------------------------
// Data part payload schemas (what the server streams to the client).
// The client zod-parses every payload in `onData` before touching the store.
// -----------------------------------------------------------------------------

export const createNoteDataSchema = z.object({ note: noteSchema });
export const updateNoteDataSchema = updateNoteInputSchema;
export const deleteNoteDataSchema = deleteNoteInputSchema;

/**
 * The client<->server streaming contract. Keys map to wire types with a
 * `data-` prefix (`writer.write({ type: "data-create-note", ... })`).
 */
export type DataPart = {
  "create-note": z.infer<typeof createNoteDataSchema>;
  "update-note": z.infer<typeof updateNoteDataSchema>;
  "delete-note": z.infer<typeof deleteNoteDataSchema>;
};
