import { ALL_CAPABILITIES, type ShellBridge } from "@kehto/shell";
import { map, Observable, startWith, Subject } from "rxjs";

import { logger } from "../../helpers/debug";

import { NAPPLET_PERMISSIONS, type NappletPermission, type PermissionDecision } from "./permission-types";

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
const approvedCapabilities = new Map<string, Set<NappletPermission>>();

export function identityKey(identity: NappletIdentity) {
  return `${identity.pubkey}:${identity.dTag}:${identity.aggregateHash}`;
}

export function hasApprovedCapability(identity: NappletIdentity, capability: NappletPermission) {
  return approvedCapabilities.get(identityKey(identity))?.has(capability) ?? false;
}

/** Saved Allow/Ask/Block defaults for one verified app version. */
export type AlwaysAllowedGrant = NappletIdentity & {
  capabilities: NappletPermission[];
  deniedCapabilities?: NappletPermission[];
  grantedAt: number;
};

const CAPABILITIES = new Set<unknown>(NAPPLET_PERMISSIONS);

function isCapability(value: unknown): value is NappletPermission {
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
  const { pubkey, dTag, aggregateHash, title, capabilities, deniedCapabilities, grantedAt } = value as Record<
    string,
    unknown
  >;
  if (typeof pubkey !== "string" || typeof dTag !== "string" || typeof aggregateHash !== "string") return [];

  return [
    {
      pubkey,
      dTag,
      aggregateHash,
      title: typeof title === "string" ? title : undefined,
      capabilities: Array.isArray(capabilities) ? capabilities.filter(isCapability) : [],
      deniedCapabilities: Array.isArray(deniedCapabilities) ? deniedCapabilities.filter(isCapability) : [],
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

export function addAlwaysAllowed(identity: NappletIdentity, capabilities: NappletPermission[] = []) {
  const key = identityKey(identity);
  writeAlwaysAllowed([
    ...getAlwaysAllowed().filter((grant) => identityKey(grant) !== key),
    { ...identity, capabilities, grantedAt: Math.round(Date.now() / 1000) },
  ]);
}

/** A saved entry skips the opening dialog; only its exact allowed capabilities are restored. */
export function isAlwaysAllowed(identity: NappletIdentity) {
  const key = identityKey(identity);
  return getAlwaysAllowed().some((grant) => identityKey(grant) === key);
}

/** Removes "always allow" from every version of a napplet; it asks again the next time it opens */
export function revokeAlwaysAllowed(pubkey: string, dTag: string) {
  const removed = getAlwaysAllowed().filter((grant) => grant.pubkey === pubkey && grant.dTag === dTag);
  writeAlwaysAllowed(getAlwaysAllowed().filter((grant) => grant.pubkey !== pubkey || grant.dTag !== dTag));
  const identities = new Map(
    [...removed, ...windowIdentities.values()]
      .filter((identity) => identity.pubkey === pubkey && identity.dTag === dTag)
      .map((identity) => [identityKey(identity), identity]),
  );
  for (const identity of identities.values()) {
    approvedCapabilities.delete(identityKey(identity));
    permissionChanges$.next({ identity });
  }
}

export function grantCapabilities(bridge: ShellBridge, identity: NappletIdentity, capabilities: NappletPermission[]) {
  // Kehto seeds the first ACL entry permissively. Explicitly remove every unselected capability.
  const selected = new Set(capabilities);
  for (const capability of ALL_CAPABILITIES) {
    if (selected.has(capability))
      bridge.runtime.aclState.grant(identity.pubkey, identity.dTag, identity.aggregateHash, capability);
    else bridge.runtime.aclState.revoke(identity.pubkey, identity.dTag, identity.aggregateHash, capability);
  }
  approvedCapabilities.set(identityKey(identity), new Set(capabilities));
  alwaysAllowedChanges$.next();
  log("granted capabilities", identityKey(identity), capabilities);
}

/** Clear session approvals without changing saved defaults. */
export function revokeCapabilities(identity: NappletIdentity) {
  approvedCapabilities.delete(identityKey(identity));
  alwaysAllowedChanges$.next();
  log("revoked capabilities", identityKey(identity));
}

export function registerWindowIdentity(windowId: string, identity: NappletIdentity) {
  windowIdentities.set(windowId, identity);
  alwaysAllowedChanges$.next();
}

export function getWindowIdentity(windowId: string) {
  return windowIdentities.get(windowId);
}

export function unregisterWindowIdentity(windowId: string) {
  const identity = windowIdentities.get(windowId);
  windowIdentities.delete(windowId);
  if (identity && ![...windowIdentities.values()].some((value) => identityKey(value) === identityKey(identity))) {
    approvedCapabilities.delete(identityKey(identity));
  }
  alwaysAllowedChanges$.next();
}

/** Runtime authority changes also invalidate pending consent and active service work. */
export const permissionChanges$ = new Subject<{ identity?: NappletIdentity; permission?: NappletPermission }>();

export function getPermissionDecision(identity: NappletIdentity, permission: NappletPermission): PermissionDecision {
  const entry = getAlwaysAllowed().find((grant) => identityKey(grant) === identityKey(identity));
  if (entry?.deniedCapabilities?.includes(permission)) return "block";
  if (entry?.capabilities.includes(permission)) return "allow";
  return "ask";
}

export function getSessionCapabilities(identity: NappletIdentity): NappletPermission[] {
  return [...(approvedCapabilities.get(identityKey(identity)) ?? [])];
}

export function setPermissionDecision(
  identity: NappletIdentity,
  permission: NappletPermission,
  decision: PermissionDecision,
) {
  const current = getAlwaysAllowed().find((grant) => identityKey(grant) === identityKey(identity));
  writeAlwaysAllowed([
    ...getAlwaysAllowed().filter((grant) => identityKey(grant) !== identityKey(identity)),
    {
      ...identity,
      grantedAt: Math.round(Date.now() / 1000),
      capabilities: [
        ...(current?.capabilities ?? []).filter((value) => value !== permission),
        ...(decision === "allow" ? [permission] : []),
      ],
      deniedCapabilities: [
        ...(current?.deniedCapabilities ?? []).filter((value) => value !== permission),
        ...(decision === "block" ? [permission] : []),
      ],
    },
  ]);
  approvedCapabilities.get(identityKey(identity))?.delete(permission);
  alwaysAllowedChanges$.next();
  permissionChanges$.next({ identity, permission });
}

export function synchronizePermissionStorage(event: StorageEvent) {
  if (event.key !== null && event.key !== ALWAYS_ALLOW_STORAGE_KEY) return;
  approvedCapabilities.clear();
  permissionChanges$.next({});
  alwaysAllowedChanges$.next();
}

/** Includes mounted apps so session grants can be managed without remembering the app. */
export const permissionEntries$: Observable<AlwaysAllowedGrant[]> = alwaysAllowedChanges$.pipe(
  startWith(undefined),
  map(() => {
    const entries = new Map(getAlwaysAllowed().map((entry) => [identityKey(entry), entry]));
    for (const identity of windowIdentities.values()) {
      if (!entries.has(identityKey(identity)))
        entries.set(identityKey(identity), { ...identity, capabilities: [], grantedAt: 0 });
    }
    return [...entries.values()];
  }),
);
