import type { MessageStreamEvent } from "eve/client";

import {
  createNotePayloadSchema,
  deleteNotePayloadSchema,
  updateNotePayloadSchema,
} from "@/lib/assistant-schemas";
import type { Note } from "@/lib/note-schema";
import type { NotePatch, NotesState } from "@/lib/notes-store";

/**
 * A child session's events arrive unstamped (no `meta`) inside
 * `subagent.event`; eve only exports the stamped union, so derive it.
 */
export type AgentStreamEvent = Extract<
  MessageStreamEvent,
  { type: "subagent.event" }
>["data"]["event"];

/**
 * What one streamed event asks the store to do. Keeping the decision separate
 * from the mutation is what makes it testable without React, a DOM, or a live
 * agent stream.
 */
export type BridgeOutcome =
  | { kind: "none" }
  | { kind: "insert"; note: Note; message: string }
  | { kind: "update"; id: string; patch: NotePatch; message: string }
  | { kind: "delete"; id: string; message: string }
  | { kind: "error"; message: string };

const NONE: BridgeOutcome = { kind: "none" };

/**
 * Translate one eve stream event into a store mutation.
 *
 * eve streams every tool result as an `action.result` event whose
 * `data.result` is `{ kind: "tool-result", toolName, output, isError? }`,
 * where `output` is the tool's full `execute` return value. Events arrive
 * already typed (eve parses its own transport); each JSON `output` payload
 * is zod-parsed against the shared schemas before it can reach the store.
 *
 * `notes` is the current store contents, needed to resolve titles for the
 * toast copy and to notice a target note that no longer exists.
 */
export const resolveToolResult = (
  event: AgentStreamEvent,
  notes: readonly Note[],
): BridgeOutcome => {
  // Delegation is forbidden by the instructions, but if the model strays,
  // unwrap the child's events so its tool results still reach the store.
  if (event.type === "subagent.event") return resolveToolResult(event.data.event, notes);
  if (event.type !== "action.result") return NONE;

  const { status, result } = event.data;
  if (status !== "completed" || result.kind !== "tool-result" || result.isError === true) {
    return NONE;
  }

  switch (result.toolName) {
    case "create_note": {
      const payload = createNotePayloadSchema.safeParse(result.output);
      if (!payload.success) return NONE;
      const { note } = payload.data;
      return { kind: "insert", note, message: `Created "${note.title}"` };
    }
    case "update_note": {
      const payload = updateNotePayloadSchema.safeParse(result.output);
      if (!payload.success) return NONE;
      const { id, title, content, tags } = payload.data;
      const note = notes.find((n) => n.id === id);
      if (!note) {
        return {
          kind: "error",
          message: "The assistant tried to update a note that no longer exists",
        };
      }
      const patch: NotePatch = {};
      if (title !== undefined) patch.title = title;
      if (content !== undefined) patch.content = content;
      if (tags !== undefined) patch.tags = tags;
      return { kind: "update", id, patch, message: `Updated "${patch.title ?? note.title}"` };
    }
    case "delete_note": {
      const payload = deleteNotePayloadSchema.safeParse(result.output);
      if (!payload.success) return NONE;
      const note = notes.find((n) => n.id === payload.data.id);
      if (!note) return NONE;
      return { kind: "delete", id: note.id, message: `Deleted "${note.title}"` };
    }
    default:
      return NONE;
  }
};

/** The store surface the bridge reads and writes. */
export type NotesWriter = Pick<NotesState, "notes" | "insertNote" | "updateNote" | "deleteNote">;

export interface Notification {
  tone: "success" | "error";
  message: string;
}

/**
 * Apply one streamed event to the notes store, returning the toast the caller
 * should raise — `null` when the event asked for nothing.
 *
 * Callers must hand in a freshly read store snapshot per event: a create
 * followed by an update in the same stream only resolves if the second event
 * sees the first one's note.
 */
export const applyStreamEvent = (
  event: AgentStreamEvent,
  store: NotesWriter,
): Notification | null => {
  const outcome = resolveToolResult(event, store.notes);
  switch (outcome.kind) {
    case "insert":
      store.insertNote(outcome.note);
      return { tone: "success", message: outcome.message };
    case "update":
      store.updateNote(outcome.id, outcome.patch);
      return { tone: "success", message: outcome.message };
    case "delete":
      store.deleteNote(outcome.id);
      return { tone: "success", message: outcome.message };
    case "error":
      return { tone: "error", message: outcome.message };
    case "none":
      return null;
  }
};
