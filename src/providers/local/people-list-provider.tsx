import { PropsWithChildren, createContext, useCallback, useContext, useMemo } from "react";
import { getProfilePointersFromList } from "applesauce-core/helpers";
import { useActiveAccount } from "applesauce-react/hooks";
import { Filter, kinds } from "nostr-tools";

import useReplaceableEvent from "../../hooks/use-replaceable-event";
import { NostrEvent } from "nostr-tools";
import useRouteSearchValue from "../../hooks/use-route-search-value";

export type ListId = "following" | "global" | "self" | string;
export type Person = { pubkey: string; relay?: string };

export type PeopleListContextType = {
  selected: ListId;
  listId?: string;
  listEvent?: NostrEvent;
  people: Person[] | undefined;
  setSelected: (list: ListId) => void;
  filter: Filter | undefined;
};
const PeopleListContext = createContext<PeopleListContextType>({
  setSelected: () => {},
  people: undefined,
  selected: "global",
  filter: undefined,
});

export function usePeopleListContext() {
  return useContext(PeopleListContext);
}

function useListCoordinate(listId: ListId) {
  const account = useActiveAccount();

  return useMemo(() => {
    if (listId === "following") return account ? `${kinds.Contacts}:${account.pubkey}` : undefined;
    if (listId === "self") return undefined;
    if (listId === "global") return undefined;
    return listId;
  }, [listId, account]);
}

export function usePeopleListSelect(selected: ListId, onChange: (list: ListId) => void): PeopleListContextType {
  const account = useActiveAccount();

  const listId = useListCoordinate(selected);
  const listEvent = useReplaceableEvent(listId);

  const people = useMemo(() => listEvent && getProfilePointersFromList(listEvent), [listEvent]);

  const filter = useMemo<Filter | undefined>(() => {
    if (selected === "global") return {};
    if (selected === "self") {
      if (account) return { authors: [account.pubkey] };
      else return undefined;
    }
    if (!people || people.length === 0) return undefined;

    return { authors: people.map((p) => p.pubkey) };
  }, [people, selected, account]);

  return {
    people,
    selected,
    listId,
    listEvent,
    setSelected: onChange,
    filter,
  };
}

export type PeopleListProviderProps = PropsWithChildren & {
  initList?: ListId;
};
export default function PeopleListProvider({ children, initList }: PeopleListProviderProps) {
  const account = useActiveAccount();
  const peopleParam = useRouteSearchValue("people");

  const selected = peopleParam.value || (initList as ListId) || (account ? "following" : "global");
  const setSelected = useCallback(
    (value: ListId) => {
      peopleParam.setValue(value);
    },
    [peopleParam.setValue],
  );

  const context = usePeopleListSelect(selected, setSelected);

  return <PeopleListContext.Provider value={context}>{children}</PeopleListContext.Provider>;
}
