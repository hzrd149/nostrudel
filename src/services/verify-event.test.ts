import { addSeenRelay } from "applesauce-core/helpers";
import { finalizeEvent, verifiedSymbol } from "nostr-tools";
import { BehaviorSubject } from "rxjs";
import { afterEach, describe, expect, it, vi } from "vitest";

vi.mock("./preferences", () => ({
  default: {
    verifyEventMethod: new BehaviorSubject("internal"),
    optimisticVerification: new BehaviorSubject(true),
  },
}));
vi.mock("localforage", () => {
  const values = new Map<string, string>();
  const storage = {
    getItem: async (key: string) => values.get(key) ?? null,
    setItem: async (key: string, value: string) => {
      values.set(key, value);
      return value;
    },
    keys: async () => [...values.keys()],
    clear: async () => {
      values.clear();
    },
  };
  return { default: { createInstance: () => storage } };
});
vi.mock("nostr-wasm", () => ({ initNostrWasm: vi.fn() }));

import localforage from "localforage";
import { initNostrWasm } from "nostr-wasm";
import localSettings from "./preferences";
import verifyEvent, {
  loadKnownVerificationRelays,
  optimisticVerifier,
  resetRelayTrust,
  verifyStoreEvent,
} from "./verify-event";

const key = new Uint8Array(32).fill(1);
function event(kind = 1) {
  // Drop finalizeEvent's verified flag so forged signatures actually get checked.
  const signed = finalizeEvent({ kind, created_at: 100, tags: [], content: "hello" }, key);
  Reflect.deleteProperty(signed, verifiedSymbol);
  return signed;
}
function forged(kind = 1) {
  return { ...event(kind), sig: "0".repeat(128) };
}

afterEach(() => {
  localSettings.verifyEventMethod.next("internal");
  localSettings.optimisticVerification.next(true);
  vi.restoreAllMocks();
  vi.mocked(initNostrWasm).mockReset();
});

describe("event verification policy", () => {
  it("verifies signatures immediately, before WASM initializes", () => {
    expect(verifyEvent(event())).toBe(true);
    expect(verifyEvent(forged())).toBe(false);
  });

  it("keeps full verification for sensitive events even in skip mode", () => {
    localSettings.verifyEventMethod.next("none");
    for (const kind of [0, 3, 10002, 9735, 1059, 7375, 23194, 30078]) {
      expect(verifyStoreEvent(forged(kind))).toBe(false);
    }
    const note = forged();
    expect(verifyStoreEvent(note)).toBe(true);
    expect(Reflect.get(note, verifiedSymbol)).toBeUndefined();
    expect(verifyEvent(note)).toBe(false);
  });

  it("controls optimistic verification independently of the signature backend", () => {
    vi.mocked(initNostrWasm).mockReturnValue(new Promise(() => {}));
    const sample = vi.spyOn(optimisticVerifier, "verifyEvent").mockReturnValue(true);
    for (const method of ["internal", "wasm"]) {
      localSettings.verifyEventMethod.next(method);
      localSettings.optimisticVerification.next(true);
      expect(verifyStoreEvent(forged())).toBe(true);
      expect(verifyStoreEvent(forged(1111))).toBe(true);
      expect(verifyStoreEvent(forged(9735))).toBe(false);
      localSettings.optimisticVerification.next(false);
      expect(verifyStoreEvent(forged())).toBe(false);
    }
    expect(sample).toHaveBeenCalledTimes(4);
  });

  it("loads persisted relay scores and resets both saved and in-memory trust", async () => {
    const storage = localforage.createInstance({ name: "event-verification" });
    const relay = "wss://previous-session.example/";
    const storageKey = `applesauce:optimistic-verifier:v1:${relay}`;
    const day = Math.floor(Date.now() / 86400000);
    await storage.setItem(
      storageKey,
      JSON.stringify({ version: 1, days: Array.from({ length: 14 }, (_, i) => [day - i, 700]) }),
    );
    await loadKnownVerificationRelays();
    await vi.waitFor(() => expect(optimisticVerifier.getRelayState(relay).trust).toBeGreaterThan(0));
    const retired = optimisticVerifier;
    await resetRelayTrust();
    await vi.waitFor(() => expect(optimisticVerifier.getRelayState(relay).ready).toBe(true));
    expect(optimisticVerifier.getRelayState(relay).trust).toBe(0);
    expect(optimisticVerifier.getRelayState(relay).verificationProbability).toBe(1);
    expect(await storage.getItem(storageKey)).toBeNull();
    // Even a late write by a retired verifier must not restore old trust.
    const note = event();
    addSeenRelay(note, relay);
    retired.verifyEvent(note);
    await new Promise((resolve) => setTimeout(resolve, 0));
    expect(await storage.getItem(storageKey)).toBeNull();
  });

  it("rejects invalid hashes and signatures from untrusted relays", () => {
    const invalid = forged();
    addSeenRelay(invalid, "wss://untrusted.example");
    expect(optimisticVerifier.verifyEvent(invalid)).toBe(false);
    const changed = { ...event(), content: "tampered" };
    expect(optimisticVerifier.verifyEvent(changed)).toBe(false);
  });

  it("uses nostr-wasm for full signature checks once initialized", async () => {
    const actual = await vi.importActual<typeof import("nostr-wasm")>("nostr-wasm");
    const wasm = await actual.initNostrWasm();
    const check = vi.spyOn(wasm, "verifyEvent");
    vi.mocked(initNostrWasm).mockResolvedValue(wasm);
    vi.resetModules();
    const settings = (await import("./preferences")).default;
    const verification = await import("./verify-event");
    settings.verifyEventMethod.next("wasm-strict");
    await vi.waitFor(() => {
      expect(verification.default(event())).toBe(true);
      expect(check).toHaveBeenCalled();
    });
    expect(verification.default(forged())).toBe(false);
    settings.verifyEventMethod.next("internal");
  });

  it("ignores WASM initialization that finishes after switching to JavaScript", async () => {
    const actual = await vi.importActual<typeof import("nostr-wasm")>("nostr-wasm");
    const wasm = await actual.initNostrWasm();
    const check = vi.spyOn(wasm, "verifyEvent");
    let resolve: (value: typeof wasm) => void = () => {};
    vi.mocked(initNostrWasm).mockImplementation(
      () =>
        new Promise((res) => {
          resolve = res;
        }),
    );
    vi.resetModules();
    const settings = (await import("./preferences")).default;
    const verification = await import("./verify-event");
    settings.verifyEventMethod.next("wasm");
    await vi.waitFor(() => expect(initNostrWasm).toHaveBeenCalled());
    settings.verifyEventMethod.next("internal");
    resolve(wasm);
    await new Promise((res) => setTimeout(res, 0));
    expect(verification.default(event())).toBe(true);
    expect(check).not.toHaveBeenCalled();
  });

  it("falls back to JavaScript when WASM fails without disabling verification", async () => {
    vi.mocked(initNostrWasm).mockRejectedValue(new Error("WASM failed"));
    // Reset module state so this attempt does not reuse an earlier pending initialization.
    vi.resetModules();
    const settings = (await import("./preferences")).default;
    const verification = await import("./verify-event");
    settings.verifyEventMethod.next("wasm");
    await vi.waitFor(() => expect(initNostrWasm).toHaveBeenCalled());
    expect(verification.default(forged())).toBe(false);
    expect(settings.verifyEventMethod.value).toBe("wasm");
    settings.verifyEventMethod.next("internal");
  });
});
