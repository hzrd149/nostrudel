import React, { PropsWithChildren, useContext, useMemo, useState } from "react";
import { NostrEvent } from "../../types/nostr-event";
import useCurrentAccount from "../../hooks/use-current-account";
import useUserContactList from "../../hooks/use-user-contact-list";
import { getPubkeysFromList } from "../../helpers/nostr/lists";

const TrustContext = React.createContext<{ trust: boolean; setOverride: (trust: boolean) => void }>({
  trust: false,
  setOverride: () => {},
});

export function useTrustContext() {
  return useContext(TrustContext);
}

export function TrustProvider({
  children,
  event,
  trust = false,
  allowOverride = true,
}: PropsWithChildren & { event?: NostrEvent; trust?: boolean; allowOverride?: boolean }) {
  const { trust: parentTrust } = useContext(TrustContext);
  const [override, setOverride] = useState<boolean>();

  const account = useCurrentAccount();
  const contactList = useUserContactList(account?.pubkey);
  const following = contactList ? getPubkeysFromList(contactList).map((p) => p.pubkey) : [];

  const isEventTrusted = trust || (!!event && (event.pubkey === account?.pubkey || following.includes(event.pubkey)));

  const context = useMemo(() => {
    const trust = parentTrust || isEventTrusted;
    return {
      trust: allowOverride ? (override ?? trust) : trust,
      setOverride: (v: boolean) => allowOverride && setOverride(v),
    };
  }, [override, parentTrust, isEventTrusted, setOverride, allowOverride]);

  return <TrustContext.Provider value={context}>{children}</TrustContext.Provider>;
}
