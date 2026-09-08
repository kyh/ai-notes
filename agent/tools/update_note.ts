import { defineTool } from "eve/tools";

import { updateNoteInputSchema, updateNotePayloadSchema } from "../../src/lib/assistant-schemas";

export default defineTool({
  description:
    "Update an existing note by id. Use the exact id from the notes context. Only include the fields you are changing. `content` and `tags` replace the previous values wholesale, so always pass the complete new markdown body / tag list.",
  // The tool is stateless: the client owns the notes and validates the id
  // when it applies the patch (unknown ids surface as an error toast there).
  execute: (input) => input,
  inputSchema: updateNoteInputSchema,
  outputSchema: updateNotePayloadSchema,
  toModelOutput: (output) => {
    const changed = [
      output.title === undefined ? null : "title",
      output.content === undefined ? null : "content",
      output.tags === undefined ? null : "tags",
    ]
      .filter((field) => field !== null)
      .join(", ");
    return {
      type: "text",
      value: `Successfully updated ${changed || "nothing"} on note ${output.id}.`,
    };
  },
});
