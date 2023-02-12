import db from "./db";
import { isRTag, NostrEvent } from "../types/nostr-event";
import { RelayConfig } from "../classes/relay";
import { parseRTag } from "../helpers/nostr-event";
import { CachedPubkeyEventRequester } from "../classes/cached-pubkey-event-requester";
import { BehaviorSubject } from "rxjs";
import { SuperMap } from "../classes/super-map";

export type UserRelays = {
  pubkey: string;
  relays: RelayConfig[];
  created_at: number;
};

function parseRelaysEvent(event: NostrEvent): UserRelays {
  return {
    pubkey: event.pubkey,
    relays: event.tags.filter(isRTag).map(parseRTag),
    created_at: event.created_at,
  };
}

class UserRelaysService extends CachedPubkeyEventRequester {
  constructor() {
    super(10002, "user-relays");
  }

  readCache(pubkey: string) {
    return db.get("userRelays", pubkey);
  }
  writeCache(pubkey: string, event: NostrEvent) {
    return db.put("userRelays", event);
  }

  // TODO: rxjs behavior subject dose not feel like the right thing to use here
  private relaysSubjects = new SuperMap<string, BehaviorSubject<UserRelays | undefined>>(
    () => new BehaviorSubject<UserRelays | undefined>(undefined)
  );
  private parentSubConnected = new WeakSet<any>();
  requestRelays(pubkey: string, relays: string[], alwaysRequest = false) {
    const sub = this.relaysSubjects.get(pubkey);

    const requestSub = this.requestEvent(pubkey, relays, alwaysRequest);
    if (!this.parentSubConnected.has(requestSub)) {
      requestSub.subscribe((event) => event && sub.next(parseRelaysEvent(event)));
      this.parentSubConnected.add(requestSub);
    }

    return sub;
  }
}

// const subscription = new NostrMultiSubscription([], undefined, "user-relays");
// const subjects = new PubkeySubjectCache<UserRelays>();
// const forceRequestedKeys = new Set<string>();

// function requestRelays(pubkey: string, relays: string[], alwaysRequest = false) {
//   let subject = subjects.getSubject(pubkey);

//   if (relays.length) subjects.addRelays(pubkey, relays);

//   if (alwaysRequest) forceRequestedKeys.add(pubkey);

//   if (!subject.value) {
//     db.get("userRelays", pubkey).then((cached) => {
//       if (cached) {
//         subject.next(cached);
//       }
//     });
//   }

//   return subject;
// }

// function flushRequests() {
//   if (!subjects.dirty) return;

//   const pubkeys = new Set<string>();
//   const relayUrls = new Set<string>();

//   const pending = subjects.getAllPubkeysMissingData(Array.from(forceRequestedKeys));
//   for (const key of pending.pubkeys) pubkeys.add(key);
//   for (const url of pending.relays) relayUrls.add(url);

//   if (pubkeys.size === 0) return;

//   const clientRelays = clientRelaysService.readRelays.value;
//   for (const relay of clientRelays) relayUrls.add(relay.url);

//   const query: NostrQuery = { authors: Array.from(pubkeys), kinds: [10002] };

//   subscription.setRelays(Array.from(relayUrls));
//   subscription.setQuery(query);
//   if (subscription.state !== NostrMultiSubscription.OPEN) {
//     subscription.open();
//   }
//   subjects.dirty = false;
// }

// function receiveEvent(event: NostrEvent) {
//   const subject = subjects.getSubject(event.pubkey);
//   const latest = subject.getValue();
//   if (!latest || event.created_at > latest.created_at) {
//     const userRelays = {
//       pubkey: event.pubkey,
//       relays: event.tags.filter(isRTag).map(parseRTag),
//       created_at: event.created_at,
//     };

//     subject.next(userRelays);
//     db.put("userRelays", userRelays);
//     forceRequestedKeys.delete(event.pubkey);
//   }
// }

// subscription.onEvent.subscribe(receiveEvent);

// // flush requests every second
// setInterval(() => {
//   subjects.prune();
//   flushRequests();
// }, 1000 * 2);

// const userRelaysService = { requestRelays, flushRequests, subjects, receiveEvent };

const userRelaysService = new UserRelaysService();

setInterval(() => {
  userRelaysService.update();
}, 1000 * 2);

if (import.meta.env.DEV) {
  // @ts-ignore
  window.userRelaysService = userRelaysService;
}

export default userRelaysService;
