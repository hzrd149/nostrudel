import type { Capability, ShellBridge } from "@kehto/shell";
import { beforeEach, describe, expect, it, vi } from "vitest";

import {
  addAlwaysAllowed,
  getAlwaysAllowed,
  grantCapabilities,
  hasApprovedCapability,
  isAlwaysAllowed,
  revokeAlwaysAllowed,
  revokeCapabilities,
  type NappletIdentity,
  registerWindowIdentity,
  unregisterWindowIdentity,
  getPermissionDecision,
  configureLaunchPermissions,
  getLaunchPermissions,
  setPermissionDecision,
} from "./permissions";

// The node environment has no browser storage, so install a minimal in-memory stub and reset it
// between tests so an always-allow entry written by one case cannot satisfy another.
function installLocalStorageStub() {
  const store = new Map<string, string>();
  const stub = {
    getItem: (key: string) => store.get(key) ?? null,
    setItem: (key: string, value: string) => void store.set(key, value),
    removeItem: (key: string) => void store.delete(key),
    clear: () => store.clear(),
  };
  vi.stubGlobal("localStorage", stub);
}

const identity: NappletIdentity = { pubkey: "pk-a", dTag: "app", aggregateHash: "hash-1" };
const relayWrite: Capability = "relay:write";
const stateWrite: Capability = "state:write";

function fakeBridge() {
  const grant = vi.fn();
  const bridge = { runtime: { aclState: { grant, revoke: vi.fn() } } } as unknown as ShellBridge;
  return { bridge, grant };
}

beforeEach(() => {
  installLocalStorageStub();
  // The module-level capability record persists across tests, so clear what each test may have granted.
  revokeCapabilities(identity);
  revokeCapabilities({ ...identity, pubkey: "pk-b" });
});

describe("capability decisions", () => {
  it("is closed by default: an identity with no recorded grant has no capability", () => {
    expect(hasApprovedCapability(identity, relayWrite)).toBe(false);
    expect(hasApprovedCapability(identity, stateWrite)).toBe(false);
  });

  it("reports true only for granted capabilities after a grant", () => {
    const { bridge } = fakeBridge();
    grantCapabilities(bridge, identity, [relayWrite]);

    expect(hasApprovedCapability(identity, relayWrite)).toBe(true);
    expect(hasApprovedCapability(identity, stateWrite)).toBe(false);
  });

  it("forwards each granted capability to the runtime with the identity fields", () => {
    const { bridge, grant } = fakeBridge();
    grantCapabilities(bridge, identity, [relayWrite, stateWrite]);

    expect(grant).toHaveBeenCalledWith(identity.pubkey, identity.dTag, identity.aggregateHash, "relay:read");
    expect(grant).toHaveBeenCalledWith(identity.pubkey, identity.dTag, identity.aggregateHash, relayWrite);
    expect(grant).toHaveBeenCalledWith(identity.pubkey, identity.dTag, identity.aggregateHash, stateWrite);
  });

  it("reports false again after revoking a previously granted capability", () => {
    const { bridge } = fakeBridge();
    grantCapabilities(bridge, identity, [relayWrite]);
    revokeCapabilities(identity);

    expect(hasApprovedCapability(identity, relayWrite)).toBe(false);
  });

  it("treats revoking an identity that was never granted as a no-op", () => {
    expect(() => revokeCapabilities({ ...identity, pubkey: "never-granted" })).not.toThrow();
  });
});

describe("identity keying", () => {
  it("keeps grants separate for identities differing in any one field", () => {
    const { bridge } = fakeBridge();
    grantCapabilities(bridge, identity, [relayWrite]);

    expect(hasApprovedCapability(identity, relayWrite)).toBe(true);
    expect(hasApprovedCapability({ ...identity, pubkey: "pk-b" }, relayWrite)).toBe(false);
    expect(hasApprovedCapability({ ...identity, dTag: "other" }, relayWrite)).toBe(false);
    expect(hasApprovedCapability({ ...identity, aggregateHash: "hash-2" }, relayWrite)).toBe(false);
  });

  it("ignores the display title when keying", () => {
    const { bridge } = fakeBridge();
    grantCapabilities(bridge, identity, [relayWrite]);

    expect(hasApprovedCapability({ ...identity, title: "Renamed" }, relayWrite)).toBe(true);
  });
});

