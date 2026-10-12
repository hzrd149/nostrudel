import { describe, expect, it } from "vitest";

import { getCorsTestUrl, getNip05WellKnownUrl } from "./nip05";

describe("nip05 urls", () => {
  it("builds the well-known url for a name at a domain", () => {
    expect(getNip05WellKnownUrl("bob", "example.com")).toBe("https://example.com/.well-known/nostr.json?name=bob");
  });

  it("keeps the root identifier name unencoded", () => {
    expect(getNip05WellKnownUrl("_", "example.com")).toBe("https://example.com/.well-known/nostr.json?name=_");
  });

  it("wraps the cors-test target in encodeURIComponent", () => {
    expect(getCorsTestUrl("https://example.com/.well-known/nostr.json?name=bob")).toBe(
      "https://cors-test.codehappy.dev/?url=https%3A%2F%2Fexample.com%2F.well-known%2Fnostr.json%3Fname%3Dbob&method=get",
    );
  });
});
