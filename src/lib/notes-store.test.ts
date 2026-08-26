import assert from "node:assert/strict";
import { beforeEach, describe, test } from "node:test";

import { applyStreamEvent, type AgentStreamEvent } from "@/lib/chat-bridge";
import type { Note } from "@/lib/note-schema";
import { useNotesStore } from "@/lib/notes-store";

const note = (overrides: Partial<Note> = {}): Note => ({
  id: "note-1",
  title: "Standup",
  content: "- shipped the bridge",
  tags: ["work"],
  createdAt: "2026-01-01T00:00:00.000Z",
  updatedAt: "2026-01-01T00:00:00.000Z",
  ...overrides,
});

const seedStore = (notes: Note[], activeNoteId: string | null = null) => {
  useNotesStore.setState({ notes, activeNoteId, seeded: true });
};

type ActionResultEvent = Extract<AgentStreamEvent, { type: "action.result" }>;
type ToolResult = Extract<ActionResultEvent["data"]["result"], { kind: "tool-result" }>;

const toolResult = (toolName: string, output: ToolResult["output"]): AgentStreamEvent => ({
  type: "action.result",
  data: {
    result: { callId: "call-1", kind: "tool-result", output, toolName },
    sequence: 1,
    stepIndex: 0,
    status: "completed",
    turnId: "turn-1",
  },
});

/** Mirrors the chat panel: the store is re-read for every streamed event. */
const stream = (...events: AgentStreamEvent[]) =>
  events.map((event) => applyStreamEvent(event, useNotesStore.getState()));

beforeEach(() => {
  seedStore([]);
});

describe("insertNote", () => {
  test("puts the new note first and makes it active", () => {
    seedStore([note({ id: "old" })], "old");

    useNotesStore.getState().insertNote(note({ id: "new", title: "New" }));

    const { notes, activeNoteId } = useNotesStore.getState();
    assert.deepEqual(
      notes.map((n) => n.id),
      ["new", "old"],
    );
    assert.equal(activeNoteId, "new");
  });

  test("replaces a note of the same id rather than duplicating it", () => {
    seedStore([note({ id: "note-1", title: "First draft" })]);

    useNotesStore.getState().insertNote(note({ id: "note-1", title: "Second draft" }));

    const { notes } = useNotesStore.getState();
    assert.equal(notes.length, 1);
    assert.equal(notes[0]?.title, "Second draft");
  });
});

describe("updateNote", () => {
  test("applies the patch, bumps updatedAt, and keeps everything else", () => {
    seedStore([note()]);

    useNotesStore.getState().updateNote("note-1", { tags: ["work", "urgent"] });

    const updated = useNotesStore.getState().notes[0];
    assert.deepEqual(updated?.tags, ["work", "urgent"]);
    assert.equal(updated?.title, "Standup");
    assert.equal(updated?.content, "- shipped the bridge");
    assert.equal(updated?.createdAt, "2026-01-01T00:00:00.000Z");
    assert.notEqual(updated?.updatedAt, "2026-01-01T00:00:00.000Z");
  });

  test("leaves every other note untouched", () => {
    const untouched = note({ id: "note-2", title: "Other" });
    seedStore([note(), untouched]);

    useNotesStore.getState().updateNote("note-1", { title: "Renamed" });

    assert.deepEqual(useNotesStore.getState().notes[1], untouched);
  });

  test("is a no-op for an id the store does not hold", () => {
    const before = [note()];
    seedStore(before);

    useNotesStore.getState().updateNote("missing", { title: "Renamed" });

    assert.deepEqual(useNotesStore.getState().notes, before);
  });
});

describe("deleteNote", () => {
  test("clears the active note when it is the one being deleted", () => {
    seedStore([note()], "note-1");

    useNotesStore.getState().deleteNote("note-1");

    assert.deepEqual(useNotesStore.getState().notes, []);
    assert.equal(useNotesStore.getState().activeNoteId, null);
  });

  test("leaves a different active note selected", () => {
    seedStore([note(), note({ id: "note-2" })], "note-2");

    useNotesStore.getState().deleteNote("note-1");

    assert.equal(useNotesStore.getState().activeNoteId, "note-2");
  });
});

describe("seed", () => {
  test("adds the demo notes once and marks the store seeded", () => {
    useNotesStore.getState().seed();
    const seeded = useNotesStore.getState().notes.length;
    assert.ok(seeded > 0);

    useNotesStore.getState().seed();

    assert.equal(useNotesStore.getState().notes.length, seeded);
    assert.equal(useNotesStore.getState().seeded, true);
  });

  test("keeps the notes the user already had, and selects one", () => {
    seedStore([note({ id: "mine" })]);

    useNotesStore.getState().seed();

    const { notes, activeNoteId } = useNotesStore.getState();
    assert.ok(notes.some((n) => n.id === "mine"));
    assert.equal(activeNoteId, "mine");
  });
});

describe("streaming tool results into the store", () => {
  test("a create-then-update turn lands as one note carrying both changes", () => {
    const created = note({ id: "note-7", title: "Meeting", tags: [] });

    const notifications = stream(
      toolResult("create_note", { note: created }),
      toolResult("update_note", { id: "note-7", tags: ["meeting"] }),
    );

    const { notes } = useNotesStore.getState();
    assert.equal(notes.length, 1);
    assert.equal(notes[0]?.title, "Meeting");
    assert.deepEqual(notes[0]?.tags, ["meeting"]);
    assert.deepEqual(notifications, [
      { tone: "success", message: 'Created "Meeting"' },
      { tone: "success", message: 'Updated "Meeting"' },
    ]);
  });

  test("a stream cut short keeps the mutations that already landed", () => {
    const created = note({ id: "note-7", title: "Meeting", tags: [] });

    stream(toolResult("create_note", { note: created }));
    // The turn aborts here: the follow-up update_note result never arrives.

    const { notes, activeNoteId } = useNotesStore.getState();
    assert.deepEqual(
      notes.map((n) => n.id),
      ["note-7"],
    );
    assert.equal(activeNoteId, "note-7");
  });

  test("a replayed event settles to one note instead of two", () => {
    const created = note({ id: "note-7", title: "Meeting" });
    const event = toolResult("create_note", { note: created });

    stream(event, event);

    assert.equal(useNotesStore.getState().notes.length, 1);
  });

  test("an unparseable payload leaves the store exactly as it was", () => {
    const before = [note()];
    seedStore(before, "note-1");

    const notifications = stream(toolResult("update_note", { id: 42 }));

    assert.deepEqual(useNotesStore.getState().notes, before);
    assert.deepEqual(notifications, [null]);
  });

  test("deleting the active note through the stream clears the selection", () => {
    seedStore([note(), note({ id: "note-2", title: "Other" })], "note-1");

    const notifications = stream(toolResult("delete_note", { id: "note-1" }));

    assert.deepEqual(
      useNotesStore.getState().notes.map((n) => n.id),
      ["note-2"],
    );
    assert.equal(useNotesStore.getState().activeNoteId, null);
    assert.deepEqual(notifications, [{ tone: "success", message: 'Deleted "Standup"' }]);
  });

  test("an update aimed at a note the user just deleted surfaces as an error", () => {
    seedStore([note()], "note-1");

    const notifications = stream(
      toolResult("delete_note", { id: "note-1" }),
      toolResult("update_note", { id: "note-1", title: "Renamed" }),
    );

    assert.deepEqual(useNotesStore.getState().notes, []);
    assert.deepEqual(notifications, [
      { tone: "success", message: 'Deleted "Standup"' },
      { tone: "error", message: "The assistant tried to update a note that no longer exists" },
    ]);
  });
});
