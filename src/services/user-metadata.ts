import { BehaviorSubject, filter, map } from "rxjs";
import db from "./db";
import settings from "./settings";
import { NostrSubscription } from "../classes/nostr-subscription";
import { PubkeyRequestList } from "../classes/pubkey-request-list";
import { PubkeySubjectCache } from "../classes/pubkey-subject-cache";
import { Kind0ParsedContent, NostrEvent } from "../types/nostr-event";
import { NostrQuery } from "../types/nostr-query";
import { unique } from "../helpers/array";

type Metadata = Kind0ParsedContent & { created_at: number };

const subscription = new NostrSubscription([], undefined, "user-metadata");
const userMetadataSubjects = new PubkeySubjectCache<Metadata>();
const pendingRequests = new PubkeyRequestList();

function requestMetadata(pubkey: string, relays: string[], alwaysRequest = false) {
  let subject = userMetadataSubjects.getSubject(pubkey);

  db.get("user-metadata", pubkey).then((cached) => {
    if (cached) {
      const parsed = parseMetadata(cached);
      if (parsed) subject.next(parsed);
    }

    if (alwaysRequest || !cached) {
      pendingRequests.addPubkey(pubkey, relays);
    }
  });

  return subject;
}

function parseMetadata(event: NostrEvent): Metadata | undefined {
  try {
    return { ...JSON.parse(event.content), created_at: event.created_at };
  } catch (e) {}
}

function flushRequests() {
  if (!pendingRequests.needsFlush) return;
  const { pubkeys, relays } = pendingRequests.flush();
  if (pubkeys.length === 0) return;

  const systemRelays = settings.relays.getValue();
  const query: NostrQuery = { authors: pubkeys, kinds: [0] };

  subscription.setRelays(relays.length > 0 ? unique([...systemRelays, ...relays]) : systemRelays);
  subscription.update(query);
  if (subscription.state !== NostrSubscription.OPEN) {
    subscription.open();
  }
}

function pruneMemoryCache() {
  const keys = userMetadataSubjects.prune();
  for (const key of keys) {
    pendingRequests.removePubkey(key);
  }
}

subscription.onEvent.subscribe((event) => {
  if (userMetadataSubjects.hasSubject(event.pubkey)) {
    const subject = userMetadataSubjects.getSubject(event.pubkey);
    const latest = subject.getValue();
    if (!latest || event.created_at > latest.created_at) {
      subject.next(event);
      db.put("user-metadata", event);
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

const userMetadataService = { requestMetadata, flushRequests, pendingRequests };

if (import.meta.env.DEV) {
  // @ts-ignore
  window.userMetadata = userMetadataService;
}

export default userMetadataService;
