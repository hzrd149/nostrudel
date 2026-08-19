import { DecodeResult, getTagValue, isReplaceable } from "applesauce-core/helpers";
import { Filter, nip19, NostrEvent } from "nostr-tools";
import { isAddressableKind } from "nostr-tools/kinds";
import {
  NAPPLET_KIND_NAMED,
  NAPPLET_KIND_ROOT,
  NAPPLET_KIND_SNAPSHOT,
  isNappletManifestKind,
  parseNappletManifest,
} from "@kehto/nip";
import { manifestToIntentCatalogEntry } from "@kehto/services";
import { ALL_CAPABILITIES, type Capability } from "@kehto/shell";

export { NAPPLET_KIND_NAMED, NAPPLET_KIND_ROOT, NAPPLET_KIND_SNAPSHOT, isNappletManifestKind };

export type NappletArchetype = {
  name: string;
  actions: string[];
  protocols: string[];
};

export type NappletIntent = {
  archetype: string;
  action: string;
  payload: Record<string, string>;
};

export const NAPPLET_INTENT_PARAM = "intent";

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

export function getNappletNaddr(event: NostrEvent) {
  if (!isReplaceable(event.kind)) return undefined;

  const identifier = getTagValue(event, "d");
  if (!identifier) return undefined;

  return nip19.naddrEncode({ kind: event.kind, pubkey: event.pubkey, identifier });
}

export function encodeNappletIntent(intent: NappletIntent) {
  return encodeURIComponent(JSON.stringify(intent));
}

export function parseNappletIntent(value: string | null): NappletIntent | undefined {
  if (!value) return undefined;

  try {
    let decoded: unknown;
    try {
      decoded = JSON.parse(value) as unknown;
    } catch {
      decoded = JSON.parse(decodeURIComponent(value)) as unknown;
    }
    if (!decoded || typeof decoded !== "object") return undefined;

    const { archetype, action, payload } = decoded as Record<string, unknown>;
    if (typeof archetype !== "string" || typeof action !== "string") return undefined;

    const cleanPayload: Record<string, string> = {};
    if (payload && typeof payload === "object") {
      for (const [key, item] of Object.entries(payload as Record<string, unknown>)) {
        if (typeof item === "string") cleanPayload[key] = item;
      }
    }

    return { archetype, action, payload: cleanPayload };
  } catch {
    return undefined;
  }
}

export function getNappletDTag(event: NostrEvent) {
  return getTagValue(event, "d") || event.id;
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
    const address = getTagValue(event, "a");
    if (!address) return undefined;

    const [kind, pubkey, identifier = ""] = address.split(":");
    const parsed = Number(kind);
    if (!Number.isFinite(parsed) || !pubkey) return undefined;

    return { kind: parsed, pubkey, identifier };
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

export function conventionId(archetype: string, action: string) {
  return `napplet:${archetype}/${action}`;
}

export function intentTopic(archetype: string, action: string) {
  return `${archetype}:${action}`;
}

export function readyTopic(archetype: string) {
  return `${archetype}:ready`;
}

export function getNappletArchetypes(event: NostrEvent): NappletArchetype[] {
  try {
    const manifest = parseNappletManifest(event);
    const catalog = manifestToIntentCatalogEntry(manifest);

    return Object.entries(catalog.archetypes).map(([name, support]) => ({
      name,
      actions: support.actions,
      protocols: support.conventions,
    }));
  } catch {
    return [];
  }
}

export function getNappletRequiredCapabilities(event: NostrEvent): Capability[] {
  const capabilities = new Set<Capability>();

  for (const tag of event.tags) {
    if (tag[0] !== "requires" || !tag[1]) continue;

    const required = tag[1].trim();
    if (CAPABILITIES.has(required)) capabilities.add(required as Capability);
    else for (const capability of REQUIRED_CAPABILITY_MAP[required] ?? []) capabilities.add(capability);
  }

  return Array.from(capabilities);
}

export function getUnsupportedNappletRequirements(event: NostrEvent) {
  return event.tags
    .filter((tag) => tag[0] === "requires" && tag[1])
    .map((tag) => tag[1].trim())
    .filter((required) => !CAPABILITIES.has(required) && !REQUIRED_CAPABILITY_MAP[required]);
}
