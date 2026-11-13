import type { ApprovalSignal, ServiceHandler, ServiceRuntimeContext } from "@kehto/runtime";
import { createWebrtcService } from "@kehto/services";
import { type WebrtcEvent, type WebrtcOpenRequest } from "@napplet/core";

import { unique } from "../../helpers/array";
import { getReadRelays, getWriteRelays } from "./relay-tiers";
import { createSoyWebrtcSignaling } from "./soy-webrtc-signaling";
import { NappletWebrtc } from "./webrtc-session";
import type { WebrtcSignaling } from "./webrtc-signaling";

export type NappletWebrtcOptions = {
  resolveIdentity(windowId: string): string | undefined;
  requestConsent(windowId: string): Promise<boolean>;
  createSignaling?: (appIdentity: string) => WebrtcSignaling;
};

const NEVER_ABORTED: ApprovalSignal = { aborted: false, addEventListener() {}, removeEventListener() {} };

/**
 * noStrudel gates `webrtc.*` with its own `webrtc:connect` permission before the service sees the message,
 * so when the runtime has no kehto permission adapter the approved open runs directly instead of failing closed.
 */
const authorizeGatedOperation: NonNullable<ServiceRuntimeContext["authorizeOperation"]> = async (
  _windowId,
  _operation,
  _requirements,
  execute,
  signal,
) => ({ status: "executed", value: await execute(signal ?? NEVER_ABORTED) });

function webrtcResource(request: WebrtcOpenRequest) {
  return request.scope.type === "room" ? `room:${request.scope.room}` : `direct:${request.scope.pubkey}`;
}

export function createNappletWebrtcService(options: NappletWebrtcOptions): ServiceHandler {
  const windows = new Map<string, NappletWebrtc>();
  const service = createWebrtcService({
    // Soy signaling publishes and subscribes on the shell's napplet relay tiers.
    planOpen: (request) => ({
      signalingRelayUrls: unique([...getReadRelays(), ...getWriteRelays()]),
      iceEndpoints: [],
      resource: webrtcResource(request),
    }),
    open: async (request, context) => {
      if (typeof RTCPeerConnection === "undefined") throw new Error("WebRTC unavailable in this browser");
      const identity = options.resolveIdentity(context.windowId);
      if (!identity) throw new Error("Napplet frame unavailable");
      let entry = windows.get(context.windowId);
      if (!entry) {
        const backend = new NappletWebrtc(
          (options.createSignaling ?? createSoyWebrtcSignaling)(identity),
          (message) => context.emit(message.event as WebrtcEvent),
          async () => {
            const allowed = await options.requestConsent(context.windowId);
            return allowed && options.resolveIdentity(context.windowId) === identity;
          },
          async () => ({ iceServers: [{ urls: "stun:stun.l.google.com:19302" }] }),
        );
        entry = backend;
        windows.set(context.windowId, entry);
      }
      return entry.handle({ type: "webrtc.open", request });
    },
    send: async (sessionId, payload, context) => {
      const entry = windows.get(context.windowId);
      if (!entry) throw new Error("WebRTC session unavailable");
      await entry.handle({ type: "webrtc.send", sessionId, payload });
    },
    close: async (sessionId, reason, context) => {
      await windows.get(context.windowId)?.handle({ type: "webrtc.close", sessionId, reason });
    },
    destroyWindow: (windowId) => {
      windows.get(windowId)?.close();
      windows.delete(windowId);
    },
  });
  return {
    ...service,
    onRegistered: (context) =>
      service.onRegistered?.(
        context.authorizeOperation ? context : { ...context, authorizeOperation: authorizeGatedOperation },
      ),
  };
}
