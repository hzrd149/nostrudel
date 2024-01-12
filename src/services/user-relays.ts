import { kinds } from "nostr-tools";

import { isRTag, NostrEvent } from "../types/nostr-event";
import { RelayConfig } from "../classes/relay";
import { parseRTag } from "../helpers/nostr/events";
import SuperMap from "../classes/super-map";
import Subject from "../classes/subject";
import { normalizeRelayConfigs } from "../helpers/relay";
import userContactsService from "./user-contacts";
import replaceableEventLoaderService, { createCoordinate, RequestOptions } from "./replaceable-event-requester";

export type ParsedUserRelays = {
  pubkey: string;
  relays: RelayConfig[];
  created_at: number;
};

function parseRelaysEvent(event: NostrEvent): ParsedUserRelays {
  return {
    pubkey: event.pubkey,
    relays: normalizeRelayConfigs(event.tags.filter(isRTag).map(parseRTag)),
    created_at: event.created_at,
  };
}

class UserRelaysService {
  private subjects = new SuperMap<string, Subject<ParsedUserRelays>>(() => new Subject<ParsedUserRelays>());
  getRelays(pubkey: string) {
    return this.subjects.get(pubkey);
  }
  requestRelays(pubkey: string, relays: string[], opts: RequestOptions = {}) {
    const sub = this.subjects.get(pubkey);
    const requestSub = replaceableEventLoaderService.requestEvent(relays, kinds.RelayList, pubkey, undefined, opts);
    sub.connectWithHandler(requestSub, (event, next) => next(parseRelaysEvent(event)));

    // also fetch the relays from the users contacts
    const contactsSub = userContactsService.requestContacts(pubkey, relays, opts);
    sub.connectWithHandler(contactsSub, (contacts, next, value) => {
      // NOTE: only use relays from contact list if the user dose not have a NIP-65 relay list
      if (contacts.relays.length > 0 && !value) {
        next({ pubkey: contacts.pubkey, relays: contacts.relays, created_at: contacts.created_at });
      }
    });

    return sub;
  }

  async loadFromCache(pubkey: string) {
    const sub = this.subjects.get(pubkey);

    // load from cache
    await replaceableEventLoaderService.loadFromCache(createCoordinate(kinds.RelayList, pubkey));

    const requestSub = replaceableEventLoaderService.getEvent(kinds.RelayList, pubkey);
    sub.connectWithHandler(requestSub, (event, next) => next(parseRelaysEvent(event)));
  }

  receiveEvent(event: NostrEvent) {
    replaceableEventLoaderService.handleEvent(event);
  }
}

const userRelaysService = new UserRelaysService();

if (import.meta.env.DEV) {
  // @ts-ignore
  window.userRelaysService = userRelaysService;
}

export default userRelaysService;
