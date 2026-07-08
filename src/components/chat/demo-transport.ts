import { StaticChatTransport } from "@loremllm/transport";

import type { ChatUIMessage } from "@/ai/messages/types";
import { WEEK_PLAN_NOTE_ID } from "@/lib/seed-notes";

const CHECKLIST_CONTENT = `## Monday
- [ ] Ship the notes list refactor
- [ ] 1:1 with Sam at 2pm
- [ ] Review Priya's onboarding PR

## Tuesday
- [ ] Write the Q3 planning doc outline
- [ ] Gym before work
- [ ] Book flights for the offsite

## Wednesday
- [ ] Deep work block: editor performance
- [ ] Interview: senior design candidate at 11am

## Thursday
- [ ] Q3 planning review with the team
- [ ] Draft release notes for v0.4
- [ ] Dinner with Alex

## Friday
- [ ] Bug triage + cleanup day
- [ ] Publish the blog post if it's ready
- [ ] Plan next week before logging off`;

const toolInput = {
  id: WEEK_PLAN_NOTE_ID,
  content: CHECKLIST_CONTENT,
};

/**
 * Keyless demo mode: replays a scripted "Turn my week plan into a checklist"
 * exchange (one updateNote tool call) — no network, no API key.
 */
export const demoTransport = new StaticChatTransport<ChatUIMessage>({
  chunkDelayMs: [50, 200],
  async *mockResponse() {
    yield { type: "step-start" };

    yield {
      type: "text",
      text: "I'll convert every item in your week plan into a checkbox so you can tick things off as you go.",
    };

    yield {
      type: "tool-updateNote",
      // The transport reads `toolName` (not the part type) when emitting
      // tool-input/output chunks — omit it and the part assembles as "tool-tool".
      toolName: "updateNote",
      toolCallId: "call_demo_week_plan",
      state: "input-available",
      input: toolInput,
    };

    yield {
      type: "tool-updateNote",
      toolName: "updateNote",
      toolCallId: "call_demo_week_plan",
      state: "output-available",
      input: toolInput,
      output: `Successfully updated content on note ${WEEK_PLAN_NOTE_ID}.`,
    };

    yield {
      type: "data-update-note",
      id: "call_demo_week_plan",
      data: toolInput,
    };

    yield {
      type: "text",
      text: "Done — **Week plan** is now a checklist. Every task is a checkbox, grouped by day just like before. Open the note's Preview tab to see it rendered.",
    };
  },
});
