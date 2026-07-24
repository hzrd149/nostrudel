import { DecodeResult, getTagValue, isReplaceable } from "applesauce-core/helpers";
import { nip19, NostrEvent } from "nostr-tools";
import {
  NAPPLET_KIND_NAMED,
  NAPPLET_KIND_ROOT,
  NAPPLET_KIND_SNAPSHOT,
  isNappletManifestKind,
  parseNappletManifest,
} from "@kehto/nip";
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

export function conventionId(archetype: string, action: string) {
  return `napplet:${archetype}/${action}`;
}

export function intentTopic(archetype: string, action: string) {
  return `${archetype}:${action}`;
}

export function readyTopic(archetype: string) {
  return `${archetype}:ready`;
}

function actionFromProtocol(archetype: string, protocol: string) {
  const prefix = `napplet:${archetype}/`;
  if (!protocol.startsWith(prefix)) return undefined;

  const action = protocol.slice(prefix.length).trim();
  return action || undefined;
}

export function getNappletArchetypes(event: NostrEvent): NappletArchetype[] {
  const archetypes = new Map<string, Set<string>>();
  const protocolsByArchetype = new Map<string, Set<string>>();

  for (const tag of event.tags) {
    if (tag[0] !== "archetype" || !tag[1]) continue;

    const archetype = tag[1].trim();
    if (!archetype) continue;

    const actions = archetypes.get(archetype) ?? new Set<string>();
    const protocols = protocolsByArchetype.get(archetype) ?? new Set<string>();

    for (const value of tag.slice(2)) {
      const protocol = value.trim();
      if (!protocol) continue;
      const action = actionFromProtocol(archetype, protocol);
      if (action) {
        actions.add(action);
        protocols.add(protocol);
      }
    }

    if (actions.size === 0) {
      actions.add("open");
      protocols.add(conventionId(archetype, "open"));
    }

    archetypes.set(archetype, actions);
    protocolsByArchetype.set(archetype, protocols);
  }

  return Array.from(archetypes.entries()).map(([name, actions]) => ({
    name,
    actions: Array.from(actions),
    protocols: Array.from(protocolsByArchetype.get(name) ?? []),
  }));
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
