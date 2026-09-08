import { z } from "zod";

/**
 * Dynamic app state the client ships with every request. The server is
 * stateless — this is how the agent sees the user's notes.
 *
 * `content` is present only for the active note; other notes are
 * represented by a ~200 char snippet.
 */
export const notesContextSchema = z.object({
  activeNoteId: z.string().nullable(),
  notes: z.array(
    z.object({
      content: z.string().optional(),
      id: z.string(),
      snippet: z.string(),
      tags: z.array(z.string()),
      title: z.string(),
      updatedAt: z.string(),
    }),
  ),
  /** Current datetime, ISO 8601 with UTC instant. */
  now: z.string(),
  /** IANA timezone, e.g. "America/Los_Angeles". */
  timeZone: z.string(),
});

export type NotesContext = z.infer<typeof notesContextSchema>;
