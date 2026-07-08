import { z } from "zod";

/**
 * Dynamic app state the client ships with every request. The server is
 * stateless — this is how the agent sees the user's notes.
 *
 * `content` is present only for the active note; other notes are
 * represented by a ~200 char snippet.
 */
export const notesContextSchema = z.object({
  /** Current datetime, ISO 8601 with UTC instant. */
  now: z.string(),
  /** IANA timezone, e.g. "America/Los_Angeles". */
  timeZone: z.string(),
  activeNoteId: z.string().nullable(),
  notes: z.array(
    z.object({
      id: z.string(),
      title: z.string(),
      tags: z.array(z.string()),
      updatedAt: z.string(),
      snippet: z.string(),
      content: z.string().optional(),
    }),
  ),
});

export type NotesContext = z.infer<typeof notesContextSchema>;
