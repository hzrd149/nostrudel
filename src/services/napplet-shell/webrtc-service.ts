import { createWebrtcService } from "@kehto/services";
import { type WebrtcEvent } from "@napplet/core";
import type { NostrEvent } from "nostr-tools";

import ignoreRelayErrors from "../../helpers/ignore-relay-errors";
import accounts from "../accounts";
import pool from "../pool";
import { getReadRelays, getWriteRelays } from "./relay-tiers";
import { NappletWebrtc } from "./webrtc-session";

export type NappletWebrtcOptions = {
  resolveIdentity(windowId: string): string | undefined;
  requestConsent(windowId: string): Promise<boolean>;
};

export function createNappletWebrtcService(options: NappletWebrtcOptions) {
  const windows = new Map<
    string,
    { account: NonNullable<typeof accounts.active>; backend: NappletWebrtc; unsubscribe: () => void }
  >();
  return createWebrtcService({
    open: async (request, context) => {
      if (typeof RTCPeerConnection === "undefined") throw new Error("WebRTC unavailable in this browser");
      const account = accounts.active;
      if (!account?.nip44) throw new Error("WebRTC requires an account with NIP-44 support");
      const identity = options.resolveIdentity(context.windowId);
      if (!identity) throw new Error("Napplet frame unavailable");
      let entry = windows.get(context.windowId);
      if (entry && entry.account !== account) {
        entry.unsubscribe();
        entry.backend.close("Account changed");
        windows.delete(context.windowId);
        entry = undefined;
      }
      if (!entry) {
        const backend = new NappletWebrtc(
          {
            getPublicKey: async () => account.pubkey,
            signEvent: account.signEvent.bind(account),
            nip44: account.nip44,
          },
          identity,
          {
            subscribe: (filters, receive) => {
              const sub = pool
                .subscription(getReadRelays(), filters)
                .pipe(ignoreRelayErrors("Napplet WebRTC signaling"))
                .subscribe((event) => {
                  if (typeof event !== "string") receive(event as NostrEvent);
                });
              return () => sub.unsubscribe();
            },
            publish: async (event) => {
              await pool.publish(getWriteRelays(), event);
            },
          },
          (message) => context.emit(message.event as WebrtcEvent),
          async () => {
            const allowed = await options.requestConsent(context.windowId);
            return allowed && accounts.active === account && options.resolveIdentity(context.windowId) === identity;
          },
          async () => ({ iceServers: [{ urls: "stun:stun.l.google.com:19302" }] }),
        );
        const sub = accounts.active$.subscribe((active) => {
          if (active !== account) {
            backend.close("Account changed");
            windows.delete(context.windowId);
            sub.unsubscribe();
          }
        });
        entry = { account, backend, unsubscribe: () => sub.unsubscribe() };
        windows.set(context.windowId, entry);
      }
      return entry.backend.handle({ type: "webrtc.open", request });
    },
    send: async (sessionId, payload, context) => {
      const entry = windows.get(context.windowId);
      if (!entry) throw new Error("WebRTC session unavailable");
      if (entry.account !== accounts.active) {
        entry.unsubscribe();
        entry.backend.close("Account changed");
        windows.delete(context.windowId);
        throw new Error("Account changed");
      }
      await entry.backend.handle({ type: "webrtc.send", sessionId, payload });
    },
    close: async (sessionId, reason, context) => {
      await windows.get(context.windowId)?.backend.handle({ type: "webrtc.close", sessionId, reason });
    },
    destroyWindow: (windowId) => {
      windows.get(windowId)?.unsubscribe();
      windows.get(windowId)?.backend.close();
      windows.delete(windowId);
    },
  });
}
