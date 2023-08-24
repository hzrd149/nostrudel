import { PropsWithChildren, createContext, useContext, useMemo, useState } from "react";
import { nip19 } from "nostr-tools";
import { useCurrentAccount } from "../../hooks/use-current-account";
import useUserContactList from "../../hooks/use-user-contact-list";
import { getPubkeysFromList } from "../../helpers/nostr/lists";
import useReplaceableEvent from "../../hooks/use-replaceable-event";

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

export function useListPeople(list: ListIdentifier) {
  const account = useCurrentAccount();
  const contacts = useUserContactList(account?.pubkey);

  const listEvent = useReplaceableEvent(list.includes(":") ? list : undefined);

  if (list === "following") return contacts ? getPubkeysFromList(contacts) : [];
  if (listEvent) {
    return getPubkeysFromList(listEvent);
  }
  return [];
}

export type PeopleListContextType = {
  list: string;
  people: { pubkey: string; relay?: string }[];
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
