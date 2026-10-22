import { getAppDataEncryption, unlockAppData } from "applesauce-common/helpers/app-data";
import { PrivateKeySigner } from "applesauce-signers";
import { describe, expect, it } from "vitest";

import {
  createNappletSyncEvent,
  NAPPLET_SYNC_IDENTIFIER,
  isSameNappletSyncData,
  mergeNappletSyncData,
  parseNappletSyncData,
  type NappletSyncData,
  type SyncedNapplet,
} from "./napplet-sync";

function napplet(address: string): SyncedNapplet {
  return { address, title: address, pubkey: "pubkey", archetypes: [], installedAt: 1 };
}

function data(addresses: string[], handlers: Record<string, string> = {}): NappletSyncData {
  return { installed: addresses.map(napplet), handlers };
}

const addresses = (result: NappletSyncData) => result.installed.map((item) => item.address).sort();

describe("mergeNappletSyncData", () => {
  it("keeps installs and uninstalls made on another device", () => {
    const merged = mergeNappletSyncData(data(["a", "b"]), data(["a", "b"]), data(["b", "c"]));
    expect(addresses(merged)).toEqual(["b", "c"]);
  });

  it("replays local installs and uninstalls on top of the remote list", () => {
    const merged = mergeNappletSyncData(data(["a", "b"]), data(["b", "d"]), data(["a", "b", "c"]));
    expect(addresses(merged)).toEqual(["b", "c", "d"]);
  });

  it("adds every device install when the account has never synced", () => {
    const merged = mergeNappletSyncData(data([]), data(["a"]), data(["b"]));
    expect(addresses(merged)).toEqual(["a", "b"]);
  });

  it("prefers local handler changes and keeps remote ones otherwise", () => {
    const merged = mergeNappletSyncData(
      data(["a", "b"], { notes: "a", chat: "a" }),
      data(["a", "b"], { notes: "b", chat: "a" }),
      data(["a", "b"], { notes: "a", chat: "b" }),
    );
    expect(merged.handlers).toEqual({ notes: "b", chat: "b" });
  });

  it("drops handlers for apps that are no longer installed", () => {
    const merged = mergeNappletSyncData(data(["a"], { notes: "a" }), data(["a"], { notes: "a" }), data([]));
    expect(merged).toEqual(data([]));
  });
});

describe("parseNappletSyncData", () => {
  it("drops malformed entries and handlers", () => {
    expect(
      parseNappletSyncData({
        installed: [napplet("a"), { address: "b" }, null],
        handlers: { notes: "a", bad: 1 },
      }),
    ).toEqual(data(["a"], { notes: "a" }));
    expect(parseNappletSyncData("nope")).toEqual(data([]));
  });

  it("migrates per-action handler choices to one per archetype, preferring open", () => {
    expect(
      parseNappletSyncData({ installed: [], handlers: { "notes/edit": "a", "notes/open": "b", "chat/send": "c" } })
        .handlers,
    ).toEqual({ notes: "b", chat: "c" });
  });

  it("migrates archetypes stored as bare conventions to contracts", () => {
    const legacy = {
      ...napplet("a"),
      archetypes: [{ name: "notes", actions: ["open"], protocols: ["napplet:notes/open"] }],
    };
    expect(parseNappletSyncData({ installed: [legacy], handlers: {} }).installed[0].archetypes).toEqual([
      { name: "notes", contracts: [{ convention: "napplet:notes/open", params: [] }] },
    ]);
  });
});

describe("isSameNappletSyncData", () => {
  it("ignores order", () => {
    expect(isSameNappletSyncData(data(["a", "b"], { x: "a", y: "b" }), data(["b", "a"], { y: "b", x: "a" }))).toBe(
      true,
    );
    expect(isSameNappletSyncData(data(["a"]), data(["a"], { x: "a" }))).toBe(false);
  });
});

describe("createNappletSyncEvent", () => {
  it("encrypts the list to the signer so only they can read it", async () => {
    const signer = new PrivateKeySigner();
    const synced = data(["a"], { notes: "a" });
    const event = await createNappletSyncEvent(signer, synced);

    expect(event.kind).toBe(30078);
    expect(event.tags).toContainEqual(["d", NAPPLET_SYNC_IDENTIFIER]);
    expect(event.content).not.toContain("notes");
    expect(getAppDataEncryption(event)).toBe("nip44");

    // Drop the plaintext cached at creation to force a real decrypt
    const reloaded = JSON.parse(JSON.stringify(event));
    expect(parseNappletSyncData(await unlockAppData(reloaded, signer))).toEqual(synced);
  });
});
