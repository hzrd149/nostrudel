import { NAPPLET_KIND_NAMED } from "@kehto/nip";
import { DeleteManager, EventStore } from "applesauce-core";
import { getReplaceableAddress } from "applesauce-core/helpers";
import { finalizeEvent, kinds } from "nostr-tools";
import { describe, expect, it } from "vitest";

const key = new Uint8Array(32).fill(1);
const manifest = finalizeEvent({ kind: NAPPLET_KIND_NAMED, created_at: 100, tags: [["d", "app"]], content: "{}" }, key);

describe("deletion requests", () => {
  it("recognizes a deleted manifest rather than treating its absence as loading", () => {
    const deletes = new DeleteManager();
    const store = new EventStore({ deleteManager: deletes });
    store.add(manifest);
    expect(deletes.check(manifest)).toBe(false);

    const address = getReplaceableAddress(manifest);
    if (!address) throw new Error("Expected a manifest address");
    store.add(
      finalizeEvent(
        {
          kind: kinds.EventDeletion,
          created_at: 101,
          tags: [
            ["e", manifest.id],
            ["a", address],
          ],
          content: "",
        },
        key,
      ),
    );

    expect(store.getEvent(manifest.id)).toBeUndefined();
    expect(deletes.check(manifest)).toBe(true);
    store.dispose();
  });

  it("also recognizes deletion by replaceable address", () => {
    const deletes = new DeleteManager();
    const store = new EventStore({ deleteManager: deletes });
    store.add(manifest);
    const address = getReplaceableAddress(manifest);
    if (!address) throw new Error("Expected a manifest address");
    store.add(finalizeEvent({ kind: kinds.EventDeletion, created_at: 101, tags: [["a", address]], content: "" }, key));

    expect(deletes.check(manifest)).toBe(true);
    store.dispose();
  });

  it("does not treat another author's request as deletion", () => {
    const deletes = new DeleteManager();
    const store = new EventStore({ deleteManager: deletes });
    store.add(manifest);
    store.add(
      finalizeEvent(
        { kind: kinds.EventDeletion, created_at: 101, tags: [["e", manifest.id]], content: "" },
        new Uint8Array(32).fill(2),
      ),
    );

    expect(deletes.check(manifest)).toBe(false);
    expect(store.getEvent(manifest.id)).toBeDefined();
    store.dispose();
  });

  it("does not apply an older address deletion to a newer manifest", () => {
    const deletes = new DeleteManager();
    const store = new EventStore({ deleteManager: deletes });
    const address = getReplaceableAddress(manifest);
    if (!address) throw new Error("Expected a manifest address");
    store.add(finalizeEvent({ kind: kinds.EventDeletion, created_at: 99, tags: [["a", address]], content: "" }, key));
    store.add(manifest);

    expect(deletes.check(manifest)).toBe(false);
    expect(store.getEvent(manifest.id)).toBeDefined();
    store.dispose();
  });
});
