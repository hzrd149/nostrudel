import { NostrEvent } from "../types/nostr-event";
import { NostrQuery } from "../types/nostr-query";
import { PubkeyRequestList } from "../classes/pubkey-request-list";
import { PubkeySubjectCache } from "../classes/pubkey-subject-cache";
import { NostrSubscription } from "../classes/nostr-subscription";
import { safeParse } from "../helpers/json";
import { unique } from "../helpers/array";
import db from "./db";
import settings from "./settings";

const subscription = new NostrSubscription([], undefined, "user-contacts");
const userSubjects = new PubkeySubjectCache<UserContacts>();
const pendingRequests = new PubkeyRequestList();

export type UserContacts = {
  pubkey: string;
  relays: Record<string, { read: boolean; write: boolean }>;
  contacts: {
    pubkey: string;
    relay?: string;
  }[];
  created_at: number;
};

function parseContacts(event: NostrEvent): UserContacts {
  const keys = event.tags
    .filter((tag) => tag[0] === "p" && tag[1])
    .map((tag) => ({ pubkey: tag[1] as string, relay: tag[2] }));

  const relays = safeParse(event.content, {}) as UserContacts["relays"];

  return {
    pubkey: event.pubkey,
    relays,
    contacts: keys,
    created_at: event.created_at,
  };
}

function requestContacts(pubkey: string, relays: string[] = [], alwaysRequest = false) {
  let subject = userSubjects.getSubject(pubkey);

  db.get("user-contacts", pubkey).then((cached) => {
    if (cached) subject.next(cached);

    if (alwaysRequest || !cached) {
      pendingRequests.addPubkey(pubkey, relays);
    }
  });

  return subject;
}

function flushRequests() {
  if (!pendingRequests.needsFlush) return;
  const { pubkeys, relays } = pendingRequests.flush();
  if (pubkeys.length === 0) return;

  const systemRelays = settings.relays.getValue();
  const query: NostrQuery = { authors: pubkeys, kinds: [3] };

  subscription.setRelays(relays.length > 0 ? unique([...systemRelays, ...relays]) : systemRelays);
  subscription.update(query);
  if (subscription.state !== NostrSubscription.OPEN) {
    subscription.open();
  }
}

function pruneMemoryCache() {
  const keys = userSubjects.prune();
  for (const [key] of keys) {
    pendingRequests.removePubkey(key);
  }
}

subscription.onEvent.subscribe((event) => {
  if (userSubjects.hasSubject(event.pubkey)) {
    const subject = userSubjects.getSubject(event.pubkey);
    const latest = subject.getValue();
    if (!latest || event.created_at > latest.created_at) {
      const parsed = parseContacts(event);
      subject.next(parsed);
      db.put("user-contacts", parsed);
    }
  }

  // remove the pending request for this pubkey
  if (pendingRequests.hasPubkey(event.pubkey)) {
    pendingRequests.removePubkey(event.pubkey);
  }
});

// flush requests every second
setInterval(() => {
  flushRequests();
  pruneMemoryCache();
}, 1000);

const userContactsService = { requestContacts, flushRequests };

if (import.meta.env.DEV) {
  // @ts-ignore
  window.userContacts = userContactsService;
}

export default userContactsService;
