import { isPTag, NostrEvent } from "../types/nostr-event";
import { safeJson } from "../helpers/parse";
import db from "./db";
import { CachedPubkeyEventRequester } from "../classes/cached-pubkey-event-requester";
import { SuperMap } from "../classes/super-map";
import Subject from "../classes/subject";
import { RelayConfig, RelayMode } from "../classes/relay";

export type UserContacts = {
  pubkey: string;
  relays: RelayConfig[];
  contacts: string[];
  contactRelay: Record<string, string | undefined>;
  created_at: number;
};

type RelayJson = Record<string, { read: boolean; write: boolean }>;
function relayJsonToRelayConfig(relayJson: RelayJson) {
  try {
    return Array.from(Object.entries(relayJson)).map(([url, opts]) => ({
      url,
      mode: (opts.write ? RelayMode.WRITE : 0) | (opts.read ? RelayMode.READ : 0),
    }));
  } catch (e) {}
  return [];
}

function parseContacts(event: NostrEvent): UserContacts {
  const relayJson = safeJson(event.content, {}) as RelayJson;
  const relays = relayJsonToRelayConfig(relayJson);

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

class UserContactsService {
  requester: CachedPubkeyEventRequester;

  constructor() {
    this.requester = new CachedPubkeyEventRequester(3, "user-contacts");
    this.requester.readCache = this.readCache;
    this.requester.writeCache = this.writeCache;
  }

  readCache(pubkey: string) {
    return db.get("userContacts", pubkey);
  }
  writeCache(pubkey: string, event: NostrEvent) {
    return db.put("userContacts", event);
  }

  private subjects = new SuperMap<string, Subject<UserContacts>>(() => new Subject<UserContacts>());
  getSubject(pubkey: string) {
    return this.subjects.get(pubkey);
  }
  requestContacts(pubkey: string, relays: string[], alwaysRequest = false) {
    const sub = this.subjects.get(pubkey);

    const requestSub = this.requester.requestEvent(pubkey, relays, alwaysRequest);

    sub.connectWithHandler(requestSub, (event, next) => next(parseContacts(event)));

    return sub;
  }

  receiveEvent(event: NostrEvent) {
    this.requester.handleEvent(event);
  }

  update() {
    this.requester.update();
  }
}

const userContactsService = new UserContactsService();

setInterval(() => {
  userContactsService.update();
}, 1000 * 2);

if (import.meta.env.DEV) {
  // @ts-ignore
  window.userContactsService = userContactsService;
}

export default userContactsService;
