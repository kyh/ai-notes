import { z } from "zod";

// Relative (not `@/`) so eve's compiler can bundle this module for agent
// tools — eve does not read tsconfig path aliases.
import { noteSchema } from "./note-schema";

// -----------------------------------------------------------------------------
// The client<->agent contract, shared by both sides:
// - `agent/tools/*.ts` use the input schemas as `inputSchema` and the payload
//   schemas as `outputSchema` (what `execute` returns).
// - The chat panel zod-parses every `action.result` tool output against the
//   payload schemas before touching the zustand store.
// Note: agent/ lives outside src/, so tools import this file relatively
// (`../../src/lib/assistant-schemas`) — eve's compiler does not read
// tsconfig path aliases.
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

/** `create_note` tool output: the fully-formed note (id + timestamps are server-generated). */
export const createNotePayloadSchema = z.object({ note: noteSchema });
/** `update_note` tool output: the applied patch, echoed back. */
export const updateNotePayloadSchema = updateNoteInputSchema;
/** `delete_note` tool output: the deleted note's id, echoed back. */
export const deleteNotePayloadSchema = deleteNoteInputSchema;
