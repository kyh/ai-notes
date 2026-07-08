import { defineTool } from "eve/tools";

// Relative import: agent/ is compiled by eve, which resolves plain relative
// paths but not tsconfig `@/*` aliases. Domain schemas stay in src/lib.
import { createNoteInputSchema, createNotePayloadSchema } from "../../src/lib/assistant-schemas";

export default defineTool({
  description:
    "Create a new note. Provide a title, the full markdown content, and a list of lowercase tags. The note is created immediately and becomes the user's active note.",
  inputSchema: createNoteInputSchema,
  outputSchema: createNotePayloadSchema,
  execute: (input) => {
    const now = new Date().toISOString();
    return {
      note: {
        id: crypto.randomUUID(),
        title: input.title,
        content: input.content,
        tags: input.tags,
        createdAt: now,
        updatedAt: now,
      },
    };
  },
  // The client applies the full note from `action.result`; the model only
  // needs a short ack (with the id so it can reference the note later).
  toModelOutput: (output) => ({
    type: "text",
    value: `Successfully created note "${output.note.title}" with ID ${output.note.id}.`,
  }),
});
