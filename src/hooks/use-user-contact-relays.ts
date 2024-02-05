import { useMemo } from "react";
import { RequestOptions } from "../services/replaceable-event-requester";
import RelaySet from "../classes/relay-set";
import useUserContactList from "./use-user-contact-list";
import { RelayMode } from "../classes/relay";
import { relaysFromContactsEvent } from "../helpers/nostr/contacts";

export default function useUserContactRelays(
  pubkey?: string,
  additionalRelays?: Iterable<string>,
  opts: RequestOptions = {},
) {
  const contacts = useUserContactList(pubkey, additionalRelays, opts);

  return useMemo(() => {
    if (!contacts) return undefined;
    if (contacts.content.length === 0) return null;

    const relays = relaysFromContactsEvent(contacts);
    const inbox = new RelaySet(relays.filter((r) => r.mode & RelayMode.READ).map((r) => r.url));
    const outbox = new RelaySet(relays.filter((r) => r.mode & RelayMode.WRITE).map((r) => r.url));

    return { inbox, outbox };
  }, [contacts]);
}
