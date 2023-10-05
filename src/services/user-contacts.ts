import { isPTag, NostrEvent } from "../types/nostr-event";
import { safeJson } from "../helpers/parse";
import SuperMap from "../classes/super-map";
import Subject from "../classes/subject";
import { RelayConfig, RelayMode } from "../classes/relay";
import { normalizeRelayConfigs } from "../helpers/relay";
import replaceableEventLoaderService, { RequestOptions } from "./replaceable-event-requester";
import { Kind } from "nostr-tools";

export type UserContacts = {
  pubkey: string;
  relays: RelayConfig[];
  contacts: string[];
  contactRelay: Record<string, string | undefined>;
  created_at: number;
};

type RelayJson = Record<string, { read: boolean; write: boolean }>;
function relayJsonToRelayConfig(relayJson: RelayJson): RelayConfig[] {
  try {
    return Array.from(Object.entries(relayJson)).map(([url, opts]) => ({
      url,
      mode: (opts.write ? RelayMode.WRITE : 0) | (opts.read ? RelayMode.READ : 0),
    }));
  } catch (e) {}
  return [];
}

function parseContacts(event: NostrEvent): UserContacts {
  const relayJson = safeJson(event.content, {}) as RelayJson;
  const relays = normalizeRelayConfigs(relayJsonToRelayConfig(relayJson));

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
  requestContacts(pubkey: string, relays: string[], opts?: RequestOptions) {
    const sub = this.subjects.get(pubkey);

    const requestSub = replaceableEventLoaderService.requestEvent(relays, Kind.Contacts, pubkey, undefined, opts);

    sub.connectWithHandler(requestSub, (event, next) => next(parseContacts(event)));

    return sub;
  }

  receiveEvent(event: NostrEvent) {
    replaceableEventLoaderService.handleEvent(event);
  }
}

/** @deprecated */
const userContactsService = new UserContactsService();

if (import.meta.env.DEV) {
  // @ts-ignore
  window.userContactsService = userContactsService;
}

export default userContactsService;
