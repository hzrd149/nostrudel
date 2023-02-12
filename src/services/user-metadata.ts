import db from "./db";
import { CachedPubkeyEventRequester } from "../classes/cached-pubkey-event-requester";
import { NostrEvent } from "../types/nostr-event";
import { BehaviorSubject } from "rxjs";
import { Kind0ParsedContent, parseKind0Event } from "../helpers/user-metadata";
import { SuperMap } from "../classes/super-map";

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

  // TODO: rxjs behavior subject dose not feel like the right thing to use here
  private parsedSubjects = new SuperMap<string, BehaviorSubject<Kind0ParsedContent | undefined>>(
    () => new BehaviorSubject<Kind0ParsedContent | undefined>(undefined)
  );
  private parsedConnected = new WeakSet<any>();
  requestMetadata(pubkey: string, relays: string[], alwaysRequest = false) {
    const sub = this.parsedSubjects.get(pubkey);

    const requestSub = this.requestEvent(pubkey, relays, alwaysRequest);
    if (!this.parsedConnected.has(requestSub)) {
      requestSub.subscribe((event) => event && sub.next(parseKind0Event(event)));
      this.parsedConnected.add(requestSub);
    }

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
