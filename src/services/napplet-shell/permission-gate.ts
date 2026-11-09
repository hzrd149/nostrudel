import { resolveCapabilitiesNap } from "@kehto/runtime";
import { originRegistry, type ShellAdapter, type ShellBridge } from "@kehto/shell";
import { logger } from "../../helpers/debug";
import { NAPPLET_PERMISSIONS, type NappletPermission } from "./permission-types";

const log = logger.extend("napplet-permission-gate");

export function messagePermission(message: { type: string }): NappletPermission | null {
  // Resource authorization depends on each URL, including mixed-kind batches and Blossom fallback.
  if (message.type.startsWith("resource.")) return null;
  if (message.type.startsWith("webrtc.")) return "webrtc:connect";
  if (/^common\.(follow|unfollow|react|report)$/.test(message.type)) return "relay:write";
  if (/^common\.(getProfile|follows)$/.test(message.type)) return "relay:read";
  if (/^identity\.(getPublicKey|getRelays)$/.test(message.type)) return "identity:read";
  const capability = resolveCapabilitiesNap(message).senderCap;
  return NAPPLET_PERMISSIONS.find((permission) => permission === capability) ?? null;
}

/** Check the registered window and its registration generation again after asynchronous consent. */
export function createPermissionGate(
  bridge: ShellBridge,
  authorize: (windowId: string, permission: NappletPermission, signal: AbortSignal) => Promise<boolean>,
  domains?: readonly string[],
) {
  let active = true;
  return {
    destroy() {
      active = false;
    },
    filterMessage: ((windowId, message) => {
      const source = originRegistry.getIframeWindow(windowId);
      if (!active || !source) return "drop";
      const generation = originRegistry.getRegistrationId(source);
      if (
        !windowId ||
        !message ||
        typeof message !== "object" ||
        Array.isArray(message) ||
        typeof message.type !== "string"
      )
        return "drop";
      if (message.type === "shell.ready") {
        return "dispatch";
      }
      if (domains && !domains.includes(message.type.split(".")[0])) return "drop";
      // Results and events are host-owned and must never cause a prompt or action from an iframe.
      if (/\.(result|error|event|changed|closed)$/.test(message.type)) return "drop";
      const permission = messagePermission(message);
      if (!permission) {
        return "dispatch";
      }
      const options = "options" in message ? (message.options as { timeoutMs?: number } | undefined) : undefined;
      const requested = options?.timeoutMs;
      const duration =
        requested && Number.isInteger(requested) && requested > 0 && requested <= 300000 ? requested : 30000;
      const started = Date.now();
      const respond = (allowed: boolean) => {
        if (
          !active ||
          originRegistry.getWindowId(source) !== windowId ||
          originRegistry.getRegistrationId(source) !== generation
        )
          return;
        if (allowed) {
          if (message.type === "cvm.request") {
            // Preserve CVM's total deadline after time spent obtaining runtime consent.
            const remaining = Math.max(1, duration - (Date.now() - started));
            bridge.runtime.handleMessage(windowId, { ...message, options: { ...options, timeoutMs: remaining } });
          } else bridge.runtime.handleMessage(windowId, message);
        } else if ("id" in message && typeof message.id === "string") {
          const target = originRegistry.getNappletTarget(windowId);
          if (message.type === "relay.subscribe" && "subId" in message)
            target?.postMessage({ type: "relay.closed", subId: message.subId, reason: "policy denied" });
          else if (message.type === "resource.bytes" || message.type === "resource.bytesMany")
            target?.postMessage({
              type: `${message.type}.error`,
              id: message.id,
              requestId: message.id,
              code: "denied",
              error: "blocked-by-policy",
              message: "Resource access denied",
            });
          else
            target?.postMessage({ type: `${message.type}.result`, id: message.id, ok: false, error: "policy denied" });
        }
      };
      void authorize(windowId, permission, AbortSignal.timeout(duration)).then(respond, (error) => {
        log("Permission request failed", error);
        respond(false);
      });
      return "drop";
    }) satisfies NonNullable<ShellAdapter["filterNappletMessage"]>,
  };
}
