import { generateSecretKey, getPublicKey, nip44, verifyEvent } from "nostr-tools";
import { beforeEach, describe, expect, it, vi } from "vitest";

const storage = vi.hoisted(() => ({
  values: new Map<string, string>(),
  getItem: vi.fn<(key: string) => Promise<string | null>>(),
  setItem: vi.fn<(key: string, value: string) => Promise<void>>(),
}));
vi.mock("localforage", () => ({ default: { createInstance: () => storage } }));

beforeEach(() => {
  vi.resetModules();
  storage.values.clear();
  storage.getItem.mockReset().mockImplementation(async (key) => storage.values.get(key) ?? null);
  storage.setItem.mockReset().mockImplementation(async (key, value) => {
    storage.values.set(key, value);
  });
});

describe("local napplet transport identities", () => {
  it("persists one identity per app across reloads and shares it across concurrent callers", async () => {
    let { getNappletTransportSigner } = await import("../transport-identity");
    const a = getNappletTransportSigner("author:35129:game");
    const pubkeys = await Promise.all([
      a.getPublicKey(),
      getNappletTransportSigner("author:35129:game").getPublicKey(),
    ]);
    expect(pubkeys[0]).toBe(pubkeys[1]);
    expect(storage.setItem).toHaveBeenCalledTimes(1);
    const other = await getNappletTransportSigner("author:35129:other").getPublicKey();
    expect(other).not.toBe(pubkeys[0]);
    vi.resetModules();
    ({ getNappletTransportSigner } = await import("../transport-identity"));
    expect(await getNappletTransportSigner("author:35129:game").getPublicKey()).toBe(pubkeys[0]);
    expect(storage.setItem).toHaveBeenCalledTimes(2);
  });

  it("signs valid Nostr events and exchanges NIP-44 messages with a peer", async () => {
    const { getNappletTransportSigner } = await import("../transport-identity");
    const signer = getNappletTransportSigner("game");
    const pubkey = await signer.getPublicKey();
    const event = await signer.signEvent({ kind: 25050, created_at: 1, tags: [], content: "hello" });
    expect(event.pubkey).toBe(pubkey);
    expect(verifyEvent(event)).toBe(true);
    const remote = generateSecretKey();
    const remotePubkey = getPublicKey(remote);
    const conversationKey = nip44.v2.utils.getConversationKey(remote, pubkey);
    const encrypted = await signer.nip44.encrypt(remotePubkey, "private-offer");
    expect(nip44.v2.decrypt(encrypted, conversationKey)).toBe("private-offer");
    expect(await signer.nip44.decrypt(remotePubkey, nip44.v2.encrypt("private-answer", conversationKey))).toBe(
      "private-answer",
    );
  });

  it("fails on corrupted storage and retries a failed write without changing identity silently", async () => {
    const { getNappletTransportSigner } = await import("../transport-identity");
    storage.values.set("broken", "invalid");
    await expect(getNappletTransportSigner("broken").getPublicKey()).rejects.toThrow("Invalid local");
    storage.setItem.mockRejectedValueOnce(new Error("Storage unavailable"));
    const signer = getNappletTransportSigner("new");
    await expect(signer.getPublicKey()).rejects.toThrow("Storage unavailable");
    expect(storage.values.has("new")).toBe(false);
    const pubkey = await signer.getPublicKey();
    expect(pubkey).toMatch(/^[a-f0-9]{64}$/);
  });
});
