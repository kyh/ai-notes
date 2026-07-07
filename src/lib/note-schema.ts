import { z } from "zod";

/**
 * The core domain object. Notes are markdown documents with tags,
 * persisted to localStorage and mirrored to the AI as context.
 */
export const noteSchema = z.object({
  id: z.string(),
  title: z.string(),
  /** Markdown body */
  content: z.string(),
  tags: z.array(z.string()),
  /** ISO 8601 */
  createdAt: z.string(),
  /** ISO 8601 */
  updatedAt: z.string(),
});

export type Note = z.infer<typeof noteSchema>;
