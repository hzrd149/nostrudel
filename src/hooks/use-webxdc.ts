import { useCallback, useEffect, useRef, useMemo, useState } from "react";
import { useActiveAccount } from "applesauce-react/hooks";
import { nip19, EventTemplate, NostrEvent } from "nostr-tools";
import type { Webxdc as WebxdcAPI, SendingStatusUpdate, ReceivedStatusUpdate, RealtimeListener } from "@webxdc/types";
import { onlyEvents } from "applesauce-relay";

import pool from "../services/pool";
import useUserProfile from "./use-user-profile";
import { useReadRelays } from "./use-client-relays";
import { usePublishEvent } from "../providers/global/publish-provider";
import { WEBXDC_UPDATE_KIND, WEBXDC_REALTIME_KIND } from "../helpers/nostr/webxdc";

/**
 * Subscribes to the persistent kind 4932 state-update events for this session and converts the
 * collected, deduplicated, `created_at`-ordered events into serial-numbered updates.
 *
 * Split out of `useWebxdcStateUpdates` (below) along its own internal seam — the subscription
 * effect and its memo own only `stateEvents` and never touch `listenerRef`/`lastSerialRef` — so
 * neither half of the state-updates sub-hook is left over the plain-function budget.
 */
function useWebxdcCollectedUpdates(uuid: string, relays: string[]): ReceivedStatusUpdate<unknown>[] {
  // Track all received state update events (for serial assignment + getAllUpdates)
  const [stateEvents, setStateEvents] = useState<NostrEvent[]>([]);

  // Subscribe to kind 4932 persistent state updates
  useEffect(() => {
    if (!uuid || relays.length === 0) return;

    const sub = pool
      .request(relays, [{ kinds: [WEBXDC_UPDATE_KIND], "#i": [uuid] }])
      .pipe(onlyEvents())
      .subscribe((event) => {
        setStateEvents((prev) => {
          // Deduplicate by event id
          const alreadyHave = prev.some((e) => e.id === event.id);
          if (alreadyHave) return prev;
          const next = [...prev, event].sort((a, b) => a.created_at - b.created_at);
          return next;
        });
      });

    return () => sub.unsubscribe();
  }, [uuid, relays]);

  // Convert events to ReceivedStatusUpdates with serial numbers
  return useMemo((): ReceivedStatusUpdate<unknown>[] => {
    return stateEvents.map((event, index) => {
      const serial = index + 1;
      let payload: unknown;
      try {
        payload = JSON.parse(event.content);
      } catch {
        payload = event.content;
      }

      const info = event.tags.find(([n]) => n === "info")?.[1];
      const document = event.tags.find(([n]) => n === "document")?.[1];
      const summary = event.tags.find(([n]) => n === "summary")?.[1];

      const update: ReceivedStatusUpdate<unknown> = {
        payload,
        serial,
        max_serial: stateEvents.length,
        ...(info && { info }),
        ...(document && { document }),
        ...(summary && { summary }),
      };
      return update;
    });
  }, [stateEvents]);
}

/**
 * Owns delivery of collected state updates to a caller-registered listener, and the setter /
 * getter surface consumers use to register that listener or read every update.
 *
 * The update-listener setter and the delivery effect are kept together here (along with
 * `getAllUpdates`) because both read and write `listenerRef`/`lastSerialRef`; splitting them
 * across hooks would leave a ref written in one place and read in another.
 */
function useWebxdcStateUpdates(uuid: string, relays: string[]) {
  const updates = useWebxdcCollectedUpdates(uuid, relays);

  // Track the update listener callback
  const listenerRef = useRef<((update: ReceivedStatusUpdate<unknown>) => void) | null>(null);
  const lastSerialRef = useRef(0);

  // Deliver new updates to listener when data changes
  useEffect(() => {
    if (!listenerRef.current || !updates.length) return;
    const listener = listenerRef.current;
    const lastSerial = lastSerialRef.current;

    for (const update of updates) {
      if (update.serial > lastSerial) {
        listener(update);
        lastSerialRef.current = update.serial;
      }
    }
  }, [updates]);

  const setUpdateListener = useCallback(
    async (cb: (update: ReceivedStatusUpdate<unknown>) => void, serial?: number): Promise<void> => {
      listenerRef.current = cb;
      lastSerialRef.current = serial ?? 0;

      // Deliver existing updates above the serial immediately
      for (const update of updates) {
        if (update.serial > (serial ?? 0)) {
          cb(update);
          lastSerialRef.current = update.serial;
        }
      }
    },
    [updates],
  );

  const getAllUpdates = useCallback(async (): Promise<ReceivedStatusUpdate<unknown>[]> => {
    return updates;
  }, [updates]);

  return { updates, setUpdateListener, getAllUpdates };
}

/**
 * Owns the ephemeral kind 20932 realtime channel: joining it, relaying inbound frames to the
 * caller-registered listener, and cleaning up on unmount.
 *
 * The joiner and the unmount cleanup effect are kept together here because both read and write
 * `realtimeActiveRef`/`realtimeAbortRef` — this is the sixth callback in the hook (alongside the
 * five shorter ones), the largest at 68 lines, and grouping it with the cleanup effect keeps the
 * active/abort refs single-owned.
 */
