import { NAPPLET_KIND_NAMED } from "@kehto/nip";
import { finalizeEvent } from "nostr-tools";
import { beforeAll, describe, expect, it, vi } from "vitest";

import type { InstalledNapplet } from "./installed-napplets";

let service: typeof import("./installed-napplets");
let getInstalledNappletPath: typeof import("./installed-napplets").getInstalledNappletPath;

beforeAll(async () => {
  // The module reads localStorage and listens for storage events on load
  const store = new Map<string, string>();
  vi.stubGlobal("localStorage", {
    getItem: (key: string) => store.get(key) ?? null,
    setItem: (key: string, value: string) => store.set(key, value),
  });
  vi.stubGlobal("window", { addEventListener: () => {} });

  service = await import("./installed-napplets");
  ({ getInstalledNappletPath } = service);
});

function napplet(address: string, archetypes: string[]): InstalledNapplet {
  return {
    address,
    title: address,
    pubkey: "pubkey",
    archetypes: archetypes.map((name) => ({ name, actions: ["open"], protocols: [] })),
    installedAt: 1,
    lastOpenedAt: 1,
  };
}

describe("getInstalledNappletPath", () => {
  it("uses the archetype when no other installed napplet claims it", () => {
    const notes = napplet("naddr1notes", ["notes"]);
    expect(getInstalledNappletPath(notes, [notes, napplet("naddr1chat", ["chat"])])).toBe("/app/notes");
  });

  it("falls back to the naddr when the archetype is shared", () => {
    const a = napplet("naddr1a", ["app"]);
    const b = napplet("naddr1b", ["app"]);
    expect(getInstalledNappletPath(a, [a, b])).toBe("/app/naddr1a");
  });

  it("picks the first archetype that is not shared", () => {
    const a = napplet("naddr1a", ["app", "editor"]);
    const b = napplet("naddr1b", ["app"]);
    expect(getInstalledNappletPath(a, [a, b])).toBe("/app/editor");
  });
});

const key = new Uint8Array(32).fill(2);

function manifest(title: string, created_at: number) {
  return finalizeEvent(
    {
      kind: NAPPLET_KIND_NAMED,
      created_at,
      content: "",
      tags: [
        ["d", "app"],
        ["title", title],
        ["x", "0".repeat(64)],
      ],
    },
    key,
  );
}

describe("openInstalledNapplet", () => {
  it("refreshes stored details from a newer manifest and ignores older ones", () => {
    const address = service.installNapplet(manifest("First", 100))!.address;
    expect(service.getInstalledNapplet(address)?.openedVersion).toBeUndefined();

    service.openInstalledNapplet(manifest("Second", 200));
    expect(service.getInstalledNapplet(address)).toMatchObject({ title: "Second", openedVersion: 200 });

    service.openInstalledNapplet(manifest("Older", 150));
    expect(service.getInstalledNapplet(address)).toMatchObject({ title: "Second", openedVersion: 200 });
  });
});
