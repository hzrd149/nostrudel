import { nip19 } from "nostr-tools";
import { describe, expect, it } from "vitest";

import { parseNostrRepositoryUri } from "./git";

const pubkey = "a008def15796fba9a0d6fab04e8fd57089285d9fd505da5a83fe8aad57a3564d";
const npub = nip19.npubEncode(pubkey);

describe("parseNostrRepositoryUri", () => {
  it("parses an npub and identifier", () => {
    expect(parseNostrRepositoryUri(`nostr://${npub}/my%20%F0%9F%9A%80%20repo`)).toEqual({
      pubkey,
      identifier: "my 🚀 repo",
      relays: [],
    });
  });

  it("parses a relay hint without a scheme", () => {
    expect(parseNostrRepositoryUri(`nostr://${npub}/relay.ngit.dev/ngit`)).toEqual({
      pubkey,
      identifier: "ngit",
      relays: ["wss://relay.ngit.dev/"],
    });
  });

  it("parses a nip05 owner with an encoded relay hint", () => {
    expect(parseNostrRepositoryUri("nostr://danconwaydev.com/ws%3A%2F%2Flocalhost%3A7334/my-local-only-repo")).toEqual({
      nip05: "danconwaydev.com",
      identifier: "my-local-only-repo",
      relays: ["ws://localhost:7334/"],
    });
  });

  it("parses a repository naddr", () => {
    const naddr = nip19.naddrEncode({ kind: 30617, pubkey, identifier: "ngit", relays: ["wss://relay.ngit.dev/"] });
    expect(parseNostrRepositoryUri(`nostr://${naddr}`)).toEqual({
      pubkey,
      identifier: "ngit",
      relays: ["wss://relay.ngit.dev/"],
    });
  });

  it("rejects naddrs of other kinds and non-nostr URLs", () => {
    const naddr = nip19.naddrEncode({ kind: 30023, pubkey, identifier: "ngit" });
    expect(parseNostrRepositoryUri(`nostr://${naddr}`)).toBeUndefined();
    expect(parseNostrRepositoryUri("https://github.com/hzrd149/nostrudel")).toBeUndefined();
    expect(parseNostrRepositoryUri("nostr://not-a-key/ngit")).toBeUndefined();
  });
});
