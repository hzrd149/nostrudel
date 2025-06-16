import { getRelaysFromContactsEvent } from "applesauce-core/helpers/contacts";
import { useMemo } from "react";
import { ProfilePointer } from "nostr-tools/nip19";

import useUserContactList from "./use-user-contact-list";

export default function useUserContactRelays(user?: string | ProfilePointer) {
  const contacts = useUserContactList(user);

  return useMemo(() => {
    if (!contacts) return undefined;
    if (contacts.content.length === 0) return null;

    const relays = getRelaysFromContactsEvent(contacts);
    if (!relays) return undefined;

    const inbox = Array.from(relays?.entries())
      .filter(([relay, mode]) => mode === "inbox" || mode === "all")
      .map(([relay]) => relay);

    const outbox = Array.from(relays?.entries())
      .filter(([relay, mode]) => mode === "outbox" || mode === "all")
      .map(([relay]) => relay);

    return { inbox, outbox };
  }, [contacts]);
}
