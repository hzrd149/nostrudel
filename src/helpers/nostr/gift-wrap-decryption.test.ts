import { EventStore } from "applesauce-core";
import { finalizeEvent, kinds, NostrEvent } from "nostr-tools";
import { lastValueFrom } from "rxjs";
import { describe, expect, it, vi } from "vitest";

const unlocked = new Set<string>();
const unlockGiftWrap = vi.fn(async (gift: NostrEvent) => {
  if (gift.content === "bad") throw new Error("invalid MAC");
  if (gift.content === "reject") throw new Error("User rejected the request");
  unlocked.add(gift.id);
});

vi.mock("applesauce-common/helpers", () => ({
  isGiftWrapUnlocked: (gift: NostrEvent) => unlocked.has(gift.id),
  unlockGiftWrap: (gift: NostrEvent) => unlockGiftWrap(gift),
}));

const { decryptGiftWraps } = await import("./gift-wrap-decryption");

const pubkey = "a".repeat(64);
const key = new Uint8Array(32).fill(2);
const wrap = (content: string, created_at = 1) =>
  finalizeEvent({ kind: kinds.GiftWrap, content, tags: [["p", pubkey]], created_at }, key);

describe("decryptGiftWraps", () => {
  it("skips failed gift wraps, remembers new failures, and decrypts ones that arrive later", async () => {
    const store = new EventStore();
    const good = wrap("good", 1);
    const bad = wrap("bad", 2);
    const known = wrap("known-bad", 3);
    store.add(good);
    store.add(bad);
    store.add(known);

    const failed = new Set([known.id]);
    let count = 0;
    const subscription = decryptGiftWraps({
      store,
      pubkey,
      signer: {},
      isFailed: (id) => failed.has(id),
      onFailed: (id) => failed.add(id),
    }).subscribe((value) => (count = value));

    await vi.waitFor(() => expect(failed.has(bad.id)).toBe(true));
    store.add(wrap("later", 4));
    await vi.waitFor(() => expect(count).toBe(2));
    subscription.unsubscribe();

    expect(unlockGiftWrap).not.toHaveBeenCalledWith(known);
    expect(unlocked.has(good.id)).toBe(true);
  });

  it("stops without marking the gift wrap failed when the user rejects the signer", async () => {
    const store = new EventStore();
    const rejected = wrap("reject", 5);
    store.add(rejected);
    const failed = new Set<string>();

    await expect(
      lastValueFrom(
        decryptGiftWraps({
          store,
          pubkey,
          signer: {},
          isFailed: (id) => failed.has(id),
          onFailed: (id) => failed.add(id),
        }),
      ),
    ).rejects.toThrow("User rejected");
    expect(failed.size).toBe(0);
  });
});
