import React, { PropsWithChildren, useContext } from "react";
import { NostrEvent } from "../../types/nostr-event";
import { useCurrentAccount } from "../../hooks/use-current-account";
import clientFollowingService from "../../services/client-following";
import useSubject from "../../hooks/use-subject";

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
  const following = useSubject(clientFollowingService.following).map((p) => p[1]);

  const isEventTrusted = trust || (!!event && (event.pubkey === account?.pubkey || following.includes(event.pubkey)));

  return <TrustContext.Provider value={parentTrust || isEventTrusted}>{children}</TrustContext.Provider>;
}
