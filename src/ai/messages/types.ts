import type { UIMessage, UIMessageStreamWriter } from "ai";
import type { z } from "zod";

import type {
  createNoteInputSchema,
  DataPart,
  deleteNoteInputSchema,
  updateNoteInputSchema,
} from "@/ai/messages/data-parts";

/**
 * UI tool typings for the agent's tool set — lets the chat transcript
 * narrow `tool-*` message parts without casts.
 */
export type ChatTools = {
  createNote: { input: z.infer<typeof createNoteInputSchema>; output: string };
  updateNote: { input: z.infer<typeof updateNoteInputSchema>; output: string };
  deleteNote: { input: z.infer<typeof deleteNoteInputSchema>; output: string };
};

export type ChatUIMessage = UIMessage<unknown, DataPart, ChatTools>;

export type ChatStreamWriter = UIMessageStreamWriter<ChatUIMessage>;
