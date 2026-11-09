import { finalizeEvent, nip19 } from "nostr-tools";
import { describe, expect, it } from "vitest";
import {
  editHandlerEntry,
  assertNappletEventKind,
  assertNappletDecryption,
  handlerAddress,
  handlerEntries,
  handlerPointer,
  handlerReference,
  preferredHandlerReferences,
  type HandlerPreference,
} from "../handler-preferences";

const pubkey = "a".repeat(64);
const first = `35129:${pubkey}:one`;
const second = `15129:${pubkey}:`;
const snapshot = "b".repeat(64);
function preference(tags: string[][], privateTags: string[][] = []): HandlerPreference {
  return {
    event: finalizeEvent(
      { kind: 31129, created_at: 1, tags: [["d", "profile"], ...tags], content: "" },
      new Uint8Array(32).fill(1),
    ),
    privateTags,
    locked: false,
  };
}

describe("handler preferences", () => {
  it("protects preference publishing and private self-decryption from generic napplet capabilities", () => {
    expect(() => assertNappletEventKind(31129)).toThrow("cannot modify handler preferences");
    expect(() => assertNappletEventKind(1)).not.toThrow();
    expect(() => assertNappletDecryption(pubkey, pubkey)).toThrow("cannot decrypt self-encrypted");
    expect(() => assertNappletDecryption("b".repeat(64), pubkey)).not.toThrow();
  });
  it("keeps all public and private alternatives regardless of installation", () => {
    const pref = preference(
      [
        ["a", first],
        ["e", snapshot],
      ],
      [["a", second]],
    );
    expect(handlerEntries(pref).map((entry) => entry.reference)).toEqual([first, snapshot, second]);
    expect(preferredHandlerReferences(pref, "napplet:profile/open", () => true)).toEqual([first, snapshot, second]);
  });

  it("ignores malformed tags individually and rejects query, fragment, and wrong-archetype identities", () => {
    const pref = preference([
      ["a", snapshot],
      ["e", first],
      ["a", "garbage"],
      ["unknown", first],
      ["i", "napplet:profile/open?x=1", first],
      ["i", "napplet:profile/open#x", first],
      ["i", "napplet:chat/open", first],
      ["i", "napplet:profile/open", first],
      ["e", snapshot, "wss://relay", pubkey],
    ]);
    expect(handlerEntries(pref)).toEqual([
      expect.objectContaining({ convention: "napplet:profile/open", reference: first }),
      expect.objectContaining({ reference: snapshot, relay: "wss://relay", author: pubkey }),
    ]);
  });

  it("uses all usable specific options, not archetype alternatives or private-first ranking", () => {
    const pref = preference(
      [
        ["a", second],
        ["i", "napplet:profile/edit", first],
      ],
      [["i", "napplet:profile/edit", snapshot]],
    );
    expect(preferredHandlerReferences(pref, "napplet:profile/edit", () => true)).toEqual([first, snapshot]);
    expect(preferredHandlerReferences(pref, "napplet:profile/edit", (ref) => ref === second)).toEqual([second]);
  });

  it("deduplicates candidates without hiding public/private preference entries", () => {
    const pref = preference([["a", first]], [["a", first]]);
    expect(handlerEntries(pref)).toHaveLength(2);
    expect(preferredHandlerReferences(pref, "napplet:profile/open", () => true)).toEqual([first]);
  });

  it("keeps public entries visible while private entries are locked", () => {
    const pref = { ...preference([["a", first]]), locked: true };
    expect(handlerEntries(pref)).toHaveLength(1);
  });

  it("preserves hints, unrelated intents, and extension tags when changing visibility", () => {
    const pref = preference([
      ["a", first, "wss://hint"],
      ["i", "napplet:profile/edit", second],
      ["extension", "value"],
    ]);
    const [tags, hidden] = editHandlerEntry(pref, { reference: first, private: true });
    expect(tags).toEqual([
      ["d", "profile"],
      ["i", "napplet:profile/edit", second],
      ["extension", "value"],
    ]);
    expect(hidden).toEqual([["a", first, "wss://hint"]]);
  });

  it("keeps snapshot ids distinct from coordinates and supports NIP-19 references", () => {
    expect(handlerPointer(`15129:${pubkey}:invalid`)).toBeUndefined();
    expect(handlerPointer(`35129:${pubkey}:`)).toBeUndefined();
    expect(handlerReference(handlerAddress(first)!)).toBe(first);
    expect(handlerReference(nip19.neventEncode({ id: snapshot }))).toBe(snapshot);
    expect(handlerReference(handlerAddress(second)!)).toBe(second);
  });
});
