import db from "./db";
import { isRTag, NostrEvent } from "../types/nostr-event";
import { RelayConfig } from "../classes/relay";
import { parseRTag } from "../helpers/nostr-event";
import { CachedPubkeyEventRequester } from "../classes/cached-pubkey-event-requester";
import { SuperMap } from "../classes/super-map";
import Subject from "../classes/subject";

export type UserRelays = {
  pubkey: string;
  relays: RelayConfig[];
  created_at: number;
};

function parseRelaysEvent(event: NostrEvent): UserRelays {
  return {
    pubkey: event.pubkey,
    relays: event.tags.filter(isRTag).map(parseRTag),
    created_at: event.created_at,
  };
}

class UserRelaysService extends CachedPubkeyEventRequester {
  constructor() {
    super(10002, "user-relays");
  }

  readCache(pubkey: string) {
    return db.get("userRelays", pubkey);
  }
  writeCache(pubkey: string, event: NostrEvent) {
    return db.put("userRelays", event);
  }

  // TODO: rxjs behavior subject dose not feel like the right thing to use here
  private parsedSubjects = new SuperMap<string, Subject<UserRelays>>(() => new Subject<UserRelays>());
  requestRelays(pubkey: string, relays: string[], alwaysRequest = false) {
    const sub = this.parsedSubjects.get(pubkey);

    const requestSub = this.requestEvent(pubkey, relays, alwaysRequest);

    sub.connectWithHandler(requestSub, (event, next) => next(parseRelaysEvent(event)));

    return sub;
  }
}

const userRelaysService = new UserRelaysService();

setInterval(() => {
  userRelaysService.update();
}, 1000 * 2);

if (import.meta.env.DEV) {
  // @ts-ignore
  window.userRelaysService = userRelaysService;
}

export default userRelaysService;
