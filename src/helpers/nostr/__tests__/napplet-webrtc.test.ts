import type { NostrEvent } from "nostr-tools";
import { describe, expect, it } from "vitest";
import { getNappletWebrtcIdentity } from "../napplet-webrtc";

const author = "a".repeat(64);
function manifest(kind: number, tags: string[][] = []): NostrEvent {
  return { kind, tags, pubkey: author, id: "b".repeat(64), sig: "", content: "", created_at: 1 };
}
describe("Soy signaling namespaces", () => {
  it("keeps releases of the same app together and other apps separate", () => {
    const event = manifest(35129, [["d", "game"]]);
    expect(getNappletWebrtcIdentity(event)).toBe(`${author}:35129:game`);
    expect(getNappletWebrtcIdentity({ ...event, id: "c".repeat(64) })).toBe(getNappletWebrtcIdentity(event));
    expect(getNappletWebrtcIdentity(manifest(35129, [["d", "other"]]))).not.toBe(getNappletWebrtcIdentity(event));
    expect(getNappletWebrtcIdentity(manifest(15129))).toBe(`${author}:15129:`);
  });
  it("matches same-author legacy snapshots to their app and isolates other snapshots", () => {
    const address = `35129:${author}:game`;
    const legacy = manifest(5129, [
      ["path", "/index.html", "hash"],
      ["a", address],
    ]);
    expect(getNappletWebrtcIdentity(legacy)).toBe(`${author}:35129:game`);
    expect(getNappletWebrtcIdentity({ ...legacy, pubkey: "c".repeat(64) })).toBe(`${"c".repeat(64)}:5129:${address}`);
    const standalone = manifest(5129, [
      ["x", "hash"],
      ["a", address],
    ]);
    expect(getNappletWebrtcIdentity(standalone)).toBe(`${author}:5129:${standalone.id}`);
  });
});
