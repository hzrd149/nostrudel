import { Filter, NostrEvent } from "nostr-tools";
import { ReplaceableLoader } from "applesauce-loaders/loaders";

import { localRelay } from "./local-relay";
import { truncateId } from "../helpers/string";
import { eventStore } from "./event-store";
import rxNostr from "./rx-nostr";
import { Observable } from "rxjs";
import { COMMON_CONTACT_RELAYS } from "../const";
import { isFromCache } from "applesauce-core/helpers";

export type RequestOptions = {
  /** Always request the event from the relays */
  alwaysRequest?: boolean;
  /** ignore the cache on initial load */
  ignoreCache?: boolean;
};

export function getHumanReadableCoordinate(kind: number, pubkey: string, d?: string) {
  return `${kind}:${truncateId(pubkey)}${d ? ":" + d : ""}`;
}

// load events from cache relay
export function cacheRequest(filters: Filter[]) {
  return new Observable<NostrEvent>((observer) => {
    if (!localRelay) return observer.complete();

    const sub = localRelay.subscribe(filters, {
      onevent: (event) => observer.next(event),
      oneose: () => {
        sub.close();
        observer.complete();
      },
      onclose: () => observer.complete(),
    });
  });
}

const replaceableEventLoader = new ReplaceableLoader(rxNostr, { cacheRequest, lookupRelays: COMMON_CONTACT_RELAYS });

replaceableEventLoader.subscribe((packet) => eventStore.add(packet.event, packet.from));

if (import.meta.env.DEV) {
  //@ts-expect-error debug
  window.replaceableEventLoader = replaceableEventLoader;
}

export default replaceableEventLoader;
