import { stepCountIs, tool, ToolLoopAgent } from "ai";

import type { Note } from "@/lib/note-schema";
import { createModel } from "../gateway";
import {
  createNoteInputSchema,
  deleteNoteInputSchema,
  updateNoteInputSchema,
} from "../messages/data-parts";
import type { NotesContext } from "../messages/notes-context";
import type { NotesStreamWriter } from "../messages/types";
import notesPrompt from "./notes-agent-prompt";

type WriterParams = {
  writer: NotesStreamWriter;
};

type WriterWithContextParams = WriterParams & {
  notesContext: NotesContext;
};

type CreateNotesAgentParams = WriterParams & {
  apiKey: string;
  notesContext: NotesContext;
};

// -----------------------------------------------------------------------------
// Tools — each tool writes a data part the client applies to its store,
// then returns a text ack for the model.
// -----------------------------------------------------------------------------

const createCreateNoteTool = ({ writer }: WriterParams) =>
  tool({
    description:
      "Create a new note. Provide a title, the full markdown content, and a list of lowercase tags. The note is created immediately and becomes the user's active note.",
    inputSchema: createNoteInputSchema,
    execute: async (input, { toolCallId }) => {
      const now = new Date().toISOString();
      const note: Note = {
        id: crypto.randomUUID(),
        title: input.title,
        content: input.content,
        tags: input.tags,
        createdAt: now,
        updatedAt: now,
      };
      writer.write({
        id: toolCallId,
        type: "data-create-note",
        data: { note },
      });
      return `Successfully created note "${note.title}" with ID ${note.id}.`;
    },
  });

const createUpdateNoteTool = ({ writer, notesContext }: WriterWithContextParams) =>
  tool({
    description:
      "Update an existing note by id. Only include the fields you are changing. `content` and `tags` replace the previous values wholesale, so always pass the complete new markdown body / tag list.",
    inputSchema: updateNoteInputSchema,
    execute: async (input, { toolCallId }) => {
      if (!notesContext.notes.some((note) => note.id === input.id)) {
        return `No note with id "${input.id}" exists.`;
      }
      writer.write({
        id: toolCallId,
        type: "data-update-note",
        data: input,
      });
      const changed = [
        input.title !== undefined ? "title" : null,
        input.content !== undefined ? "content" : null,
        input.tags !== undefined ? "tags" : null,
      ]
        .filter((field) => field !== null)
        .join(", ");
      return `Successfully updated ${changed || "nothing"} on note ${input.id}.`;
    },
  });

const createDeleteNoteTool = ({ writer, notesContext }: WriterWithContextParams) =>
  tool({
    description:
      "Delete a note by id. Only call this when the user explicitly asks to delete or remove a note.",
    inputSchema: deleteNoteInputSchema,
    execute: async (input, { toolCallId }) => {
      if (!notesContext.notes.some((note) => note.id === input.id)) {
        return `No note with id "${input.id}" exists.`;
      }
      writer.write({
        id: toolCallId,
        type: "data-delete-note",
        data: input,
      });
      return `Successfully deleted note ${input.id}.`;
    },
  });

// -----------------------------------------------------------------------------
// Context → instructions
// -----------------------------------------------------------------------------

const buildInstructions = (notesContext: NotesContext): string => {
  const noteLines = notesContext.notes
    .map((note) => {
      const active = note.id === notesContext.activeNoteId;
      const tags = note.tags.length > 0 ? note.tags.join(", ") : "none";
      const lines = [
        `- id: "${note.id}"${active ? " (ACTIVE)" : ""}`,
        `  title: ${note.title}`,
        `  tags: ${tags}`,
        `  updated: ${note.updatedAt}`,
      ];
      if (active && note.content !== undefined) {
        lines.push(`  full content:\n"""\n${note.content}\n"""`);
      } else {
        lines.push(`  snippet: ${JSON.stringify(note.snippet)}`);
      }
      return lines.join("\n");
    })
    .join("\n");

  return [
    notesPrompt,
    `## Current state

Current datetime: ${notesContext.currentDatetime}
Active note id: ${notesContext.activeNoteId ?? "none"}

The user's notes (${notesContext.notes.length}):
${noteLines.length > 0 ? noteLines : "(no notes yet)"}`,
  ].join("\n\n");
};

/** Notes assistant: a single ToolLoopAgent with create/update/delete tools. */
export function createNotesAgent({ apiKey, writer, notesContext }: CreateNotesAgentParams) {
  return new ToolLoopAgent({
    model: createModel(apiKey),
    instructions: buildInstructions(notesContext),
    tools: {
      createNote: createCreateNoteTool({ writer }),
      updateNote: createUpdateNoteTool({ writer, notesContext }),
      deleteNote: createDeleteNoteTool({ writer, notesContext }),
    },
    toolChoice: "auto",
    stopWhen: stepCountIs(5),
  });
}
