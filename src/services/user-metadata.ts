import db from "./db";
import settings from "./settings";
import { NostrSubscription } from "../classes/nostr-subscription";
import { PubkeySubjectCache } from "../classes/pubkey-subject-cache";
import { Kind0ParsedContent, NostrEvent } from "../types/nostr-event";
import { NostrQuery } from "../types/nostr-query";

type Metadata = Kind0ParsedContent & { created_at: number };

const subscription = new NostrSubscription([], undefined, "user-metadata");
const subjects = new PubkeySubjectCache<Metadata>();
const forceRequestedKeys = new Set<string>();

function requestMetadata(pubkey: string, relays: string[], alwaysRequest = false) {
  let subject = subjects.getSubject(pubkey);

  if (relays.length) subjects.addRelays(pubkey, relays);

  if (alwaysRequest) {
    forceRequestedKeys.add(pubkey);
  }

  if (!subject.value) {
    db.get("user-metadata", pubkey).then((cached) => {
      if (cached) {
        const parsed = parseMetadata(cached);
        if (parsed) subject.next(parsed);
      }
    });
  }

  return subject;
}

function parseMetadata(event: NostrEvent): Metadata | undefined {
  try {
    return { ...JSON.parse(event.content), created_at: event.created_at };
  } catch (e) {}
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

  const query: NostrQuery = { authors: Array.from(pubkeys), kinds: [0] };

  subscription.setRelays(Array.from(relays));
  subscription.setQuery(query);
  if (subscription.state !== NostrSubscription.OPEN) {
    subscription.open();
  }
  subjects.dirty = false;
}

subscription.onEvent.subscribe((event) => {
  const subject = subjects.getSubject(event.pubkey);
  const latest = subject.getValue();
  if (!latest || event.created_at > latest.created_at) {
    const parsed = parseMetadata(event);
    if (parsed) {
      subject.next(parsed);
      db.put("user-metadata", event);
      forceRequestedKeys.delete(event.pubkey);
    }
  }
});

// flush requests every second
setInterval(() => {
  subjects.prune();
  flushRequests();
}, 1000 * 2);

const userMetadataService = { requestMetadata, flushRequests, subjects };

if (import.meta.env.DEV) {
  // @ts-ignore
  window.userMetadataService = userMetadataService;
}

export default userMetadataService;
