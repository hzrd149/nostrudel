import { isPTag, NostrEvent } from "../types/nostr-event";
import { NostrQuery } from "../types/nostr-query";
import { PubkeySubjectCache } from "../classes/pubkey-subject-cache";
import { NostrSubscription } from "../classes/nostr-subscription";
import { safeJson } from "../helpers/parse";
import db from "./db";
import settings from "./settings";
import userFollowersService from "./user-followers";
import pubkeyRelayWeightsService from "./pubkey-relay-weights";
import clientRelaysService from "./client-relays";

const subscription = new NostrSubscription([], undefined, "user-contacts");
const subjects = new PubkeySubjectCache<UserContacts>();
const forceRequestedKeys = new Set<string>();

export type UserContacts = {
  pubkey: string;
  relays: Record<string, { read: boolean; write: boolean }>;
  contacts: string[];
  contactRelay: Record<string, string | undefined>;
  created_at: number;
};

function parseContacts(event: NostrEvent): UserContacts {
  const relays = safeJson(event.content, {}) as UserContacts["relays"];
  const pubkeys = event.tags.filter(isPTag).map((tag) => tag[1]);
  const contactRelay = event.tags.filter(isPTag).reduce((dir, tag) => {
    if (tag[2]) {
      dir[tag[1]] = tag[2];
    }
    return dir;
  }, {} as Record<string, string>);

  return {
    pubkey: event.pubkey,
    relays,
    contacts: pubkeys,
    contactRelay,
    created_at: event.created_at,
  };
}

function requestContacts(pubkey: string, additionalRelays: string[] = [], alwaysRequest = false) {
  let subject = subjects.getSubject(pubkey);

  if (additionalRelays.length) subjects.addRelays(pubkey, additionalRelays);

  if (alwaysRequest) forceRequestedKeys.add(pubkey);

  if (!subject.value) {
    db.get("userContacts", pubkey).then((cached) => {
      if (cached) subject.next(cached);
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

  const clientRelays = clientRelaysService.getReadUrls();
  for (const url of clientRelays) relayUrls.add(url);

  const query: NostrQuery = { authors: Array.from(pubkeys), kinds: [3] };

  subscription.setRelays(Array.from(relayUrls));
  subscription.setQuery(query);
  if (subscription.state !== NostrSubscription.OPEN) {
    subscription.open();
  }
  subjects.dirty = false;
}

function receiveEvent(event: NostrEvent) {
  if (event.kind !== 3) return;

  const parsed = parseContacts(event);

  if (subjects.hasSubject(event.pubkey)) {
    const subject = subjects.getSubject(event.pubkey);
    const latest = subject.getValue();
    // make sure the event is newer than whats in the subject
    if (!latest || event.created_at > latest.created_at) {
      subject.next(parsed);
      // send it to the db
      db.put("userContacts", parsed);
      // add it to the pubkey relay weights
      pubkeyRelayWeightsService.handleContactList(parsed);
    }
  } else {
    db.get("userContacts", event.pubkey).then((cached) => {
      // make sure the event is newer than whats in the db
      if (!cached || event.created_at > cached.created_at) {
        db.put("userContacts", parsed);
        // add it to the pubkey relay weights
        pubkeyRelayWeightsService.handleContactList(parsed);
      }
    });
  }

  forceRequestedKeys.delete(event.pubkey);
}

subscription.onEvent.subscribe((event) => {
  // add the event to the followers service so it can update
  userFollowersService.receiveEvent(event);
  receiveEvent(event);
});

// flush requests every second
setInterval(() => {
  subjects.prune();
  flushRequests();
}, 1000 * 2);

const userContactsService = { requestContacts, flushRequests, subjects, receiveEvent };

if (import.meta.env.DEV) {
  // @ts-ignore
  window.userContactsService = userContactsService;
}

export default userContactsService;
