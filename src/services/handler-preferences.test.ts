import { BehaviorSubject, of } from "rxjs";
import { finalizeEvent, getPublicKey, type EventTemplate, type NostrEvent } from "nostr-tools";
import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({ request: vi.fn(), publish: vi.fn(), add: vi.fn(), profileLoader: vi.fn() }));
let account: {
  pubkey: string;
  signEvent: ReturnType<typeof vi.fn>;
  nip44: { encrypt: ReturnType<typeof vi.fn>; decrypt: ReturnType<typeof vi.fn> };
};
let active$: BehaviorSubject<typeof account | undefined>;
vi.mock("./accounts", () => ({
  default: {
    get active() {
      return active$.value;
    },
    get active$() {
      return active$;
    },
  },
}));
vi.mock("./pool", () => ({ default: mocks }));
vi.mock("./event-store", () => ({ eventStore: { add: mocks.add } }));
vi.mock("./loaders", () => ({ profileLoader: mocks.profileLoader }));
vi.mock("./napplet-shell/relay-tiers", () => ({ getReadRelays: () => ["wss://shell"] }));
const key = new Uint8Array(32).fill(3);
const pubkey = getPublicKey(key);
const ref = `35129:${pubkey}:handler`;
let events: NostrEvent[];
let storage: Map<string, string>;
let service: typeof import("./handler-preferences");

function event(tags: string[][], content = "", created_at = 1) {
  return finalizeEvent({ kind: 31129, created_at, tags: [["d", "profile"], ...tags], content }, key);
}

beforeEach(async () => {
  vi.resetModules();
  vi.clearAllMocks();
  events = [];
  storage = new Map();
  vi.stubGlobal("localStorage", {
    getItem: (key: string) => storage.get(key) ?? null,
    setItem: (key: string, value: string) => storage.set(key, value),
  });
  vi.stubGlobal("window", { addEventListener: () => {} });
  account = {
    pubkey,
    signEvent: vi.fn(async (template: EventTemplate) => finalizeEvent(template, key)),
    nip44: { encrypt: vi.fn(async () => "encrypted"), decrypt: vi.fn(async () => JSON.stringify([["a", ref]])) },
  };
  active$ = new BehaviorSubject<typeof account | undefined>(undefined);
  mocks.request.mockImplementation((_relays, filter) => of(...(filter.kinds?.includes(31129) ? events : [])));
  mocks.publish.mockResolvedValue({ "wss://write.example.com/": { ok: true } });
  mocks.profileLoader.mockImplementation(() =>
    of(
      finalizeEvent(
        { kind: 10002, created_at: 1, tags: [["r", "wss://write.example.com/", "write"]], content: "" },
        key,
      ),
    ),
  );
  service = await import("./handler-preferences");
});

async function connect() {
  active$.next(account);
  await service.refreshHandlerPreferences();
}

