import { PropsWithChildren, createContext, useContext, useMemo, useState } from "react";
import { nip19 } from "nostr-tools";
import { useReadRelayUrls } from "../../hooks/use-client-relays";
import { useCurrentAccount } from "../../hooks/use-current-account";
import { useUserContacts } from "../../hooks/use-user-contacts";
import { isPTag } from "../../types/nostr-event";
import replaceableEventLoaderService from "../../services/replaceable-event-requester";
import useSubject from "../../hooks/use-subject";
import clientFollowingService from "../../services/client-following";

export type ListIdentifier = "following" | "global" | string;

export function useParsedNaddr(naddr?: string) {
  if (!naddr) return;
  try {
    const parsed = nip19.decode(naddr);

    if (parsed.type === "naddr") {
      return parsed.data;
    }
  } catch (e) {}
}

export function useList(naddr?: string) {
  const parsed = useMemo(() => useParsedNaddr(naddr), [naddr]);
  const readRelays = useReadRelayUrls(parsed?.relays ?? []);

  const sub = useMemo(() => {
    if (!parsed) return;
    return replaceableEventLoaderService.requestEvent(readRelays, parsed.kind, parsed.pubkey, parsed.identifier);
  }, [parsed]);

  return useSubject(sub);
}

export function useListPeople(list: ListIdentifier) {
  const contacts = useSubject(clientFollowingService.following);

  const listEvent = useList(list);

  if (list === "following") return contacts.map((t) => t[1]);
  if (listEvent) {
    return listEvent.tags.filter(isPTag).map((t) => t[1]);
  }
  return [];
}

export type PeopleListContextType = {
  list: string;
  people: string[];
  setList: (list: string) => void;
};
const PeopleListContext = createContext<PeopleListContextType>({ list: "following", setList: () => {}, people: [] });

export function usePeopleListContext() {
  return useContext(PeopleListContext);
}

export default function PeopleListProvider({ children }: PropsWithChildren) {
  const account = useCurrentAccount();
  const [list, setList] = useState(account ? "following" : "global");

  const people = useListPeople(list);
  const context = useMemo(
    () => ({
      people,
      list,
      setList,
    }),
    [list, setList],
  );

  return <PeopleListContext.Provider value={context}>{children}</PeopleListContext.Provider>;
}
