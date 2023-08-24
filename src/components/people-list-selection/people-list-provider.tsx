import { PropsWithChildren, createContext, useContext, useMemo, useState } from "react";
import { Kind } from "nostr-tools";

import { useCurrentAccount } from "../../hooks/use-current-account";
import { getPubkeysFromList } from "../../helpers/nostr/lists";
import useReplaceableEvent from "../../hooks/use-replaceable-event";

export type PeopleListContextType = {
  list?: string;
  people: { pubkey: string; relay?: string }[] | undefined;
  setList: (list: string | undefined) => void;
};
const PeopleListContext = createContext<PeopleListContextType>({ list: "following", setList: () => {}, people: [] });

export function usePeopleListContext() {
  return useContext(PeopleListContext);
}

export default function PeopleListProvider({ children }: PropsWithChildren) {
  const account = useCurrentAccount();
  const [listCord, setList] = useState(account ? `${Kind.Contacts}:${account.pubkey}` : undefined);
  const listEvent = useReplaceableEvent(listCord);

  const people = listEvent && getPubkeysFromList(listEvent);
  const context = useMemo(
    () => ({
      people,
      list: listCord,
      setList,
    }),
    [listCord, setList, people],
  );

  return <PeopleListContext.Provider value={context}>{children}</PeopleListContext.Provider>;
}
