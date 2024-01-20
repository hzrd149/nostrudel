import { kinds } from "nostr-tools";

import { NostrEvent } from "../types/nostr-event";
import SuperMap from "../classes/super-map";
import Subject from "../classes/subject";
import userContactsService from "./user-contacts";
import replaceableEventLoaderService, { createCoordinate, RequestOptions } from "./replaceable-event-requester";
import RelaySet from "../classes/relay-set";
import { RelayMode } from "../classes/relay";

export type UserMailboxes = {
  pubkey: string;
  relays: RelaySet;
  inbox: RelaySet;
  outbox: RelaySet;
  created_at: number;
};

function nip65ToUserMailboxes(event: NostrEvent): UserMailboxes {
  return {
    pubkey: event.pubkey,
    relays: RelaySet.fromNIP65Event(event),
    inbox: RelaySet.fromNIP65Event(event, RelayMode.READ),
    outbox: RelaySet.fromNIP65Event(event, RelayMode.WRITE),
    created_at: event.created_at,
  };
}

class UserMailboxesService {
  private subjects = new SuperMap<string, Subject<UserMailboxes>>(() => new Subject<UserMailboxes>());
  getMailboxes(pubkey: string) {
    return this.subjects.get(pubkey);
  }
  requestMailboxes(pubkey: string, relays: Iterable<string>, opts: RequestOptions = {}) {
    const sub = this.subjects.get(pubkey);
    const requestSub = replaceableEventLoaderService.requestEvent(relays, kinds.RelayList, pubkey, undefined, opts);
    sub.connectWithHandler(requestSub, (event, next) => next(nip65ToUserMailboxes(event)));

    // also fetch the relays from the users contacts
    const contactsSub = userContactsService.requestContacts(pubkey, relays, opts);
    sub.connectWithHandler(contactsSub, (contacts, next, value) => {
      // NOTE: only use relays from contact list if the user dose not have a NIP-65 relay list
      if (contacts.relays.size > 0 && !value) {
        next({
          pubkey: contacts.pubkey,
          relays: contacts.relays,
          inbox: contacts.inbox,
          outbox: contacts.outbox,
          created_at: contacts.created_at,
        });
      }
    });

    return sub;
  }

  async loadFromCache(pubkey: string) {
    const sub = this.subjects.get(pubkey);

    // load from cache
    await replaceableEventLoaderService.loadFromCache(createCoordinate(kinds.RelayList, pubkey));

    const requestSub = replaceableEventLoaderService.getEvent(kinds.RelayList, pubkey);
    sub.connectWithHandler(requestSub, (event, next) => next(nip65ToUserMailboxes(event)));
  }

  receiveEvent(event: NostrEvent) {
    replaceableEventLoaderService.handleEvent(event);
  }
}

const userMailboxesService = new UserMailboxesService();

if (import.meta.env.DEV) {
  // @ts-ignore
  window.userMailboxesService = userMailboxesService;
}

export default userMailboxesService;
