import { defineTool } from "eve/tools";

import { deleteNoteInputSchema, deleteNotePayloadSchema } from "../../src/lib/assistant-schemas";

export default defineTool({
  description:
    "Delete a note by id. Use the exact id from the notes context. Only call this when the user explicitly asks to delete or remove a note.",
  inputSchema: deleteNoteInputSchema,
  outputSchema: deleteNotePayloadSchema,
  // Stateless: the client owns the notes and no-ops on unknown ids.
  execute: (input) => input,
  toModelOutput: (output) => ({
    type: "text",
    value: `Successfully deleted note ${output.id}.`,
  }),
});
