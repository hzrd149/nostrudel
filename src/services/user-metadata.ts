import db from "./db";
import { NostrEvent } from "../types/nostr-event";
import { Kind0ParsedContent, parseKind0Event } from "../helpers/user-metadata";
import { SuperMap } from "../classes/super-map";
import Subject from "../classes/subject";
import replaceableEventLoaderService from "./replaceable-event-requester";
import { Kind } from "nostr-tools";

class UserMetadataService {
  // requester: CachedPubkeyEventRequester;
  // constructor() {
  //   this.requester = new CachedPubkeyEventRequester(0, "user-metadata");
  //   this.requester.readCache = this.readCache;
  //   this.requester.writeCache = this.writeCache;
  // }

  readCache(pubkey: string) {
    return db.get("userMetadata", pubkey);
  }
  writeCache(pubkey: string, event: NostrEvent) {
    return db.put("userMetadata", event);
  }

  private parsedSubjects = new SuperMap<string, Subject<Kind0ParsedContent>>(() => new Subject<Kind0ParsedContent>());
  getSubject(pubkey: string) {
    return this.parsedSubjects.get(pubkey);
  }
  requestMetadata(pubkey: string, relays: string[], alwaysRequest = false) {
    const sub = this.parsedSubjects.get(pubkey);
    const requestSub = replaceableEventLoaderService.requestEvent(
      relays,
      Kind.Metadata,
      pubkey,
      undefined,
      alwaysRequest,
    );
    sub.connectWithHandler(requestSub, (event, next) => next(parseKind0Event(event)));
    return sub;
  }

  receiveEvent(event: NostrEvent) {
    replaceableEventLoaderService.handleEvent(event);
  }
}

const userMetadataService = new UserMetadataService();

if (import.meta.env.DEV) {
  // @ts-ignore
  window.userMetadataService = userMetadataService;
}

// random helper for logging
export function nameOrPubkey(pubkey: string) {
  const parsed = userMetadataService.getSubject(pubkey).value;
  return parsed?.name || parsed?.display_name || pubkey;
}

export default userMetadataService;
