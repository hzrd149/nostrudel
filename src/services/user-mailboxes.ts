import { EventTemplate, kinds, NostrEvent } from "nostr-tools";

import { isPTag } from "../types/nostr-event";
import SuperMap from "../classes/super-map";
import Subject from "../classes/subject";
import replaceableEventsService, { RequestOptions } from "./replaceable-events";
import RelaySet from "../classes/relay-set";
import { RelayMode } from "../classes/relay";
import { relaysFromContactsEvent } from "../helpers/nostr/contacts";
import { createCoordinate } from "../classes/batch-kind-loader";

export type UserMailboxes = {
  pubkey: string;
  event: NostrEvent | null;
  relays: RelaySet;
  inbox: RelaySet;
  outbox: RelaySet;
  created_at: number;
};

function nip65ToUserMailboxes(event: NostrEvent): UserMailboxes {
  return {
    pubkey: event.pubkey,
    event,
    relays: RelaySet.fromNIP65Event(event),
    inbox: RelaySet.fromNIP65Event(event, RelayMode.READ),
    outbox: RelaySet.fromNIP65Event(event, RelayMode.WRITE),
    created_at: event.created_at,
  };
}

class UserMailboxesService {
  private subjects = new SuperMap<string, Subject<UserMailboxes>>((pubkey) =>
    replaceableEventsService.getEvent(kinds.RelayList, pubkey).map(nip65ToUserMailboxes),
  );
  getMailboxes(pubkey: string) {
    return this.subjects.get(pubkey);
  }
  requestMailboxes(pubkey: string, relays: Iterable<string>, opts: RequestOptions = {}) {
    const sub = this.subjects.get(pubkey);
    replaceableEventsService.requestEvent(relays, kinds.RelayList, pubkey, undefined, opts);

    // also fetch the relays from the users contacts
    const contactsSub = replaceableEventsService.requestEvent(relays, kinds.Contacts, pubkey, undefined, opts);
    sub.connectWithMapper(contactsSub, (event, next, value) => {
      // NOTE: only use relays from contact list if the user does not have a NIP-65 relay list
      const relays = relaysFromContactsEvent(event);
      if (relays.length > 0 && !value) {
        next({
          pubkey: event.pubkey,
          event: null,
          relays: RelaySet.fromContactsEvent(event),
          inbox: RelaySet.fromContactsEvent(event, RelayMode.READ),
          outbox: RelaySet.fromContactsEvent(event, RelayMode.WRITE),
          created_at: event.created_at,
        });
      }
    });

    return sub;
  }

  async loadFromCache(pubkey: string) {
    const sub = this.subjects.get(pubkey);
    await replaceableEventsService.loadFromCache(createCoordinate(kinds.RelayList, pubkey));
    return sub;
  }

  receiveEvent(event: NostrEvent) {
    replaceableEventsService.handleEvent(event);
  }

  /** add missing relay hints to p tags */
  addPubkeyRelayHints(draft: EventTemplate) {
    return {
      ...draft,
      tags: draft.tags.map((t) => {
        if (isPTag(t) && !t[2]) {
          const mailboxes = this.getMailboxes(t[1]).value;
          if (mailboxes && mailboxes.inbox.urls.length > 0) {
            const newTag = [...t];
            // TODO: Pick the best mailbox for the user
            newTag[2] = mailboxes.inbox.urls[0];
            return newTag;
          } else return t;
        }
        return t;
      }),
    };
  }
}

const userMailboxesService = new UserMailboxesService();

if (import.meta.env.DEV) {
  // @ts-ignore
  window.userMailboxesService = userMailboxesService;
}

export default userMailboxesService;
