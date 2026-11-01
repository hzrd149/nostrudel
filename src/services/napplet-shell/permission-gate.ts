import { resolveCapabilitiesNap } from "@kehto/runtime";
import { originRegistry, type ShellBridge } from "@kehto/shell";
import { logger } from "../../helpers/debug";
import { NAPPLET_PERMISSIONS, type NappletPermission } from "./permission-types";

const log = logger.extend("napplet-permission-gate");

export function messagePermission(message: { type: string }): NappletPermission | null {
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
    handleMessage(event: MessageEvent) {
      if (!active || !event.source) return;
      const source = event.source as Window;
      const windowId = originRegistry.getWindowId(source);
      const generation = originRegistry.getRegistrationId(source);
      const message = event.data;
      if (
        !windowId ||
        !message ||
        typeof message !== "object" ||
        Array.isArray(message) ||
        typeof message.type !== "string"
      )
        return;
      if (message.type === "shell.ready") {
        bridge.handleMessage(event);
        return;
      }
      if (domains && !domains.includes(message.type.split(".")[0])) return;
      // Results and events are host-owned and must never cause a prompt or action from an iframe.
      if (/\.(result|error|event|changed|closed)$/.test(message.type)) return;
      const permission = messagePermission(message);
      if (!permission) {
        bridge.handleMessage(event);
        return;
      }
      const requested = message.options?.timeoutMs;
      const duration = Number.isInteger(requested) && requested > 0 && requested <= 300000 ? requested : 30000;
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
            bridge.handleMessage({
              source: event.source,
              origin: event.origin,
              data: { ...message, options: { ...message.options, timeoutMs: remaining } },
            } as MessageEvent);
          } else bridge.handleMessage(event);
        } else if (typeof message.id === "string") {
          if (message.type === "relay.subscribe")
            source.postMessage({ type: "relay.closed", subId: message.subId, reason: "policy denied" }, "*");
          else if (message.type === "resource.bytes" || message.type === "resource.bytesMany")
            source.postMessage(
              {
                type: `${message.type}.error`,
                id: message.id,
                requestId: message.id,
                code: "denied",
                error: "blocked-by-policy",
                message: "Resource access denied",
              },
              "*",
            );
          else
            source.postMessage(
              { type: `${message.type}.result`, id: message.id, ok: false, error: "policy denied" },
              "*",
            );
        }
      };
      void authorize(windowId, permission, AbortSignal.timeout(duration)).then(respond, (error) => {
        log("Permission request failed", error);
        respond(false);
      });
    },
  };
}
