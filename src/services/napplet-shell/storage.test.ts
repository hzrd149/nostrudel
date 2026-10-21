import { beforeEach, describe, expect, it, vi } from "vitest";

import { getNappletStorageEntries, removeNappletStorageEntries } from "./storage";

function installLocalStorageStub(values: Record<string, string>) {
  const store = new Map(Object.entries(values));
  vi.stubGlobal("localStorage", {
    get length() {
      return store.size;
    },
    key: (index: number) => Array.from(store.keys())[index] ?? null,
    getItem: (key: string) => store.get(key) ?? null,
    setItem: (key: string, value: string) => void store.set(key, value),
    removeItem: (key: string) => void store.delete(key),
  });
}

const pubkey = "pk";

beforeEach(() => {
  installLocalStorageStub({
    "napplet-state:game:h1:score": "10",
    "napplet-state:game:h2:@i/window-1:draft": "hello",
    "napplet-state:game:other-author-hash:score": "99",
    "napplet-state:pk:game:h0:legacy": "old",
    "napp-state:pk:game:h0:older": "older",
    "napplet-state:pk:other-game:h0:legacy": "not this app",
    "nostrudel:napplet:installed": "[]",
  });
});

describe("getNappletStorageEntries", () => {
  it("finds values from known versions and legacy pubkey-scoped keys", () => {
    const entries = getNappletStorageEntries(pubkey, "game", ["h1", "h2"]);

    expect(entries.map(({ key, aggregateHash, instance, value }) => ({ key, aggregateHash, instance, value }))).toEqual(
      [
        { key: "draft", aggregateHash: "h2", instance: true, value: "hello" },
        { key: "legacy", aggregateHash: "h0", instance: false, value: "old" },
        { key: "older", aggregateHash: "h0", instance: false, value: "older" },
        { key: "score", aggregateHash: "h1", instance: false, value: "10" },
      ],
    );
  });

  it("does not match unknown build hashes in the pubkey-less format", () => {
    const entries = getNappletStorageEntries(pubkey, "game", []);
    expect(entries.map((entry) => entry.key)).toEqual(["legacy", "older"]);
  });

  it("removes entries", () => {
    removeNappletStorageEntries(getNappletStorageEntries(pubkey, "game", ["h1", "h2"]));

    expect(getNappletStorageEntries(pubkey, "game", ["h1", "h2"])).toEqual([]);
    expect(localStorage.getItem("napplet-state:game:other-author-hash:score")).toBe("99");
  });
});
