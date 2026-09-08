import { z } from "zod";

/**
 * The core domain object. Notes are markdown documents with tags,
 * persisted to localStorage and mirrored to the AI as context.
 */
export const noteSchema = z.object({
  /** Markdown body */
  content: z.string(),
  /** ISO 8601 */
  createdAt: z.string(),
  id: z.string(),
  tags: z.array(z.string()),
  title: z.string(),
  /** ISO 8601 */
  updatedAt: z.string(),
});

export type Note = z.infer<typeof noteSchema>;
