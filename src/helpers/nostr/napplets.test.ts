import { NAPPLET_KIND_NAMED, NAPPLET_KIND_ROOT, NAPPLET_KIND_SNAPSHOT, computeAggregateHash } from "@kehto/nip";
import { bytesToHex } from "@noble/hashes/utils.js";
import { sha256 } from "@noble/hashes/sha2.js";
import { finalizeEvent } from "nostr-tools";
import { describe, expect, it, vi } from "vitest";

import { resolveNapplet } from "./napplet-resolve";
import {
  getNappletArchetypes,
  getNappletCoordinate,
  getNappletRequiredCapabilities,
  getUnsupportedNappletRequirements,
  isValidNappletStoreEvent,
  parseNappletManifest,
} from "./napplets";

const key = new Uint8Array(32).fill(1);
const html = new TextEncoder().encode("<!doctype html><title>Poly Dogfight</title>");
const htmlHash = bytesToHex(sha256(html));

function manifest(tags: string[][], kind = NAPPLET_KIND_NAMED) {
  return finalizeEvent({ kind, created_at: 100, tags, content: "A napplet" }, key);
}

// Mirrors the published "Poly Dogfight" manifest: one bare `x` tag and no `path` tags.
const singleFile = manifest([
  ["x", htmlHash],
  ["title", "Poly Dogfight"],
  ["server", "https://blossom.example.com"],
  ["t", "game"],
  ["d", "n-44f63e5422b"],
]);

describe("parseNappletManifest", () => {
  it("accepts a single-file manifest with a bare x tag", () => {
    const parsed = parseNappletManifest(singleFile);
    expect(parsed.paths).toEqual([{ path: "/index.html", sha256: htmlHash }]);
    expect(parsed.aggregateHash).toBe(htmlHash);
    expect(parsed.dTag).toBe("n-44f63e5422b");
    expect(parsed.description).toBe("A napplet");
    expect(isValidNappletStoreEvent(singleFile)).toBe(true);
  });

  it("rejects legacy path manifests with a declared aggregate", () => {
    const paths = [{ path: "/index.html", sha256: htmlHash }];
    const aggregate = computeAggregateHash(paths);
    const legacy = manifest([
      ["path", "/index.html", htmlHash],
      ["x", aggregate, "aggregate"],
      ["d", "a"],
    ]);
    expect(() => parseNappletManifest(legacy)).toThrow();
    expect(isValidNappletStoreEvent(legacy)).toBe(false);
  });

  it("rejects legacy path tags without an aggregate", () => {
    expect(() =>
      parseNappletManifest(
        manifest([
          ["path", "/index.html", htmlHash],
          ["d", "a"],
        ]),
      ),
    ).toThrow();
  });

  it("skips malformed archetype and intent tags instead of rejecting", () => {
    const event = manifest([
      ["x", htmlHash],
      ["d", "a"],
      ["z", "feed"],
      ["i", "napplet:feed/open"],
      ["i", "napplet:feed/edit", "filters", "relays"],
      ["i", "not-a-convention"],
      ["archetype", "Bad Slug", "napplet:x/y"],
    ]);
    expect(parseNappletManifest(event).archetypes).toEqual([
      { slug: "feed", convention: "napplet:feed/open", params: [] },
      { slug: "feed", convention: "napplet:feed/edit", params: ["filters", "relays"] },
    ]);
    expect(getNappletArchetypes(event)).toEqual([
      {
        name: "feed",
        contracts: [
          { convention: "napplet:feed/open", params: [] },
          { convention: "napplet:feed/edit", params: ["filters", "relays"] },
        ],
      },
    ]);
  });

  it("only accepts intents whose role is advertised by a z tag and ignores legacy archetype tags", () => {
    const event = manifest([
      ["x", htmlHash],
      ["d", "a"],
      ["z", "profile"],
      ["i", "napplet:profile/open", "pubkey"],
      ["i", "napplet:note/open"],
      ["archetype", "chat", "napplet:chat/open"],
    ]);
    expect(getNappletArchetypes(event)).toEqual([
      { name: "profile", contracts: [{ convention: "napplet:profile/open", params: ["pubkey"] }] },
    ]);
  });

  it("assigns publisher and kind safe catalog ids", () => {
    const named = manifest([
      ["x", htmlHash],
      ["d", "a"],
    ]);
    const root = manifest([["x", htmlHash]], NAPPLET_KIND_ROOT);
    const snapshot = manifest([["x", htmlHash]], NAPPLET_KIND_SNAPSHOT);
    expect(parseNappletManifest(named).catalogId).toBe(`nip5d:${NAPPLET_KIND_NAMED}:${named.pubkey}:a`);
    expect(parseNappletManifest(root).catalogId).toBe(`nip5d:${NAPPLET_KIND_ROOT}:${root.pubkey}`);
    expect(parseNappletManifest(snapshot).catalogId).toBe(`nip5d:${NAPPLET_KIND_SNAPSHOT}:${snapshot.id}`);
  });

  it("reads R and O domains, reporting only unsupported required ones", () => {
    const event = manifest([
      ["x", htmlHash],
      ["d", "a"],
      ["R", "relay"],
      ["R", "nope"],
      ["O", "theme"],
      ["O", "unknown"],
    ]);
    expect(parseNappletManifest(event).requires).toEqual(["relay", "nope"]);
    expect(getNappletRequiredCapabilities(event)).toEqual(["relay:read", "relay:write"]);
    expect(getUnsupportedNappletRequirements(event)).toEqual(["nope"]);
  });

  it("rejects manifests with nothing to load", () => {
    expect(() =>
      parseNappletManifest(
        manifest([
          ["x", "not-a-hash"],
          ["d", "a"],
        ]),
      ),
    ).toThrow();
    expect(() => parseNappletManifest(manifest([["x", htmlHash]], 1))).toThrow();
  });
});

