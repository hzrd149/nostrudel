import { createWebrtcService } from "@kehto/services";
import { type WebrtcEvent } from "@napplet/core";

import { createSoyWebrtcSignaling } from "./soy-webrtc-signaling";
import { NappletWebrtc } from "./webrtc-session";
import type { WebrtcSignaling } from "./webrtc-signaling";

export type NappletWebrtcOptions = {
  resolveIdentity(windowId: string): string | undefined;
  requestConsent(windowId: string): Promise<boolean>;
  createSignaling?: (appIdentity: string) => WebrtcSignaling;
};

export function createNappletWebrtcService(options: NappletWebrtcOptions) {
  const windows = new Map<string, NappletWebrtc>();
  return createWebrtcService({
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
}
