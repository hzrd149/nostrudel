import type { NostrEvent } from "nostr-tools";
import { getNappletRequiredCapabilities } from "../../helpers/nostr/napplets";
import { ALL_CAPABILITIES, type Capability } from "@kehto/shell";

export type NappletPermission = Capability | "webrtc:connect";
export type PermissionDecision = "ask" | "allow" | "block";
export const NAPPLET_PERMISSIONS: readonly NappletPermission[] = [...ALL_CAPABILITIES, "webrtc:connect"];

const labels: Partial<Record<NappletPermission, string>> = {
  "cache:read": "Read cached events",
  "cache:write": "Cache events",
  "hotkey:forward": "Use keyboard shortcuts",
  "keys:bind": "Register keyboard shortcuts",
  "keys:forward": "Receive keyboard input",
  "media:control": "Control media playback",
  "config:read": "Read app configuration",
  "fs:read": "Read app files",
  "fs:write": "Write app files",
  "relay:read": "Read relay events",
  "relay:write": "Publish relay events",
  "outbox:read": "Read events using outbox routing",
  "outbox:write": "Sign and publish events",
  "identity:read": "Read your identity and lists",
  "resource:fetch": "Fetch remote resources",
  "cvm:call": "Connect to ContextVM servers",
  "webrtc:connect": "Connect to peers (shares your IP address)",
  "state:read": "Read app storage",
  "state:write": "Write app storage",
  "upload:write": "Upload files",
  "notify:send": "Show notifications",
  "notify:channel": "Register notification channels",
  "dm:read": "Read private messages",
  "dm:write": "Send private messages",
  "theme:read": "Read the theme",
  "intent:read": "Find app handlers",
  "intent:write": "Open another app",
};
export function permissionLabel(permission: NappletPermission) {
  return labels[permission] ?? permission;
}

export function getNappletPermissions(event: NostrEvent): NappletPermission[] {
  const permissions: NappletPermission[] = getNappletRequiredCapabilities(event);
  if (event.tags.some((tag) => ["R", "O", "requires"].includes(tag[0]) && tag[1] === "webrtc"))
    permissions.push("webrtc:connect");
  return [...new Set(permissions)];
}
