import {
  AddressPointerWithoutD,
  getAddressPointerForEvent,
  getProfilePointersFromList,
  getReplaceableIdentifier,
  parseCoordinate,
} from "applesauce-core/helpers";
import { useActiveAccount } from "applesauce-react/hooks";
import { Filter, NostrEvent, kinds } from "nostr-tools";
import { AddressPointer, ProfilePointer } from "nostr-tools/nip19";
import { PropsWithChildren, createContext, useCallback, useContext, useMemo } from "react";

import useReplaceableEvent from "../../hooks/use-replaceable-event";
import useRouteSearchValue from "../../hooks/use-route-search-value";
import { LoadableAddressPointer } from "applesauce-loaders/loaders";

export type ListId = "following" | "global" | "self" | string;

export type PeopleListContextType = {
  selected: ListId;
  listId?: string;
  pointer?: AddressPointer;
  listEvent?: NostrEvent;
  people: ProfilePointer[] | undefined;
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
  const event = useReplaceableEvent(listId);
  const pointer = useMemo(() => (event ? getAddressPointerForEvent(event) : undefined), [event]);
  const people = useMemo(() => event && getProfilePointersFromList(event), [event]);

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
    pointer,
    listEvent: event,
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
