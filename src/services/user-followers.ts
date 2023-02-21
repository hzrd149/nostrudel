import { NostrEvent } from "../types/nostr-event";
import { NostrQuery } from "../types/nostr-query";
import { PubkeySubjectCache } from "../classes/pubkey-subject-cache";
import { NostrMultiSubscription } from "../classes/nostr-multi-subscription";
import db from "./db";
import { getReferences } from "../helpers/nostr-event";
import userContactsService from "./user-contacts";
import clientRelaysService from "./client-relays";
import { Subject } from "../classes/subject";
import { Kind } from "nostr-tools";

const subscription = new NostrMultiSubscription([], undefined, "user-followers");
const subjects = new PubkeySubjectCache<string[]>();
const forceRequestedKeys = new Set<string>();

export type UserFollowers = Set<string>;

function mergeNext(subject: Subject<string[] | null>, next: string[]) {
  let arr = subject.value ? Array.from(subject.value) : [];
  for (const key of next) {
    if (!arr.includes(key)) arr.push(key);
  }

  subject.next(arr);
}

function requestFollowers(pubkey: string, additionalRelays: string[] = [], alwaysRequest = false) {
  let subject = subjects.getSubject(pubkey);

  if (additionalRelays.length) subjects.addRelays(pubkey, additionalRelays);

  db.getAllKeysFromIndex("userFollows", "follows", pubkey).then((cached) => {
    mergeNext(subject, cached);
  });

  if (alwaysRequest) forceRequestedKeys.add(pubkey);

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

  const clientRelays = clientRelaysService.getReadUrls();
  for (const url of clientRelays) relayUrls.add(url);

  const query: NostrQuery = { kinds: [3], "#p": Array.from(pubkeys) };

  subscription.setRelays(Array.from(relayUrls));
  subscription.setQuery(query);
  if (subscription.state !== NostrMultiSubscription.OPEN) {
    subscription.open();
  }
  subjects.dirty = false;
}

function receiveEvent(event: NostrEvent) {
  if (event.kind !== Kind.Contacts) return;
  const follower = event.pubkey;

  const refs = getReferences(event);
  if (refs.pubkeys.length > 0) {
    for (const pubkey of refs.pubkeys) {
      if (subjects.hasSubject(pubkey)) {
        const subject = subjects.getSubject(pubkey);
        mergeNext(subject, [follower]);
      }

      forceRequestedKeys.delete(pubkey);
    }
  }

  db.put("userFollows", { pubkey: event.pubkey, follows: refs.pubkeys });
}

subscription.onEvent.subscribe((event) => {
  // pass the event ot the contacts service
  userContactsService.receiveEvent(event);
  receiveEvent(event);
});

// flush requests every second
setInterval(() => {
  subjects.prune();
  flushRequests();
}, 1000 * 5);

const userFollowersService = { requestFollowers, flushRequests, receiveEvent };

if (import.meta.env.DEV) {
  // @ts-ignore
  window.userFollowersService = userFollowersService;
}

export default userFollowersService;
