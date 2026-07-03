import { getTagValue } from "applesauce-core/helpers";
import { NostrEvent } from "nostr-tools";
import {
  NAPPLET_KIND_NAMED,
  NAPPLET_KIND_ROOT,
  NAPPLET_KIND_SNAPSHOT,
  isNappletManifestKind,
  parseNappletManifest,
} from "@kehto/nip";
import { ALL_CAPABILITIES, type Capability } from "@kehto/shell";

export { NAPPLET_KIND_NAMED, NAPPLET_KIND_ROOT, NAPPLET_KIND_SNAPSHOT, isNappletManifestKind };

const CAPABILITIES = new Set<string>(ALL_CAPABILITIES);

const REQUIRED_CAPABILITY_MAP: Record<string, Capability[]> = {
  relay: ["relay:read", "relay:write"],
  outbox: ["outbox:read", "outbox:write"],
  cache: ["cache:read", "cache:write"],
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
  upload: ["upload:write"],
  intent: ["intent:read", "intent:write"],
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
