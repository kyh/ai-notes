import assert from "node:assert/strict";
import { describe, test } from "node:test";

import { resolveToolResult, type AgentStreamEvent } from "@/lib/chat-bridge";
import type { Note } from "@/lib/note-schema";

type ActionResultEvent = Extract<AgentStreamEvent, { type: "action.result" }>;
type ToolResult = Extract<ActionResultEvent["data"]["result"], { kind: "tool-result" }>;

interface ResultOverrides {
  status?: ActionResultEvent["data"]["status"];
  isError?: boolean;
}

const toolResult = (
  toolName: string,
  output: ToolResult["output"],
  overrides: ResultOverrides = {},
): AgentStreamEvent => ({
  type: "action.result",
  data: {
    result: { callId: "call-1", kind: "tool-result", output, toolName, isError: overrides.isError },
    sequence: 1,
    stepIndex: 0,
    status: overrides.status ?? "completed",
    turnId: "turn-1",
  },
});

const note = (overrides: Partial<Note> = {}): Note => ({
  id: "note-1",
  title: "Standup",
  content: "- shipped the bridge",
  tags: ["work"],
  createdAt: "2026-01-01T00:00:00.000Z",
  updatedAt: "2026-01-01T00:00:00.000Z",
  ...overrides,
});

describe("create_note", () => {
  test("inserts the note the tool returned and names it in the toast", () => {
    const created = note({ id: "note-9", title: "Groceries" });
    const outcome = resolveToolResult(toolResult("create_note", { note: created }), []);

    assert.deepEqual(outcome, {
      kind: "insert",
      note: created,
      message: 'Created "Groceries"',
    });
  });

  test("ignores a payload that is not a well-formed note", () => {
    const outcome = resolveToolResult(
      toolResult("create_note", { note: { id: "note-9", title: "Groceries" } }),
      [],
    );

    assert.deepEqual(outcome, { kind: "none" });
  });
});

describe("update_note", () => {
  test("patches only the fields the tool actually sent", () => {
    const existing = note();
    const outcome = resolveToolResult(
      toolResult("update_note", { id: "note-1", tags: ["work", "urgent"] }),
      [existing],
    );

    assert.deepEqual(outcome, {
      kind: "update",
      id: "note-1",
      patch: { tags: ["work", "urgent"] },
      message: 'Updated "Standup"',
    });
  });

  test("names the new title when the patch renames the note", () => {
    const outcome = resolveToolResult(
      toolResult("update_note", { id: "note-1", title: "Standup notes" }),
      [note()],
    );

    assert.deepEqual(outcome, {
      kind: "update",
      id: "note-1",
      patch: { title: "Standup notes" },
      message: 'Updated "Standup notes"',
    });
  });

  test("keeps an empty patch out of the store's way but still confirms", () => {
    const outcome = resolveToolResult(toolResult("update_note", { id: "note-1" }), [note()]);

    assert.deepEqual(outcome, {
      kind: "update",
      id: "note-1",
      patch: {},
      message: 'Updated "Standup"',
    });
  });

  test("reports an error rather than mutating when the target is gone", () => {
    const outcome = resolveToolResult(
      toolResult("update_note", { id: "deleted-note", title: "Ghost" }),
      [note()],
    );

    assert.deepEqual(outcome, {
      kind: "error",
      message: "The assistant tried to update a note that no longer exists",
    });
  });

  test("ignores a payload missing the note id", () => {
    const outcome = resolveToolResult(toolResult("update_note", { title: "Standup notes" }), [
      note(),
    ]);

    assert.deepEqual(outcome, { kind: "none" });
  });
});

describe("delete_note", () => {
  test("resolves the id against the store so the toast can name the note", () => {
    const outcome = resolveToolResult(toolResult("delete_note", { id: "note-1" }), [note()]);

    assert.deepEqual(outcome, { kind: "delete", id: "note-1", message: 'Deleted "Standup"' });
  });

  test("does nothing when the note is already gone", () => {
    const outcome = resolveToolResult(toolResult("delete_note", { id: "note-1" }), []);

    assert.deepEqual(outcome, { kind: "none" });
  });
});

describe("events that must not reach the store", () => {
  test("a tool result flagged as an error", () => {
    const outcome = resolveToolResult(
      toolResult("create_note", { note: note() }, { isError: true }),
      [],
    );

    assert.deepEqual(outcome, { kind: "none" });
  });

  test("a tool call the user rejected at the approval gate", () => {
    const outcome = resolveToolResult(
      toolResult("delete_note", { id: "note-1" }, { status: "rejected" }),
      [note()],
    );

    assert.deepEqual(outcome, { kind: "none" });
  });

  test("a tool call that failed", () => {
    const outcome = resolveToolResult(
      toolResult("delete_note", { id: "note-1" }, { status: "failed" }),
      [note()],
    );

    assert.deepEqual(outcome, { kind: "none" });
  });

  test("a tool the bridge does not own", () => {
    const outcome = resolveToolResult(toolResult("web_search", { query: "notes" }), []);

    assert.deepEqual(outcome, { kind: "none" });
  });

  test("a partial snapshot from a still-running tool generator", () => {
    const outcome = resolveToolResult(
      {
        type: "action.partial",
        data: {
          result: {
            callId: "call-1",
            kind: "tool-result",
            output: { note: note() },
            toolName: "create_note",
          },
          sequence: 1,
          stepIndex: 0,
          turnId: "turn-1",
        },
      },
      [],
    );

    assert.deepEqual(outcome, { kind: "none" });
  });

  test("a turn that was cancelled part-way through", () => {
    const outcome = resolveToolResult(
      { type: "turn.cancelled", data: { sequence: 2, turnId: "turn-1" } },
      [note()],
    );

    assert.deepEqual(outcome, { kind: "none" });
  });
});

describe("delegated child sessions", () => {
  test("unwraps a child's tool result so it still reaches the store", () => {
    const created = note({ id: "note-3", title: "From a subagent" });
    const outcome = resolveToolResult(
      {
        type: "subagent.event",
        data: {
          callId: "call-2",
          subagentName: "researcher",
          event: toolResult("create_note", { note: created }),
        },
      },
      [],
    );

    assert.deepEqual(outcome, {
      kind: "insert",
      note: created,
      message: 'Created "From a subagent"',
    });
  });
});
