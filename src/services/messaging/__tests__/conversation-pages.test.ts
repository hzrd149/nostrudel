import { describe, expect, it } from "vitest";
import { ConversationPages, type ConversationSummary } from "../conversation-pages";

const row = (id: string, lastActivity: number): ConversationSummary => ({ id, lastActivity, participants: [id] });
async function* page(rows: ConversationSummary[]) {
  yield* rows;
}

describe("merged conversation pagination", () => {
  it("merges ordered protocols in bounded pages without replacing newer live updates", async () => {
    const pages = new ConversationPages([
      page([row("a", 10), row("b", 8), row("c", 6)]),
      page([row("a", 9), row("d", 7), row("e", 5)]),
    ]);
    await pages.load(2);
    expect(pages.rows$.value.map((row) => row.id)).toEqual(["a"]);
    pages.update(row("b", 20));
    await pages.load(2);
    expect(pages.rows$.value.map((row) => row.id)).toEqual(["b", "a", "d"]);
    expect(pages.rows$.value[0].lastActivity).toBe(20);
    await pages.load();
    expect(pages.done$.value).toBe(true);
    pages.dispose();
  });

  it("does not emit a late database result after disposal", async () => {
    let resolve!: (value: IteratorResult<ConversationSummary>) => void;
    const pages = new ConversationPages([
      {
        next: () =>
          new Promise((done) => {
            resolve = done;
          }),
      },
    ]);
    const loading = pages.load();
    pages.dispose();
    resolve({ value: row("a", 1), done: false });
    await loading;
    expect(pages.rows$.value).toEqual([]);
  });
});
