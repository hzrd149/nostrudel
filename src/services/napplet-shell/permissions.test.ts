import type { Capability, ShellBridge } from "@kehto/shell";
import { beforeEach, describe, expect, it, vi } from "vitest";

import {
  addAlwaysAllowed,
  grantCapabilities,
  hasApprovedCapability,
  isAlwaysAllowed,
  revokeCapabilities,
  type NappletIdentity,
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
  const bridge = { runtime: { aclState: { grant } } } as unknown as ShellBridge;
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

    expect(grant).toHaveBeenCalledTimes(2);
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
});
