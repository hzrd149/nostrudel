import { BehaviorSubject, filter, map } from "rxjs";
import db from "./db";
import settings from "./settings";
import { NostrSubscription } from "../classes/nostr-subscription";
import { PubkeyRequestList } from "../classes/pubkey-request-list";
import { PubkeySubjectCache } from "../classes/pubkey-subject-cache";
import { Kind0ParsedContent, NostrEvent } from "../types/nostr-event";
import { NostrQuery } from "../types/nostr-query";
import { unique } from "../helpers/array";

const subscription = new NostrSubscription([], undefined, "user-metadata");
const userMetadataSubjects = new PubkeySubjectCache<NostrEvent>();
const pendingRequests = new PubkeyRequestList();

function requestMetadataEvent(
  pubkey: string,
  relays: string[],
  alwaysRequest = false
): BehaviorSubject<NostrEvent | null> {
  let subject = userMetadataSubjects.getSubject(pubkey);

  db.get("user-metadata", pubkey).then((cached) => {
    if (cached) subject.next(cached);

    if (alwaysRequest || !cached) {
      pendingRequests.addPubkey(pubkey, relays);
    }
  });

  return subject;
}

function isEvent(e: NostrEvent | null): e is NostrEvent {
  return !!e;
}
function parseMetadata(event: NostrEvent): Kind0ParsedContent | undefined {
  try {
    return JSON.parse(event.content);
  } catch (e) {}
}
function requestMetadata(pubkey: string, relays: string[] = [], alwaysRequest = false) {
  return requestMetadataEvent(pubkey, relays, alwaysRequest).pipe(filter(isEvent), map(parseMetadata));
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
  for (const [key] of keys) {
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

const userMetadataService = { requestMetadata, requestMetadataEvent, flushRequests };

if (import.meta.env.DEV) {
  // @ts-ignore
  window.userMetadata = userMetadataService;
}

export default userMetadataService;
