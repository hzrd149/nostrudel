import { NostrEvent } from "../types/nostr-event";
import { NostrQuery } from "../types/nostr-query";
import { PubkeySubjectCache } from "../classes/pubkey-subject-cache";
import { NostrSubscription } from "../classes/nostr-subscription";
import db from "./db";
import settings from "./settings";
import { BehaviorSubject } from "rxjs";
import { getReferences } from "../helpers/nostr-event";
import userContactsService from "./user-contacts";

const subscription = new NostrSubscription([], undefined, "user-followers");
const subjects = new PubkeySubjectCache<string[]>();
const forceRequestedKeys = new Set<string>();

export type UserFollowers = Set<string>;

function mergeNext(subject: BehaviorSubject<string[] | null>, next: string[]) {
  let arr = subject.value ? Array.from(subject.value) : [];
  for (const key of next) {
    if (!arr.includes(key)) arr.push(key);
  }

  subject.next(arr);
}

function requestFollowers(pubkey: string, relays: string[] = [], alwaysRequest = false) {
  let subject = subjects.getSubject(pubkey);

  if (relays.length) subjects.addRelays(pubkey, relays);

  db.getAllKeysFromIndex("userContacts", "contacts", pubkey).then((cached) => {
    mergeNext(subject, cached);
  });

  if (alwaysRequest) forceRequestedKeys.add(pubkey);

  return subject;
}

function flushRequests() {
  if (!subjects.dirty) return;

  const pubkeys = new Set<string>();
  const relays = new Set<string>();

  const pending = subjects.getAllPubkeysMissingData(Array.from(forceRequestedKeys));
  for (const key of pending.pubkeys) pubkeys.add(key);
  for (const url of pending.relays) relays.add(url);

  if (pubkeys.size === 0) return;

  const systemRelays = settings.relays.getValue();
  for (const url of systemRelays) relays.add(url);

  const query: NostrQuery = { kinds: [3], "#p": Array.from(pubkeys) };

  subscription.setRelays(Array.from(relays));
  subscription.setQuery(query);
  if (subscription.state !== NostrSubscription.OPEN) {
    subscription.open();
  }
  subjects.dirty = false;
}

function receiveEvent(event: NostrEvent) {
  if (event.kind !== 3) return;
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
