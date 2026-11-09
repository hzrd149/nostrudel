import {
  getNappletIcon,
  getNappletParentPointer,
  getNappletServers,
  getNappletSource,
} from "applesauce-common/helpers";
import { DecodeResult, eventMatchesPointer, getTagValue, isReplaceable } from "applesauce-core/helpers";
import { Filter, nip19, NostrEvent } from "nostr-tools";
import { isAddressableKind } from "nostr-tools/kinds";
import {
  NAPPLET_KIND_NAMED,
  NAPPLET_KIND_ROOT,
  NAPPLET_KIND_SNAPSHOT,
  NappletResolutionError,
  getNappletCatalogId,
  isNappletManifestKind,
  parseNappletManifest as parseManifest,
  type NappletManifest,
} from "@kehto/nip";
import { ALL_CAPABILITIES, type Capability } from "@kehto/shell";

export { NAPPLET_KIND_NAMED, NAPPLET_KIND_ROOT, NAPPLET_KIND_SNAPSHOT, getNappletCatalogId, isNappletManifestKind };
export { getNappletIcon, getNappletServers, getNappletSource };

/** One accepted intent convention and the parameter names its `i` tag advertises */
export type NappletIntentContract = {
  convention: string;
  params: string[];
};

export type NappletArchetype = {
  name: string;
  contracts: NappletIntentContract[];
};

const CAPABILITIES = new Set<string>(ALL_CAPABILITIES);

const REQUIRED_CAPABILITY_MAP: Record<string, Capability[]> = {
  relay: ["relay:read", "relay:write"],
  outbox: ["outbox:read", "outbox:write"],
  cache: ["cache:read", "cache:write"],
  inc: [],
  state: ["state:read", "state:write"],
  storage: ["state:read", "state:write"],
  identity: ["identity:read"],
  keys: ["keys:bind", "keys:forward"],
  media: ["media:control"],
  notify: ["notify:send", "notify:channel"],
  notifications: ["notify:send", "notify:channel"],
  theme: ["theme:read"],
  config: ["config:read"],
  resource: ["resource:fetch"],
  cvm: ["cvm:call"],
  common: [],
  upload: ["upload:write"],
  intent: ["intent:read", "intent:write"],
  link: [],
};

const INTENT_CONVENTION = /^napplet:([a-z0-9][a-z0-9-]*)\/([a-z0-9][a-z0-9-]*)$/;

function tagValues(event: NostrEvent, name: string) {
  return event.tags.filter((t) => t[0] === name && t[1]).map((t) => t[1].trim());
}

/** Parse current NIP-5D manifests without enabling Kehto's legacy compatibility adapter. */
export function parseNappletManifest(event: NostrEvent): NappletManifest {
  const manifest = parseManifest(event);
  if (manifest.format !== "current") {
    throw new NappletResolutionError("invalid-manifest", "Legacy napplet manifests are not supported");
  }
  return manifest;
}

/** The identity permissions are granted to: one version of one napplet */
export function getNappletIdentity(event: NostrEvent) {
  const manifest = parseNappletManifest(event);
  return {
    pubkey: event.pubkey,
    dTag: manifest.dTag,
    aggregateHash: manifest.aggregateHash,
    title: getNappletTitle(event),
  };
}

export function validateNappletManifest(event: NostrEvent) {
  try {
    parseNappletManifest(event);
    return true;
  } catch {
    return false;
  }
}

export function getNappletTitle(event: NostrEvent) {
  return getTagValue(event, "title") || getTagValue(event, "name") || getTagValue(event, "d") || "Napplet";
}

export function getNappletDescription(event: NostrEvent) {
  return getTagValue(event, "description") || event.content || undefined;
}

export function getNappletHashtags(event: NostrEvent) {
  return Array.from(new Set(tagValues(event, "t").map((tag) => tag.toLowerCase())));
}

export function parseNappletPointer(value: string): DecodeResult | undefined {
  try {
    return nip19.decode(value.trim()) as DecodeResult;
  } catch {
    return undefined;
  }
}

// The three NIP-19 entities that can point to a napplet manifest event:
// note/nevent -> a snapshot/root/named event by id, naddr -> a root/named event by coordinate.
export function getNappletEventPointer(pointer: DecodeResult) {
  switch (pointer.type) {
    case "note":
    case "nevent":
    case "naddr":
      return pointer.data;
    default:
      return undefined;
  }
}

/** Whether an event is the one a napplet pointer names, so stale events from a previous route are ignored. */
export function nappletEventMatchesPointer(
  event: NostrEvent,
  pointer: NonNullable<ReturnType<typeof getNappletEventPointer>>,
) {
  return typeof pointer === "string" ? event.id === pointer : eventMatchesPointer(event, pointer);
}

export function getNappletNaddr(event: NostrEvent) {
  if (!isReplaceable(event.kind)) return undefined;

  // Root manifests are replaceable with no `d` tag, so their naddr has an empty identifier.
  if (!isAddressableKind(event.kind))
    return nip19.naddrEncode({ kind: event.kind, pubkey: event.pubkey, identifier: "" });

  const identifier = getTagValue(event, "d");
  if (!identifier) return undefined;

  return nip19.naddrEncode({ kind: event.kind, pubkey: event.pubkey, identifier });
}