describe("getNappletCoordinate", () => {
  it("resolves a snapshot to the napplet named in its a tag", () => {
    const pubkey = singleFile.pubkey;
    const snapshot = manifest(
      [
        ["x", htmlHash],
        ["a", `${NAPPLET_KIND_NAMED}:${pubkey}:n-44f63e5422b`],
      ],
      NAPPLET_KIND_SNAPSHOT,
    );

    expect(getNappletCoordinate(snapshot)).toEqual({ kind: NAPPLET_KIND_NAMED, pubkey, identifier: "n-44f63e5422b" });
  });

  it("resolves a snapshot of a root napplet to an empty identifier", () => {
    const pubkey = singleFile.pubkey;
    const snapshot = manifest(
      [
        ["x", htmlHash],
        ["a", `${NAPPLET_KIND_ROOT}:${pubkey}:`],
      ],
      NAPPLET_KIND_SNAPSHOT,
    );

    expect(getNappletCoordinate(snapshot)).toEqual({ kind: NAPPLET_KIND_ROOT, pubkey, identifier: "" });
  });

  it("returns undefined for a snapshot without a valid a tag", () => {
    expect(getNappletCoordinate(manifest([["x", htmlHash]], NAPPLET_KIND_SNAPSHOT))).toBeUndefined();
    expect(
      getNappletCoordinate(
        manifest(
          [
            ["x", htmlHash],
            ["a", `${NAPPLET_KIND_NAMED}:not-hex:d`],
          ],
          NAPPLET_KIND_SNAPSHOT,
        ),
      ),
    ).toBeUndefined();
  });
});

describe("resolveNapplet", () => {
  it("rejects legacy manifests before fetching artifact bytes", async () => {
    const fetchBlob = vi.fn(async () => html);
    const event = manifest([
      ["d", "legacy"],
      ["path", "/index.html", htmlHash],
      ["x", computeAggregateHash([{ path: "/index.html", sha256: htmlHash }]), "aggregate"],
    ]);
    await expect(resolveNapplet({ event, fetchBlob })).rejects.toThrow();
    expect(fetchBlob).not.toHaveBeenCalled();
  });

  it("loads a single-file napplet from its x blob", async () => {
    const resolved = await resolveNapplet({ event: singleFile, fetchBlob: async () => html });
    expect(resolved.indexHtml).toContain("Poly Dogfight");
    expect(resolved.aggregateHash).toBe(htmlHash);
    expect(resolved.dTag).toBe("n-44f63e5422b");
  });

  it("rejects a blob that does not match its hash", async () => {
    await expect(
      resolveNapplet({ event: singleFile, fetchBlob: async () => new TextEncoder().encode("tampered") }),
    ).rejects.toThrow(/does not match/);
  });
});
