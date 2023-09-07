import React, { PropsWithChildren, useContext } from "react";
import { NostrEvent } from "../types/nostr-event";
import { useCurrentAccount } from "../hooks/use-current-account";
import useUserContactList from "../hooks/use-user-contact-list";
import { getPubkeysFromList } from "../helpers/nostr/lists";

const TrustContext = React.createContext<boolean>(false);

export function useTrusted() {
  return useContext(TrustContext);
}

export function TrustProvider({
  children,
  event,
  trust = false,
}: PropsWithChildren & { event?: NostrEvent; trust?: boolean }) {
  const parentTrust = useContext(TrustContext);

  const account = useCurrentAccount();
  const contactList = useUserContactList(account?.pubkey);
  const following = contactList ? getPubkeysFromList(contactList).map((p) => p.pubkey) : [];

  const isEventTrusted = trust || (!!event && (event.pubkey === account?.pubkey || following.includes(event.pubkey)));

  return <TrustContext.Provider value={parentTrust || isEventTrusted}>{children}</TrustContext.Provider>;
}
