import { isPTag, NostrEvent } from "../types/nostr-event";
import { safeJson } from "../helpers/parse";
import db from "./db";
import { CachedPubkeyEventRequester } from "../classes/cached-pubkey-event-requester";
import { SuperMap } from "../classes/super-map";
import Subject from "../classes/subject";

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

class UserContactsService extends CachedPubkeyEventRequester {
  constructor() {
    super(3, "user-contacts");
  }

  readCache(pubkey: string) {
    return db.get("userContacts", pubkey);
  }
  writeCache(pubkey: string, event: NostrEvent) {
    return db.put("userContacts", event);
  }

  private parsedSubjects = new SuperMap<string, Subject<UserContacts>>(() => new Subject<UserContacts>());
  requestContacts(pubkey: string, relays: string[], alwaysRequest = false) {
    const sub = this.parsedSubjects.get(pubkey);

    const requestSub = this.requestEvent(pubkey, relays, alwaysRequest);

    sub.connectWithHandler(requestSub, (event, next) => next(parseContacts(event)));

    return sub;
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
