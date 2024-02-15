import { kinds } from "nostr-tools";
import _throttle from "lodash.throttle";

import { Kind0ParsedContent, parseKind0Event } from "../helpers/user-metadata";
import SuperMap from "../classes/super-map";
import Subject from "../classes/subject";
import replaceableEventLoaderService, { RequestOptions } from "./replaceable-event-requester";

class UserMetadataService {
  private metadata = new SuperMap<string, Subject<Kind0ParsedContent>>((pubkey) => {
    return replaceableEventLoaderService.getEvent(0, pubkey).map(parseKind0Event);
  });
  getSubject(pubkey: string) {
    return this.metadata.get(pubkey);
  }
  requestMetadata(pubkey: string, relays: Iterable<string>, opts: RequestOptions = {}) {
    const subject = this.metadata.get(pubkey);
    replaceableEventLoaderService.requestEvent(relays, kinds.Metadata, pubkey, undefined, opts);
    return subject;
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
  return parsed?.displayName || parsed?.display_name || parsed?.name || pubkey;
}

export default userMetadataService;
