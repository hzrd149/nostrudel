import { NostrEvent } from "../types/nostr-event";
import { NostrQuery } from "../types/nostr-query";
import { PubkeySubjectCache } from "../classes/pubkey-subject-cache";
import { NostrSubscription } from "../classes/nostr-subscription";
import { safeJson } from "../helpers/parse";
import db from "./db";
import settings from "./settings";
import userFollowersService from "./user-followers";

const subscription = new NostrSubscription([], undefined, "user-contacts");
const subjects = new PubkeySubjectCache<UserContacts>();
const forceRequestedKeys = new Set<string>();

export type UserContacts = {
  pubkey: string;
  relays: Record<string, { read: boolean; write: boolean }>;
  contacts: string[];
  // contacts: {
  //   pubkey: string;
  //   relay?: string;
  // }[];
  created_at: number;
};

function parseContacts(event: NostrEvent): UserContacts {
  // const keys = event.tags
  //   .filter((tag) => tag[0] === "p" && tag[1])
  //   .map((tag) => ({ pubkey: tag[1] as string, relay: tag[2] }));
  const keys = event.tags.filter((tag) => tag[0] === "p" && tag[1]).map((tag) => tag[1]) as string[];
  const relays = safeJson(event.content, {}) as UserContacts["relays"];

  return {
    pubkey: event.pubkey,
    relays,
    contacts: keys,
    created_at: event.created_at,
  };
}

function requestContacts(pubkey: string, relays: string[] = [], alwaysRequest = false) {
  let subject = subjects.getSubject(pubkey);

  if (relays.length) subjects.addRelays(pubkey, relays);

  if (alwaysRequest) forceRequestedKeys.add(pubkey);

  if (!subject.value) {
    db.get("user-contacts", pubkey).then((cached) => {
      if (cached) subject.next(cached);
    });
  }

  return subject;
}

function flushRequests() {
  const pubkeys = new Set<string>();
  const relays = new Set<string>();

  const pending = subjects.getAllPubkeysMissingData(Array.from(forceRequestedKeys));
  for (const key of pending.pubkeys) pubkeys.add(key);
  for (const url of pending.relays) relays.add(url);

  if (pubkeys.size === 0) return;

  const systemRelays = settings.relays.getValue();
  for (const url of systemRelays) relays.add(url);

  const query: NostrQuery = { authors: Array.from(pubkeys), kinds: [3] };

  subscription.setRelays(Array.from(relays));
  subscription.update(query);
  if (subscription.state !== NostrSubscription.OPEN) {
    subscription.open();
  }
}

function receiveEvent(event: NostrEvent) {
  if (event.kind !== 3) return;

  if (subjects.hasSubject(event.pubkey)) {
    const subject = subjects.getSubject(event.pubkey);
    const latest = subject.getValue();
    // make sure the event is newer than whats in the subject
    if (!latest || event.created_at > latest.created_at) {
      const parsed = parseContacts(event);
      subject.next(parsed);
      // send it to the db
      db.put("user-contacts", parsed);
    }
  } else {
    db.get("user-contacts", event.pubkey).then((cached) => {
      // make sure the event is newer than whats in the db
      if (!cached || event.created_at > cached.created_at) {
        db.put("user-contacts", parseContacts(event));
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
