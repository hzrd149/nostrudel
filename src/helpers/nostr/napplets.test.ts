import { NAPPLET_KIND_NAMED, computeAggregateHash } from "@kehto/nip";
import { bytesToHex } from "@noble/hashes/utils.js";
import { sha256 } from "@noble/hashes/sha2.js";
import { finalizeEvent } from "nostr-tools";
import { describe, expect, it } from "vitest";

import { resolveNapplet } from "./napplet-resolve";
import {
  getNappletArchetypes,
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

  it("keeps a legacy declared aggregate", () => {
    const paths = [{ path: "/index.html", sha256: htmlHash }];
    const aggregate = computeAggregateHash(paths);
    const parsed = parseNappletManifest(
      manifest([
        ["path", "/index.html", htmlHash],
        ["x", aggregate, "aggregate"],
        ["d", "a"],
      ]),
    );
    expect(parsed.paths).toEqual(paths);
    expect(parsed.aggregateHash).toBe(aggregate);
  });

  it("computes the aggregate for legacy path tags without one", () => {
    const parsed = parseNappletManifest(
      manifest([
        ["path", "/index.html", htmlHash],
        ["d", "a"],
      ]),
    );
    expect(parsed.aggregateHash).toBe(computeAggregateHash([{ path: "/index.html", sha256: htmlHash }]));
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
      { slug: "feed", convention: "napplet:feed/open" },
      { slug: "feed", convention: "napplet:feed/edit" },
    ]);
    expect(getNappletArchetypes(event)).toEqual([
      { name: "feed", actions: ["open", "edit"], protocols: ["napplet:feed/open", "napplet:feed/edit"] },
    ]);
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
    expect(getNappletRequiredCapabilities(event)).toEqual(["relay:read", "relay:write", "theme:read"]);
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

describe("resolveNapplet", () => {
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