/** Immutable snapshots open independently of their lineage's root or named manifest. */
export function getNappletAddress(event: NostrEvent) {
  return event.kind === NAPPLET_KIND_SNAPSHOT ? nip19.neventEncode({ id: event.id }) : getNappletNaddr(event);
}

/** Whether a manifest can be listed and opened: it has a manifest kind, parses, and has an naddr. */
export function isValidNappletStoreEvent(event: NostrEvent) {
  return isNappletManifestKind(event.kind) && validateNappletManifest(event) && !!getNappletNaddr(event);
}

export type NappletCoordinate = { kind: number; pubkey: string; identifier: string };

/**
 * The replaceable coordinate a napplet's releases live at — the anchor both the version
 * history and the snapshot list are queried from.
 *
 * A snapshot (kind 5129) is an immutable release and is forbidden from carrying a `d` tag,
 * so it has no coordinate of its own; it points back at the napplet it was cut from with an
 * `a` tag. Resolving through that tag means a running snapshot still shows the history and
 * sibling snapshots of its parent napplet.
 */
export function getNappletCoordinate(event: NostrEvent): NappletCoordinate | undefined {
  if (event.kind === NAPPLET_KIND_SNAPSHOT) {
    const parent = getNappletParentPointer(event);
    return parent && { kind: parent.kind, pubkey: parent.pubkey, identifier: parent.identifier };
  }

  if (isAddressableKind(event.kind)) {
    const identifier = getTagValue(event, "d");
    if (!identifier) return undefined;

    return { kind: event.kind, pubkey: event.pubkey, identifier };
  }

  // Root manifests are replaceable with no `d` tag — (kind, pubkey) is the whole coordinate.
  if (isReplaceable(event.kind)) return { kind: event.kind, pubkey: event.pubkey, identifier: "" };

  return undefined;
}

export function encodeNappletCoordinate({ kind, pubkey, identifier }: NappletCoordinate) {
  return `${kind}:${pubkey}:${identifier}`;
}

/**
 * Builds the filter used to query every historical version of a napplet's coordinate.
 * Intentionally matches the whole coordinate rather than a single event id, so relays that
 * retain overwritten versions of a replaceable event can answer with more than one event.
 */
export function getNappletHistoryFilter(event: NostrEvent): Filter | undefined {
  const coordinate = getNappletCoordinate(event);
  if (!coordinate) return undefined;

  const filter: Filter = { kinds: [coordinate.kind], authors: [coordinate.pubkey] };
  if (coordinate.identifier) filter["#d"] = [coordinate.identifier];

  return filter;
}

/**
 * Builds the filter for the immutable snapshot releases cut from a napplet's coordinate.
 * Snapshots reference their napplet with an `a` tag, which is the only link between the two
 * (they carry no `d` tag of their own).
 */
export function getNappletSnapshotsFilter(event: NostrEvent): Filter | undefined {
  const coordinate = getNappletCoordinate(event);
  if (!coordinate) return undefined;

  return { kinds: [NAPPLET_KIND_SNAPSHOT], "#a": [encodeNappletCoordinate(coordinate)] };
}

/** The action segment of a `napplet:<archetype>/<action>` convention */
export function getConventionAction(convention: string) {
  return INTENT_CONVENTION.exec(convention)?.[2];
}

export function getNappletArchetypes(event: NostrEvent): NappletArchetype[] {
  try {
    const archetypes = new Map<string, NappletIntentContract[]>();
    for (const { slug, convention, params } of parseNappletManifest(event).archetypes) {
      archetypes.set(slug, [...(archetypes.get(slug) ?? []), { convention, params }]);
    }
    return Array.from(archetypes, ([name, contracts]) => ({ name, contracts }));
  } catch {
    return [];
  }
}

/** The distinct actions an archetype entry accepts */
export function getArchetypeActions(archetype: NappletArchetype) {
  return Array.from(new Set(archetype.contracts.map((contract) => getConventionAction(contract.convention) ?? "")));
}

export function getNappletRequiredCapabilities(event: NostrEvent): Capability[] {
  const capabilities = new Set<Capability>();

  // `requires` is the legacy tag; NIP-5D declares required (`R`) and optional (`O`) NAP domains.
  for (const required of [...tagValues(event, "requires"), ...tagValues(event, "R")]) {
    if (CAPABILITIES.has(required)) capabilities.add(required as Capability);
    else for (const capability of REQUIRED_CAPABILITY_MAP[required] ?? []) capabilities.add(capability);
  }

  return Array.from(capabilities);
}

export function getUnsupportedNappletRequirements(event: NostrEvent) {
  // Missing optional (`O`) domains must never block loading, so only required ones are reported.
  return [...tagValues(event, "requires"), ...tagValues(event, "R")].filter(
    (required) => !CAPABILITIES.has(required) && !REQUIRED_CAPABILITY_MAP[required],
  );
}
