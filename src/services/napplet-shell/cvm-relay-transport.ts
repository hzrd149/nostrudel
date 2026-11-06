import { RelayPool, type RelayAuthContext } from "applesauce-relay";
import { verifyEvent, type Filter, type NostrEvent } from "nostr-tools";
import { firstValueFrom, timeout, toArray } from "rxjs";
import type { NappletTransportSigner } from "./transport-identity";

export type CvmRelayTransport = {
  publish(event: NostrEvent, relays: string[]): Promise<boolean>;
  subscribe(
    relays: string[],
    filter: Filter,
    callbacks: {
      maxEoseTimeout?: number;
      eoseEventsCallback(events: NostrEvent[]): void;
      liveEventCallback(event: NostrEvent): void;
      closedCallback(): void;
    },
  ): () => void;
  loadRelayList?(pubkey: string): Promise<{ event?: NostrEvent }>;
  close(): void;
};

/** Dedicated connections never participate in the active account's authentication. */
export function createCvmRelayTransport(signer: NappletTransportSigner): CvmRelayTransport {
  const pool = new RelayPool({ keepAlive: 0 });
  const onAuthRequired = async ({ relay }: RelayAuthContext) => {
    await relay.authenticate(signer);
  };
  return {
    publish: async (event, relays) =>
      (await pool.publish(relays, event, { onAuthRequired })).some((result) => result.ok),
    subscribe: (relays, filter, callbacks) => {
      let timer: ReturnType<typeof setTimeout> | undefined;
      if (callbacks.maxEoseTimeout)
        timer = setTimeout(() => callbacks.eoseEventsCallback([]), callbacks.maxEoseTimeout);
      const sub = pool.subscription(relays, [filter], { onAuthRequired }).subscribe({
        next: (event) => {
          if (typeof event === "string") {
            clearTimeout(timer);
            callbacks.eoseEventsCallback([]);
          } else callbacks.liveEventCallback(event as NostrEvent);
        },
        error: () => {
          clearTimeout(timer);
          callbacks.closedCallback();
        },
        complete: () => {
          clearTimeout(timer);
          callbacks.closedCallback();
        },
      });
      return () => {
        clearTimeout(timer);
        sub.unsubscribe();
      };
    },
    loadRelayList: async (pubkey) => {
      const events = await firstValueFrom(
        pool
          .request(["wss://relay.contextvm.org"], [{ kinds: [10002], authors: [pubkey] }], { onAuthRequired })
          .pipe(timeout({ first: 3000, each: 3000 }), toArray()),
      );
      const event = events
        .filter((event) => event.kind === 10002 && event.pubkey === pubkey && verifyEvent(event))
        .sort((a, b) => b.created_at - a.created_at || a.id.localeCompare(b.id))[0];
      return { event };
    },
    close: () => pool.close(),
  };
}