describe("always-allow list", () => {
  it("reports an added identity as always-allowed", () => {
    addAlwaysAllowed(identity);

    expect(isAlwaysAllowed(identity)).toBe(true);
  });

  it("does not report an identity that was never added", () => {
    addAlwaysAllowed(identity);

    expect(isAlwaysAllowed({ ...identity, aggregateHash: "hash-2" })).toBe(false);
  });

  it("starts empty when nothing was stored", () => {
    expect(isAlwaysAllowed(identity)).toBe(false);
  });

  it("records the capabilities that were allowed", () => {
    addAlwaysAllowed(identity, [relayWrite]);

    expect(getAlwaysAllowed()).toMatchObject([{ ...identity, capabilities: [relayWrite] }]);
  });

  it("reads grants stored as bare identity keys", () => {
    localStorage.setItem("nostrudel:napplet:always-allow", JSON.stringify(["pk-a:app:with:colons:hash-1"]));

    expect(getAlwaysAllowed()).toMatchObject([{ pubkey: "pk-a", dTag: "app:with:colons", aggregateHash: "hash-1" }]);
  });

  it("revokes every version of a napplet and leaves other napplets alone", () => {
    addAlwaysAllowed(identity);
    addAlwaysAllowed({ ...identity, aggregateHash: "hash-2" });
    addAlwaysAllowed({ ...identity, dTag: "other" });

    revokeAlwaysAllowed(identity.pubkey, identity.dTag);

    expect(isAlwaysAllowed(identity)).toBe(false);
    expect(isAlwaysAllowed({ ...identity, aggregateHash: "hash-2" })).toBe(false);
    expect(isAlwaysAllowed({ ...identity, dTag: "other" })).toBe(true);
  });
});

describe("exact runtime ACL", () => {
  it("explicitly denies every unselected action, including an empty selection", () => {
    const { bridge } = fakeBridge();
    grantCapabilities(bridge, identity, []);
    expect(bridge.runtime.aclState.grant).not.toHaveBeenCalledWith(
      identity.pubkey,
      identity.dTag,
      identity.aggregateHash,
      relayWrite,
    );
    expect(bridge.runtime.aclState.revoke).toHaveBeenCalledWith(
      identity.pubkey,
      identity.dTag,
      identity.aggregateHash,
      relayWrite,
    );
  });
});

describe("managed permissions", () => {
  it("resets session-only grants as well as saved decisions", () => {
    const { bridge } = fakeBridge();
    registerWindowIdentity("session-only", identity);
    grantCapabilities(bridge, identity, ["cvm:call"]);
    revokeAlwaysAllowed(identity.pubkey, identity.dTag);
    expect(hasApprovedCapability(identity, "cvm:call")).toBe(false);
    unregisterWindowIdentity("session-only");
  });
  it("stores exact Allow, Ask and Block choices and preserves unrelated decisions", () => {
    setPermissionDecision(identity, "cvm:call", "allow");
    setPermissionDecision(identity, "webrtc:connect", "block");
    expect(getPermissionDecision(identity, "cvm:call")).toBe("allow");
    expect(getPermissionDecision(identity, "webrtc:connect")).toBe("block");
    setPermissionDecision(identity, "cvm:call", "ask");
    expect(getPermissionDecision(identity, "cvm:call")).toBe("ask");
    expect(getPermissionDecision(identity, "webrtc:connect")).toBe("block");
  });
});

describe("resource permissions and read defaults", () => {
  it("defaults only public reads to Allow, with HTTPS, Blossom and writes still Ask", () => {
    for (const permission of ["relay:read", "outbox:read", "resource:nostr"] as const)
      expect(getPermissionDecision(identity, permission)).toBe("allow");
    for (const permission of ["resource:https", "resource:blossom", "relay:write", "outbox:write"] as const)
      expect(getPermissionDecision(identity, permission)).toBe("ask");
    setPermissionDecision(identity, "relay:read", "ask");
    setPermissionDecision(identity, "outbox:read", "block");
    expect(getPermissionDecision(identity, "relay:read")).toBe("ask");
    expect(getPermissionDecision(identity, "outbox:read")).toBe("block");
  });
  it("does not expand a legacy broad resource Allow into HTTPS or Blossom grants", () => {
    localStorage.setItem(
      "nostrudel:napplet:always-allow",
      JSON.stringify([{ ...identity, capabilities: ["resource:fetch"] }]),
    );
    expect(getPermissionDecision(identity, "resource:https")).toBe("ask");
    expect(getPermissionDecision(identity, "resource:blossom")).toBe("ask");
    expect(getAlwaysAllowed()[0].capabilities).not.toContain("resource:fetch");
  });
  it("preserves a legacy broad resource Block across all three new kinds", () => {
    localStorage.setItem(
      "nostrudel:napplet:always-allow",
      JSON.stringify([{ ...identity, capabilities: [], deniedCapabilities: ["resource:fetch"] }]),
    );
    for (const permission of ["resource:nostr", "resource:https", "resource:blossom"] as const)
      expect(getPermissionDecision(identity, permission)).toBe("block");
  });
  it("keeps an unchecked default read permission at Ask for that opening", () => {
    configureLaunchPermissions(identity, ["relay:read", "outbox:read"]);
    expect(getPermissionDecision(identity, "resource:nostr")).toBe("ask");
    expect(getPermissionDecision(identity, "relay:read")).toBe("allow");
    expect(getLaunchPermissions(identity)).not.toContain("resource:nostr");
    registerWindowIdentity("launch", identity);
    unregisterWindowIdentity("launch");
    expect(getPermissionDecision(identity, "resource:nostr")).toBe("allow");
  });
});
