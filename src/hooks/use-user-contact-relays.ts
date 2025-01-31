import { useMemo } from "react";
import { getRelaysFromContactsEvent } from "applesauce-core/helpers/contacts";

import useUserContactList from "./use-user-contact-list";

export default function useUserContactRelays(pubkey?: string, additionalRelays?: Iterable<string>, force?: boolean) {
  const contacts = useUserContactList(pubkey, additionalRelays, force);

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
