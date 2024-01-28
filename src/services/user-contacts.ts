import { kinds } from "nostr-tools";

import { isPTag, NostrEvent } from "../types/nostr-event";
import { safeJson } from "../helpers/parse";
import SuperMap from "../classes/super-map";
import Subject from "../classes/subject";
import replaceableEventLoaderService, { RequestOptions } from "./replaceable-event-requester";
import RelaySet from "../classes/relay-set";

export type UserContacts = {
  pubkey: string;
  relays: RelaySet;
  inbox: RelaySet;
  outbox: RelaySet;
  contacts: string[];
  contactRelay: Record<string, string | undefined>;
  created_at: number;
};

type RelayJson = Record<string, { read: boolean; write: boolean }>;
function relayJsonToMailboxes(relayJson: RelayJson) {
  const relays = new RelaySet();
  const inbox = new RelaySet();
  const outbox = new RelaySet();
  for (const [url, opts] of Object.entries(relayJson)) {
    relays.add(url);
    if (opts.write) outbox.add(url);
    if (opts.read) inbox.add(url);
  }
  return { relays, inbox, outbox };
}

function parseContacts(event: NostrEvent): UserContacts {
  const relayJson = safeJson(event.content, {}) as RelayJson;
  const { relays, inbox, outbox } = relayJsonToMailboxes(relayJson);

  const pubkeys = event.tags.filter(isPTag).map((tag) => tag[1]);
  const contactRelay = event.tags.filter(isPTag).reduce(
    (dir, tag) => {
      if (tag[2]) {
        dir[tag[1]] = tag[2];
      }
      return dir;
    },
    {} as Record<string, string>,
  );

  return {
    pubkey: event.pubkey,
    relays,
    inbox,
    outbox,
    contacts: pubkeys,
    contactRelay,
    created_at: event.created_at,
  };
}

class UserContactsService {
  private subjects = new SuperMap<string, Subject<UserContacts>>(() => new Subject<UserContacts>());
  getSubject(pubkey: string) {
    return this.subjects.get(pubkey);
  }
  requestContacts(pubkey: string, relays: Iterable<string>, opts?: RequestOptions) {
    const sub = this.subjects.get(pubkey);

    const requestSub = replaceableEventLoaderService.requestEvent(relays, kinds.Contacts, pubkey, undefined, opts);

    sub.connectWithHandler(requestSub, (event, next) => next(parseContacts(event)));

    return sub;
  }

  /** @deprecated */
  receiveEvent(event: NostrEvent) {
    replaceableEventLoaderService.handleEvent(event);
  }
}

const userContactsService = new UserContactsService();

if (import.meta.env.DEV) {
  // @ts-ignore
  window.userContactsService = userContactsService;
}

export default userContactsService;
