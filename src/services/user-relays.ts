import db from "./db";
import { NostrSubscription } from "../classes/nostr-subscription";
import { PubkeySubjectCache } from "../classes/pubkey-subject-cache";
import { isRTag, NostrEvent } from "../types/nostr-event";
import { NostrQuery } from "../types/nostr-query";
import { RelayConfig } from "../classes/relay";
import { parseRTag } from "../helpers/nostr-event";
import clientRelaysService from "./client-relays";

export type UserRelays = {
  pubkey: string;
  relays: RelayConfig[];
  created_at: number;
};

const subscription = new NostrSubscription([], undefined, "user-relays");
const subjects = new PubkeySubjectCache<UserRelays>();
const forceRequestedKeys = new Set<string>();

function requestRelays(pubkey: string, relays: string[], alwaysRequest = false) {
  let subject = subjects.getSubject(pubkey);

  if (relays.length) subjects.addRelays(pubkey, relays);

  if (alwaysRequest) forceRequestedKeys.add(pubkey);

  if (!subject.value) {
    db.get("userRelays", pubkey).then((cached) => {
      if (cached) {
        subject.next(cached);
      }
    });
  }

  return subject;
}

function flushRequests() {
  if (!subjects.dirty) return;

  const pubkeys = new Set<string>();
  const relayUrls = new Set<string>();

  const pending = subjects.getAllPubkeysMissingData(Array.from(forceRequestedKeys));
  for (const key of pending.pubkeys) pubkeys.add(key);
  for (const url of pending.relays) relayUrls.add(url);

  if (pubkeys.size === 0) return;

  const clientRelays = clientRelaysService.readRelays.value;
  for (const relay of clientRelays) relayUrls.add(relay.url);

  const query: NostrQuery = { authors: Array.from(pubkeys), kinds: [10002] };

  subscription.setRelays(Array.from(relayUrls));
  subscription.setQuery(query);
  if (subscription.state !== NostrSubscription.OPEN) {
    subscription.open();
  }
  subjects.dirty = false;
}

function receiveEvent(event: NostrEvent) {
  const subject = subjects.getSubject(event.pubkey);
  const latest = subject.getValue();
  if (!latest || event.created_at > latest.created_at) {
    const userRelays = {
      pubkey: event.pubkey,
      relays: event.tags.filter(isRTag).map(parseRTag),
      created_at: event.created_at,
    };

    subject.next(userRelays);
    db.put("userRelays", userRelays);
    forceRequestedKeys.delete(event.pubkey);
  }
}

subscription.onEvent.subscribe(receiveEvent);

// flush requests every second
setInterval(() => {
  subjects.prune();
  flushRequests();
}, 1000 * 2);

const userRelaysService = { requestRelays, flushRequests, subjects, receiveEvent };

if (import.meta.env.DEV) {
  // @ts-ignore
  window.userRelaysService = userRelaysService;
}

export default userRelaysService;