function useWebxdcRealtimeChannel(
  uuid: string,
  relays: string[],
  activePubkey: string,
  publish: ReturnType<typeof usePublishEvent>,
) {
  // Track whether a realtime channel is currently active
  const realtimeActiveRef = useRef(false);
  const realtimeAbortRef = useRef<AbortController | null>(null);

  // Clean up realtime subscription on unmount
  useEffect(() => {
    return () => {
      if (realtimeAbortRef.current) {
        realtimeAbortRef.current.abort();
        realtimeActiveRef.current = false;
      }
    };
  }, []);

  const joinRealtimeChannel = useCallback((): RealtimeListener => {
    if (realtimeActiveRef.current) {
      throw new Error("Already joined a realtime channel. Call leave() first.");
    }

    realtimeActiveRef.current = true;
    const abortController = new AbortController();
    realtimeAbortRef.current = abortController;

    let realtimeListener: ((data: Uint8Array) => void) | null = null;

    // Subscribe to ephemeral kind 20932 events for this UUID
    const sub = pool
      .request(relays, [{ kinds: [WEBXDC_REALTIME_KIND], "#i": [uuid], since: Math.floor(Date.now() / 1000) }])
      .pipe(onlyEvents())
      .subscribe((event) => {
        if (abortController.signal.aborted) return;
        // Don't echo back our own events
        if (event.pubkey === activePubkey) return;
        if (!realtimeListener) return;

        try {
          const binary = Uint8Array.from(atob(event.content), (c) => c.charCodeAt(0));
          realtimeListener(binary);
        } catch {
          // Ignore malformed content
        }
      });

    // Abort cancels the subscription
    abortController.signal.addEventListener("abort", () => {
      sub.unsubscribe();
    });

    return {
      setListener(listener: (data: Uint8Array) => void) {
        realtimeListener = listener;
      },
      send(data: Uint8Array) {
        if (!realtimeActiveRef.current) return;
        if (data.length > 128_000) {
          throw new Error("Realtime payload exceeds 128,000 byte limit");
        }

        let binary = "";
        for (let i = 0; i < data.length; i++) {
          binary += String.fromCharCode(data[i]);
        }
        const base64 = btoa(binary);

        const draft: EventTemplate = {
          kind: WEBXDC_REALTIME_KIND,
          content: base64,
          tags: [["i", uuid]],
          created_at: Math.floor(Date.now() / 1000),
        };

        publish("Webxdc realtime", draft, undefined, true).catch((err) => {
          console.error("Failed to publish webxdc realtime event:", err);
        });
      },
      leave() {
        realtimeActiveRef.current = false;
        abortController.abort();
        realtimeAbortRef.current = null;
      },
    };
  }, [uuid, relays, activePubkey, publish]);

  return joinRealtimeChannel;
}

/**
 * Creates a `Webxdc` API instance backed by Nostr kind 4932 state update events.
 *
 * - `sendUpdate()` publishes a kind 4932 event with an `i` tag referencing the UUID.
 * - `setUpdateListener()` / `getAllUpdates()` subscribe to kind 4932 events with `#i` = UUID,
 *   ordered by `created_at`, and assign serial numbers.
 *
 * @param uuid - The webxdc session UUID from the `webxdc` tag on the event.
 */
export function useWebxdc(uuid: string): WebxdcAPI<unknown> {
  const account = useActiveAccount();
  const profile = useUserProfile(account?.pubkey);
  const publish = usePublishEvent();
  const relays = useReadRelays();

  const activePubkey = account?.pubkey ?? "";

  const { setUpdateListener, getAllUpdates } = useWebxdcStateUpdates(uuid, relays);
  const joinRealtimeChannel = useWebxdcRealtimeChannel(uuid, relays, activePubkey, publish);

  const selfAddr = activePubkey ? nip19.npubEncode(activePubkey) : "anonymous";
  const selfName =
    profile?.display_name ||
    profile?.name ||
    (activePubkey ? nip19.npubEncode(activePubkey).slice(0, 12) : "Anonymous");

  const sendUpdate = useCallback(
    (update: SendingStatusUpdate<unknown>, _description: "") => {
      if (!uuid) return;
      const tags: string[][] = [
        ["i", uuid],
        ["alt", "Webxdc update"],
      ];
      if (update.info) tags.push(["info", update.info]);
      if (update.document) tags.push(["document", update.document]);
      if (update.summary) tags.push(["summary", update.summary]);

      const draft: EventTemplate = {
        kind: WEBXDC_UPDATE_KIND,
        content: JSON.stringify(update.payload),
        tags,
        created_at: Math.floor(Date.now() / 1000),
      };

      publish("Webxdc update", draft, undefined, true).catch((err) => {
        console.error("Failed to publish webxdc update:", err);
      });
    },
    [uuid, publish],
  );

  const sendToChat = useCallback(async (): Promise<void> => {
    throw new Error("sendToChat is not supported in Nostr");
  }, []);

  const importFiles = useCallback(async (): Promise<File[]> => {
    return [];
  }, []);

  return useMemo(
    (): WebxdcAPI<unknown> => ({
      selfAddr,
      selfName,
      sendUpdateInterval: 1000,
      sendUpdateMaxSize: 65536,
      sendUpdate,
      setUpdateListener,
      getAllUpdates,
      sendToChat,
      importFiles,
      joinRealtimeChannel,
    }),
    [selfAddr, selfName, sendUpdate, setUpdateListener, getAllUpdates, sendToChat, importFiles, joinRealtimeChannel],
  );
}

export default useWebxdc;
