import { CommentFactory, NoteFactory } from "applesauce-common/factories";
import { COMMENT_KIND, getCommentReplyPointer, getCommentRootPointer } from "applesauce-common/helpers";
import { EventStore } from "applesauce-core";
import { matchFilters, NostrEvent } from "nostr-tools";
import { firstValueFrom } from "rxjs";
import { describe, expect, it } from "vitest";

import { ThreadRepliesModel } from "../../models/thread-replies";
import { countDescendantsInStore } from "./descendant-count";
import { castThreadEvent, getThreadFilters, getThreadParent, getThreadRoot, isDirectThreadReply } from "./thread";

const pubkey = "ab".repeat(32);
const rootId = "01".repeat(32);
const parentId = "02".repeat(32);
function event(id: string, kind = 1, tags: string[][] = []): NostrEvent {
  return { id, kind, pubkey, created_at: 1, content: "Hello", tags, sig: "00".repeat(64) };
}
function comment(
  id: string,
  parent = rootId,
  rootTags: string[][] = [
    ["E", rootId],
    ["K", "1063"],
  ],
) {
  return event(id, COMMENT_KIND, [...rootTags, ["e", parent], ["k", parent === rootId ? "1063" : "1111"]]);
}
function storeWith(...events: NostrEvent[]) {
  const store = new EventStore({ verifyEvent: () => true });
  events.forEach((item) => store.add(item));
  return store;
}

describe("thread references and loading", () => {
  it("preserves marked and legacy NIP-10 root and parent relationships", () => {
    for (const tags of [
      [
        ["e", rootId, "", "root"],
        ["e", parentId, "", "reply"],
      ],
      [
        ["e", rootId],
        ["e", parentId],
      ],
    ]) {
      const reply = event("03".repeat(32), 1, tags);
      expect(getThreadRoot(reply)).toMatchObject({ id: rootId });
      expect(getThreadParent(reply)).toMatchObject({ id: parentId });
      expect(isDirectThreadReply(reply, parentId)).toBe(true);
      expect(isDirectThreadReply(reply, rootId)).toBe(false);
    }
    expect(getThreadParent(event(parentId, 1, [["e", rootId, "", "root"]]))).toMatchObject({ id: rootId });
  });

  it("separates NIP-22 root and parent, preserving author and relay hints", () => {
    const reply = comment("03".repeat(32), parentId, [
      ["E", rootId, "wss://relay.example.com/", pubkey],
      ["K", "1063"],
    ]);
    expect(getThreadRoot(reply)).toEqual({
      id: rootId,
      kind: 1063,
      author: pubkey,
      relays: ["wss://relay.example.com/"],
    });
    expect(getThreadParent(reply)).toMatchObject({ id: parentId, kind: 1111 });
    expect(isDirectThreadReply(reply, rootId)).toBe(false);
    expect(matchFilters(getThreadFilters(getThreadRoot(reply)), reply)).toBe(true);
  });

  it("prefers address scopes over accompanying event IDs", () => {
    const address = `30023:${pubkey}:article`;
    const reply = comment(parentId, rootId, [
      ["A", address],
      ["E", rootId],
      ["K", "30023"],
    ]);
    reply.tags.push(["a", address]);
    const scope = getThreadRoot(reply);
    expect(scope).toMatchObject({ kind: 30023, pubkey, identifier: "article" });
    expect(getThreadFilters(scope)).toEqual([{ kinds: [1111], "#A": [address] }]);
    expect(isDirectThreadReply(reply, event(rootId, 30023, [["d", "article"]]))).toBe(true);
  });

  it("loads external scope descendants without pretending the root is an event", () => {
    const reply = comment(parentId, rootId, [
      ["I", "https://example.com/article"],
      ["K", "web"],
    ]);
    const scope = getThreadRoot(reply);
    expect(scope).toEqual({ type: "external", kind: "web", identifier: "https://example.com/article" });
    expect(getThreadFilters(scope)).toEqual([{ kinds: [1111], "#I": ["https://example.com/article"] }]);
  });

  it("keeps quotes out of direct replies and tolerates malformed comments", () => {
    expect(isDirectThreadReply(event(parentId, 1, [["q", rootId]]), rootId)).toBe(false);
    const malformed = event(parentId, 1111, [["e", rootId]]);
    expect(getThreadParent(malformed)).toBeUndefined();
    expect(castThreadEvent(malformed)).toBeUndefined();
  });
});

describe("reactive thread replies", () => {
  it("casts both protocols and excludes descendants, quotes and malformed comments", async () => {
    const root = event(rootId);
    const note = event(parentId, 1, [["e", rootId, "", "root"]]);
    const direct = comment("03".repeat(32), rootId, [
      ["E", rootId],
      ["K", "1"],
    ]);
    direct.tags.find((tag) => tag[0] === "k")![1] = "1";
    const nested = comment("04".repeat(32), direct.id);
    const store = storeWith(root, note, direct, nested, event("05".repeat(32), 1, [["q", rootId]]));
    const replies = await firstValueFrom(store.model(ThreadRepliesModel, root));
    expect(replies.map((reply) => reply.id).sort()).toEqual([note.id, direct.id].sort());
    expect(countDescendantsInStore(rootId, store)).toBe(3);
  });

  it("updates when replies arrive and when they are removed", () => {
    const root = event(rootId, 1063);
    const store = storeWith(root);
    const values: string[][] = [];
    const subscription = store
      .model(ThreadRepliesModel, root)
      .subscribe((replies) => values.push(replies.map((r) => r.id)));
    store.add(comment(parentId));
    expect(values.at(-1)).toEqual([parentId]);
    store.remove(parentId);
    expect(values.at(-1)).toEqual([]);
    subscription.unsubscribe();
  });

  it("counts address replies once even when both a and e match", () => {
    const root = event(rootId, 30023, [["d", "article"]]);
    const reply = comment(parentId, rootId, [
      ["A", `30023:${pubkey}:article`],
      ["K", "30023"],
    ]);
    reply.tags.push(["a", `30023:${pubkey}:article`]);
    expect(countDescendantsInStore(rootId, storeWith(root, reply))).toBe(1);
  });

  it("stops counting when parent references form a cycle", () => {
    const first = comment(rootId, parentId);
    const second = comment(parentId, rootId);
    expect(countDescendantsInStore(rootId, storeWith(first, second))).toBe(1);
  });
});

describe("reply factories", () => {
  it("keeps NIP-10 replies as kind 1", async () => {
    const draft = await NoteFactory.reply(event(rootId), "Reply");
    expect(draft.kind).toBe(1);
    expect(draft.tags).toContainEqual(expect.arrayContaining(["e", rootId]));
  });

  it("preserves a nested comment's original root scope", async () => {
    for (const tags of [
      [
        ["E", rootId],
        ["K", "1063"],
      ],
      [
        ["A", `30023:${pubkey}:article`],
        ["K", "30023"],
      ],
      [
        ["I", "https://example.com/article"],
        ["K", "web"],
      ],
    ]) {
      const parent = comment(parentId, rootId, tags);
      const draft = await CommentFactory.reply(parent, "Reply");
      expect(draft.kind).toBe(1111);
      expect(getCommentRootPointer({ ...event("03".repeat(32)), ...draft })).toEqual(getCommentRootPointer(parent));
      expect(getCommentReplyPointer({ ...event("03".repeat(32)), ...draft })).toMatchObject({
        id: parentId,
        kind: 1111,
      });
    }
  });
});
