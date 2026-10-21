import { ALL_CAPABILITIES, type Capability, type ShellBridge } from "@kehto/shell";
import { map, Observable, startWith, Subject } from "rxjs";

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

/** A napplet version the user chose to always allow, and what it was allowed */
export type AlwaysAllowedGrant = NappletIdentity & { capabilities: Capability[]; grantedAt: number };

const CAPABILITIES = new Set<unknown>(ALL_CAPABILITIES);

function isCapability(value: unknown): value is Capability {
  return CAPABILITIES.has(value);
}

/** Parses a stored grant; older versions stored only the `pubkey:dTag:aggregateHash` key */
function parseGrant(value: unknown): AlwaysAllowedGrant[] {
  if (typeof value === "string") {
    const parts = value.split(":");
    if (parts.length < 3) return [];
    const pubkey = parts[0];
    const aggregateHash = parts[parts.length - 1];
    return [{ pubkey, dTag: parts.slice(1, -1).join(":"), aggregateHash, capabilities: [], grantedAt: 0 }];
  }

  if (!value || typeof value !== "object") return [];
  const { pubkey, dTag, aggregateHash, title, capabilities, grantedAt } = value as Record<string, unknown>;
  if (typeof pubkey !== "string" || typeof dTag !== "string" || typeof aggregateHash !== "string") return [];

  return [
    {
      pubkey,
      dTag,
      aggregateHash,
      title: typeof title === "string" ? title : undefined,
      capabilities: Array.isArray(capabilities) ? capabilities.filter(isCapability) : [],
      grantedAt: typeof grantedAt === "number" ? grantedAt : 0,
    },
  ];
}

export function getAlwaysAllowed(): AlwaysAllowedGrant[] {
  try {
    const parsed = JSON.parse(localStorage.getItem(ALWAYS_ALLOW_STORAGE_KEY) ?? "[]");
    return Array.isArray(parsed) ? parsed.flatMap(parseGrant) : [];
  } catch {
    return [];
  }
}

const alwaysAllowedChanges$ = new Subject<void>();

/** The always-allowed napplet versions, updated when one is added or revoked */
export const alwaysAllowed$: Observable<AlwaysAllowedGrant[]> = alwaysAllowedChanges$.pipe(
  startWith(undefined),
  map(getAlwaysAllowed),
);

function writeAlwaysAllowed(grants: AlwaysAllowedGrant[]) {
  localStorage.setItem(ALWAYS_ALLOW_STORAGE_KEY, JSON.stringify(grants));
  alwaysAllowedChanges$.next();
}

export function addAlwaysAllowed(identity: NappletIdentity, capabilities: Capability[] = []) {
  const key = identityKey(identity);
  writeAlwaysAllowed([
    ...getAlwaysAllowed().filter((grant) => identityKey(grant) !== key),
    { ...identity, capabilities, grantedAt: Math.round(Date.now() / 1000) },
  ]);
}

export function isAlwaysAllowed(identity: NappletIdentity) {
  const key = identityKey(identity);
  return getAlwaysAllowed().some((grant) => identityKey(grant) === key);
}

/** Removes "always allow" from every version of a napplet; it asks again the next time it opens */
export function revokeAlwaysAllowed(pubkey: string, dTag: string) {
  writeAlwaysAllowed(getAlwaysAllowed().filter((grant) => grant.pubkey !== pubkey || grant.dTag !== dTag));
}

export function grantCapabilities(bridge: ShellBridge, identity: NappletIdentity, capabilities: Capability[]) {
  for (const capability of capabilities) {
    bridge.runtime.aclState.grant(identity.pubkey, identity.dTag, identity.aggregateHash, capability);
  }
  approvedCapabilities.set(identityKey(identity), new Set(capabilities));
  log("granted capabilities", identityKey(identity), capabilities);
}

// Clears an identity's whole recorded capability set. This is the only way outside this module
// to remove a grant — the map itself is never exported, so every mutation goes through a named
// function. Deliberately narrow: it removes exactly the recorded set and nothing else. It does
// not remove individual capabilities, does not touch the always-allow storage entry, and does
// not call into the runtime's own access-control state — matching the deny path's previous
// direct `approvedCapabilities.delete(...)` behaviour exactly.
export function revokeCapabilities(identity: NappletIdentity) {
  approvedCapabilities.delete(identityKey(identity));
  log("revoked capabilities", identityKey(identity));
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
