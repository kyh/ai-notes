import { convertToModelMessages, createUIMessageStream, createUIMessageStreamResponse } from "ai";

import { createNotesAgent } from "../agents/notes-agent";
import type { NotesContext } from "../messages/notes-context";
import type { NotesChatUIMessage } from "../messages/types";

/**
 * Streams a chat response: runs the notes ToolLoopAgent and merges its
 * UI-message stream (text + tool + data parts) into one response.
 */
export function streamChatResponse(
  messages: NotesChatUIMessage[],
  apiKey: string,
  notesContext: NotesContext,
) {
  return createUIMessageStreamResponse({
    stream: createUIMessageStream<NotesChatUIMessage>({
      originalMessages: messages,
      execute: async ({ writer }) => {
        const agent = createNotesAgent({ apiKey, writer, notesContext });
        const result = await agent.stream({
          prompt: await convertToModelMessages(messages),
        });

        void result.consumeStream();
        writer.merge(result.toUIMessageStream({ sendReasoning: true }));
      },
    }),
  });
}
