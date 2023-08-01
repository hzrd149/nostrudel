import { isRTag, NostrEvent } from "../types/nostr-event";
import { RelayConfig } from "../classes/relay";
import { parseRTag } from "../helpers/nostr/event";
import { SuperMap } from "../classes/super-map";
import Subject from "../classes/subject";
import { normalizeRelayConfigs } from "../helpers/relay";
import userContactsService from "./user-contacts";
import replaceableEventLoaderService from "./replaceable-event-requester";
import { Kind } from "nostr-tools";

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
  requestRelays(pubkey: string, relays: string[], alwaysRequest = false) {
    const sub = this.subjects.get(pubkey);
    const requestSub = replaceableEventLoaderService.requestEvent(relays, Kind.RelayList, pubkey);
    sub.connectWithHandler(requestSub, (event, next) => next(parseRelaysEvent(event)));

    // also fetch the relays from the users contacts
    const contactsSub = userContactsService.requestContacts(pubkey, relays, alwaysRequest);
    sub.connectWithHandler(contactsSub, (contacts, next, value) => {
      if (contacts.relays.length > 0 && (!value || contacts.created_at > value.created_at)) {
        next({ pubkey: contacts.pubkey, relays: contacts.relays, created_at: contacts.created_at });
      }
    });

    return sub;
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
