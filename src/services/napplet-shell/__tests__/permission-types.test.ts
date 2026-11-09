import type { NostrEvent } from "nostr-tools";
import { describe, expect, it } from "vitest";
import { getNappletPermissions } from "../permission-types";

const manifest = (tags: string[][]) => ({ tags }) as NostrEvent;

describe("launch permissions", () => {
  it("offers only required permissions, never optional or implicit public reads", () => {
    expect(getNappletPermissions(manifest([]))).toEqual([]);
    expect(
      getNappletPermissions(
        manifest([
          ["R", "theme"],
          ["O", "relay"],
          ["O", "webrtc"],
        ]),
      ),
    ).toEqual(["theme:read"]);
  });
  it("supports legacy requirements and expands required resource and WebRTC domains", () => {
    expect(
      getNappletPermissions(
        manifest([
          ["requires", "theme"],
          ["R", "resource"],
          ["R", "webrtc"],
        ]),
      ),
    ).toEqual(["theme:read", "resource:nostr", "resource:https", "resource:blossom", "webrtc:connect"]);
  });
  it("keeps a domain required when also declared optional", () => {
    expect(
      getNappletPermissions(
        manifest([
          ["R", "theme"],
          ["O", "theme"],
        ]),
      ),
    ).toEqual(["theme:read"]);
  });
});
