import db from "./db";
import { isRTag, NostrEvent } from "../types/nostr-event";
import { RelayConfig } from "../classes/relay";
import { parseRTag } from "../helpers/nostr-event";
import { CachedPubkeyEventRequester } from "../classes/cached-pubkey-event-requester";
import { SuperMap } from "../classes/super-map";
import Subject from "../classes/subject";
import { normalizeRelayConfigs } from "../helpers/relay";

export type UserRelays = {
  pubkey: string;
  relays: RelayConfig[];
  created_at: number;
};

function parseRelaysEvent(event: NostrEvent): UserRelays {
  return {
    pubkey: event.pubkey,
    relays: normalizeRelayConfigs(event.tags.filter(isRTag).map(parseRTag)),
    created_at: event.created_at,
  };
}

class UserRelaysService {
  requester: CachedPubkeyEventRequester;
  constructor() {
    this.requester = new CachedPubkeyEventRequester(10002, "user-relays");
    this.requester.readCache = this.readCache;
    this.requester.writeCache = this.writeCache;
  }

  readCache(pubkey: string) {
    return db.get("userRelays", pubkey);
  }
  writeCache(pubkey: string, event: NostrEvent) {
    return db.put("userRelays", event);
  }

  private subjects = new SuperMap<string, Subject<UserRelays>>(() => new Subject<UserRelays>());
  getSubject(pubkey: string) {
    return this.subjects.get(pubkey);
  }
  requestRelays(pubkey: string, relays: string[], alwaysRequest = false) {
    const sub = this.subjects.get(pubkey);
    const requestSub = this.requester.requestEvent(pubkey, relays, alwaysRequest);
    sub.connectWithHandler(requestSub, (event, next) => next(parseRelaysEvent(event)));
    return sub;
  }

  receiveEvent(event: NostrEvent) {
    this.requester.handleEvent(event);
  }

  update() {
    this.requester.update();
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
