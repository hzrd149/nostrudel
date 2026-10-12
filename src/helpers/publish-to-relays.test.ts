import { RelayPool } from "applesauce-relay";
import { finalizeEvent } from "nostr-tools";
import { lastValueFrom, toArray } from "rxjs";
import { afterEach, describe, expect, it, vi } from "vitest";

import publishToRelays from "./publish-to-relays";

const event = finalizeEvent({ kind: 1059, content: "encrypted", tags: [], created_at: 1 }, new Uint8Array(32).fill(1));
const urls = ["wss://one.example/", "wss://two.example/"];
const pools: RelayPool[] = [];

afterEach(() => {
  pools.splice(0).forEach((pool) => pool.close());
  vi.restoreAllMocks();
});

describe("publishing with v7 policy", () => {
  it("uses high-level publish and waits for the sender account rather than the gift-wrap key", async () => {
    const pool = new RelayPool();
    pools.push(pool);
    const publish = vi.spyOn(pool.relay(urls[0]), "publish").mockResolvedValue({ ok: true, from: urls[0] });
    const raw = vi.spyOn(pool.relay(urls[0]), "event");
    const stream = publishToRelays(pool, [urls[0]], event, "sender-pubkey");
    expect(publish).not.toHaveBeenCalled();

    expect(await lastValueFrom(stream.pipe(toArray()))).toEqual([{ ok: true, from: urls[0] }]);
    expect(publish).toHaveBeenCalledWith(event, { waitForAuth: "sender-pubkey" });
    expect(raw).not.toHaveBeenCalled();
  });

  it("preserves failures and streams successful relays without waiting for a slower relay", async () => {
    const pool = new RelayPool();
    pools.push(pool);
    let rejectSlow!: (reason: Error) => void;
    const failure = new Error("Authentication timed out");
    vi.spyOn(pool.relay(urls[0]), "publish").mockReturnValue(new Promise((_, reject) => (rejectSlow = reject)));
    vi.spyOn(pool.relay(urls[1]), "publish").mockResolvedValue({ ok: true, from: urls[1] });
    const results: unknown[] = [];
    const stream = publishToRelays(pool, urls, event, "sender");
    const done = lastValueFrom(stream.pipe(toArray()));
    await Promise.resolve();
    rejectSlow(failure);
    results.push(...(await done));
    expect(results).toEqual([
      { ok: true, from: urls[1] },
      { ok: false, from: urls[0], message: failure.message, error: failure },
    ]);
  });
});
