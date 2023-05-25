import React, { PropsWithChildren, useContext } from "react";
import { NostrEvent } from "../../types/nostr-event";
import { useReadRelayUrls } from "../../hooks/use-client-relays";
import { useUserContacts } from "../../hooks/use-user-contacts";
import { useCurrentAccount } from "../../hooks/use-current-account";

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
  const readRelays = useReadRelayUrls();
  const contacts = useUserContacts(account.pubkey, readRelays);
  const following = contacts?.contacts || [];

  const isEventTrusted = trust || (!!event && (event.pubkey === account.pubkey || following.includes(event.pubkey)));

  return <TrustContext.Provider value={parentTrust || isEventTrusted}>{children}</TrustContext.Provider>;
}
