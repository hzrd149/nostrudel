import { originRegistry, type ShellBridge } from "@kehto/shell";
import type { ServiceHandler } from "@kehto/runtime";
import {
  getAlwaysAllowed,
  getPermissionDecision,
  getSessionCapabilities,
  getWindowIdentity,
  grantCapabilities,
  identityKey,
  type NappletIdentity,
} from "./permissions";
import type { NappletPermission } from "./permission-types";

const SERVICE_DOMAINS: Partial<Record<NappletPermission, string[]>> = {
  "cvm:call": ["cvm"],
  "webrtc:connect": ["webrtc"],
  "resource:fetch": ["resource"],
  "relay:read": ["relay"],
  "outbox:read": ["outbox"],
  "identity:read": ["identity"],
};

/** Apply persisted authority to mounted frames without destroying their runtime registration. */
export function synchronizeRuntimePermissions(
  bridge: ShellBridge,
  services: Record<string, ServiceHandler | undefined>,
  change: { identity?: NappletIdentity; permission?: NappletPermission },
) {
  for (const windowId of originRegistry.getAllWindowIds()) {
    const identity = getWindowIdentity(windowId);
    if (!identity || (change.identity && identityKey(identity) !== identityKey(change.identity))) continue;
    const saved = getAlwaysAllowed().find((grant) => identityKey(grant) === identityKey(identity));
    grantCapabilities(bridge, identity, [
      ...new Set([...getSessionCapabilities(identity), ...(saved?.capabilities ?? [])]),
    ]);
    if (change.identity && change.permission && getPermissionDecision(change.identity, change.permission) === "allow")
      continue;
    const domains = change.permission ? (SERVICE_DOMAINS[change.permission] ?? []) : Object.keys(services);
    for (const domain of domains) services[domain]?.onWindowDestroyed?.(windowId);
  }
}
