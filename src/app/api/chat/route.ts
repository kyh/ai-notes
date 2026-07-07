import { validateUIMessages } from "ai";
import { z } from "zod";

import {
  createNoteDataSchema,
  deleteNoteDataSchema,
  updateNoteDataSchema,
} from "@/ai/messages/data-parts";
import { notesContextSchema } from "@/ai/messages/notes-context";
import type { NotesChatUIMessage } from "@/ai/messages/types";
import { streamChatResponse } from "@/ai/response/stream-chat-response";

const bodySchema = z.object({
  messages: z.array(z.unknown()),
  gatewayApiKey: z.string().optional(),
  notesContext: notesContextSchema,
});

export async function POST(request: Request) {
  const parsedBody = bodySchema.safeParse(await request.json());
  if (!parsedBody.success) {
    return new Response("Invalid request body", { status: 400 });
  }
  const { messages: rawMessages, gatewayApiKey, notesContext } = parsedBody.data;

  let messages: NotesChatUIMessage[];
  try {
    // Note: no metadataSchema here — ours is an empty object and messages
    // legitimately arrive with `metadata: undefined`, which a schema would reject.
    messages = await validateUIMessages<NotesChatUIMessage>({
      messages: rawMessages,
      dataSchemas: {
        "create-note": createNoteDataSchema,
        "update-note": updateNoteDataSchema,
        "delete-note": deleteNoteDataSchema,
      },
    });
  } catch {
    return new Response("Invalid messages", { status: 400 });
  }

  const isLocal = process.env.NODE_ENV === "development";
  const isSecretKey = !!process.env.SECRET_KEY && gatewayApiKey === process.env.SECRET_KEY;
  const apiKey = isSecretKey || isLocal ? process.env.AI_GATEWAY_API_KEY : gatewayApiKey;

  if (!apiKey) {
    return new Response("Gateway API key is required", { status: 400 });
  }

  return streamChatResponse(messages, apiKey, notesContext);
}
