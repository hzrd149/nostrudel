import type { Capability, ShellBridge } from "@kehto/shell";

import { logger } from "../../helpers/debug";

const log = logger.extend("napplet-shell-permissions");

export type NappletIdentity = {
  pubkey: string;
  dTag: string;
  aggregateHash: string;
  title?: string;
};

const ALWAYS_ALLOW_STORAGE_KEY = "nostrudel:napplet:always-allow";

const windowIdentities = new Map<string, NappletIdentity>();

// The kehto runtime's ACL defaults to a permissive policy, so an identity with no entry
// passes every capability check, and the first grant seeds every capability at once. That
// makes the runtime unable to report which capabilities the user actually approved, so the
// shell keeps its own record here of the capability set granted per napplet identity.
const approvedCapabilities = new Map<string, Set<Capability>>();

function identityKey(identity: NappletIdentity) {
  return `${identity.pubkey}:${identity.dTag}:${identity.aggregateHash}`;
}

export function hasApprovedCapability(identity: NappletIdentity, capability: Capability) {
  return approvedCapabilities.get(identityKey(identity))?.has(capability) ?? false;
}

function getAlwaysAllowed() {
  try {
    return JSON.parse(localStorage.getItem(ALWAYS_ALLOW_STORAGE_KEY) ?? "[]") as string[];
  } catch {
    return [];
  }
}

export function addAlwaysAllowed(identity: NappletIdentity) {
  const allowed = new Set(getAlwaysAllowed());
  allowed.add(identityKey(identity));
  localStorage.setItem(ALWAYS_ALLOW_STORAGE_KEY, JSON.stringify(Array.from(allowed)));
}

export function isAlwaysAllowed(identity: NappletIdentity) {
  return getAlwaysAllowed().includes(identityKey(identity));
}

export function grantCapabilities(bridge: ShellBridge, identity: NappletIdentity, capabilities: Capability[]) {
  for (const capability of capabilities) {
    bridge.runtime.aclState.grant(identity.pubkey, identity.dTag, identity.aggregateHash, capability);
  }
  approvedCapabilities.set(identityKey(identity), new Set(capabilities));
  log("granted capabilities", identityKey(identity), capabilities);
}

// Transitional accessor for the provider's deny path: clears an identity's approved-capability
// entry without exposing the map itself. Plan 05-10 Task 2 promotes this into the named
// `revokeCapabilities` API positioned beside `grantCapabilities`.
export function clearApprovedCapabilities(identity: NappletIdentity) {
  approvedCapabilities.delete(identityKey(identity));
  log("cleared capabilities", identityKey(identity));
}

export function registerWindowIdentity(windowId: string, identity: NappletIdentity) {
  windowIdentities.set(windowId, identity);
}

export function getWindowIdentity(windowId: string) {
  return windowIdentities.get(windowId);
}

export function unregisterWindowIdentity(windowId: string) {
  windowIdentities.delete(windowId);
}
