import db from "./db";
import { CachedPubkeyEventRequester } from "../classes/cached-pubkey-event-requester";
import { NostrEvent } from "../types/nostr-event";
import { Kind0ParsedContent, parseKind0Event } from "../helpers/user-metadata";
import { SuperMap } from "../classes/super-map";
import Subject from "../classes/subject";

class UserMetadataService extends CachedPubkeyEventRequester {
  constructor() {
    super(0, "user-metadata");
  }

  readCache(pubkey: string) {
    return db.get("userMetadata", pubkey);
  }
  writeCache(pubkey: string, event: NostrEvent) {
    return db.put("userMetadata", event);
  }

  private parsedSubjects = new SuperMap<string, Subject<Kind0ParsedContent>>(() => new Subject<Kind0ParsedContent>());
  requestMetadata(pubkey: string, relays: string[], alwaysRequest = false) {
    const sub = this.parsedSubjects.get(pubkey);

    const requestSub = this.requestEvent(pubkey, relays, alwaysRequest);

    sub.connectWithHandler(requestSub, (event, next) => next(parseKind0Event(event)));

    return sub;
  }
}

const userMetadataService = new UserMetadataService();

setInterval(() => {
  userMetadataService.update();
}, 1000 * 2);

if (import.meta.env.DEV) {
  // @ts-ignore
  window.userMetadataService = userMetadataService;
}

export default userMetadataService;