describe("handler preference sync", () => {
  it("preserves explicit legacy defaults without importing installed apps", async () => {
    storage.set(`nostrudel:napplet:intent-handlers:${pubkey}`, JSON.stringify({ profile: ref }));
    storage.set(`nostrudel:napplet:installed:${pubkey}`, JSON.stringify([{ address: `35129:${pubkey}:unused` }]));
    await connect();
    expect(service.localHandlerPreferences$.value).toEqual({ profile: ref });
    service.setLocalHandlerPreference("profile");
    active$.next(undefined);
    await connect();
    expect(service.localHandlerPreferences$.value).toEqual({});
  });

  it("keeps device choices isolated across accounts", async () => {
    service.setLocalHandlerPreference("napplet:profile/open", ref);
    await connect();
    expect(service.localHandlerPreferences$.value).toEqual({});
    active$.next(undefined);
    expect(service.localHandlerPreferences$.value).toEqual({ "napplet:profile/open": ref });
  });

  it("unlocks private preferences before resolving an intent", async () => {
    events = [event([], "ciphertext")];
    await connect();
    await service.prepareHandlerPreferences("profile");
    expect(account.nip44.decrypt).toHaveBeenCalledWith(pubkey, "ciphertext");
    expect(service.handlerPreferences$.value.get("profile")?.locked).toBe(false);
  });

  it("replaces only the selected intent scope when discovery remembers a choice", async () => {
    const next = `35129:${pubkey}:next`;
    events = [
      event([
        ["extension", "keep"],
        ["a", ref],
        ["i", "napplet:profile/open", ref],
        ["i", "napplet:profile/edit", ref],
      ]),
    ];
    await connect();
    await service.saveHandlerEntry(
      "profile",
      { reference: next, convention: "napplet:profile/open", private: true },
      false,
      true,
    );
    const saved = service.handlerPreferences$.value.get("profile")!;
    expect(saved.event.tags).toEqual([
      ["d", "profile"],
      ["extension", "keep"],
      ["a", ref],
      ["i", "napplet:profile/edit", ref],
    ]);
    expect(saved.privateTags).toEqual([["i", "napplet:profile/open", next]]);
  });

  it("tries same-event hints before the author's write relays and shell relays", async () => {
    events = [
      event([
        ["a", ref, "wss://hint.example.com/"],
        ["i", "napplet:profile/edit", ref],
      ]),
    ];
    await connect();
    const discovery = mocks.request.mock.calls.filter(([, filter]) => !filter.kinds?.includes(31129));
    expect(discovery.map(([relays]) => relays)).toEqual([
      ["wss://hint.example.com/"],
      ["wss://write.example.com/"],
      ["wss://shell"],
    ]);
  });

  it("accepts only verified events authored by the user and keeps unresolved references", async () => {
    const other = finalizeEvent(
      { kind: 31129, created_at: 10, tags: [["d", "chat"]], content: "" },
      new Uint8Array(32).fill(4),
    );
    events = [event([["a", ref]]), other, { ...event([]), id: "0".repeat(64) }];
    await connect();
    expect([...service.handlerPreferences$.value.keys()]).toEqual(["profile"]);
    expect(service.handlerPreferences$.value.get("profile")!.event.tags).toContainEqual(["a", ref]);
    expect(mocks.request).toHaveBeenCalledWith(
      ["wss://write.example.com/"],
      expect.objectContaining({ authors: [pubkey], kinds: [31129] }),
    );
  });

  it("keeps decrypted tags in memory only and clears them on logout", async () => {
    events = [event([], "ciphertext")];
    await connect();
    expect(service.handlerPreferences$.value.get("profile")!.locked).toBe(true);
    await service.unlockHandlerPreference("profile");
    expect(service.handlerPreferences$.value.get("profile")!.privateTags).toEqual([["a", ref]]);
    expect([...storage.values()].join("")).not.toContain(ref);
    active$.next(undefined);
    expect(service.handlerPreferences$.value.size).toBe(0);
  });

  it("preserves private entries and extension tags while saving a public option", async () => {
    events = [event([["extension", "keep"]], "ciphertext")];
    await connect();
    await service.saveHandlerEntry("profile", { reference: "a".repeat(64), private: false });
    expect(account.nip44.encrypt).toHaveBeenCalledWith(pubkey, JSON.stringify([["a", ref]]));
    expect(mocks.publish).toHaveBeenCalledWith(
      ["wss://write.example.com/"],
      expect.objectContaining({
        kind: 31129,
        content: "encrypted",
        tags: [
          ["d", "profile"],
          ["extension", "keep"],
          ["e", "a".repeat(64)],
        ],
      }),
    );
  });

  it("does not save locally when no relay accepts the event", async () => {
    await connect();
    mocks.publish.mockResolvedValue({ "wss://write": { ok: false } });
    await expect(service.saveHandlerEntry("profile", { reference: ref, private: false })).rejects.toThrow(
      "No relay accepted",
    );
    expect(service.handlerPreferences$.value.size).toBe(0);
  });

  it("rejects a signer returning modified preferences", async () => {
    await connect();
    account.signEvent.mockImplementation(async (template: EventTemplate) =>
      finalizeEvent({ ...template, content: "modified" }, key),
    );
    await expect(service.saveHandlerEntry("profile", { reference: ref, private: false })).rejects.toThrow(
      "unexpected event",
    );
    expect(mocks.publish).not.toHaveBeenCalled();
  });
});
