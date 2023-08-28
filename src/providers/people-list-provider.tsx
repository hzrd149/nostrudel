import { PropsWithChildren, createContext, useCallback, useContext, useMemo } from "react";
import { Kind } from "nostr-tools";
import { useSearchParams } from "react-router-dom";

import { useCurrentAccount } from "../hooks/use-current-account";
import { getPubkeysFromList } from "../helpers/nostr/lists";
import useReplaceableEvent from "../hooks/use-replaceable-event";
import { NostrEvent } from "../types/nostr-event";
import { NostrQuery } from "../types/nostr-query";
import { searchParamsToJson } from "../helpers/url";

export type ListId = "global" | string;
export type Person = { pubkey: string; relay?: string };

export type PeopleListContextType = {
  list: ListId;
  listEvent?: NostrEvent;
  people: Person[] | undefined;
  setList: (list: ListId) => void;
  filter: NostrQuery | undefined;
};
const PeopleListContext = createContext<PeopleListContextType>({
  setList: () => {},
  people: undefined,
  list: "global",
  filter: undefined,
});

export function usePeopleListContext() {
  return useContext(PeopleListContext);
}

export type PeopleListProviderProps = PropsWithChildren & {
  initList?: "following" | "global";
};
export default function PeopleListProvider({ children, initList = "following" }: PeopleListProviderProps) {
  const account = useCurrentAccount();
  const [params, setParams] = useSearchParams({
    people: account && initList === "following" ? `${Kind.Contacts}:${account.pubkey}` : "global",
  });

  const list = params.get("people") as ListId;
  const setList = useCallback(
    (value: ListId) => {
      setParams((p) => ({ ...searchParamsToJson(p), people: value }));
    },
    [setParams],
  );

  const listEvent = useReplaceableEvent(list !== "global" ? list : undefined, [], true);

  const people = listEvent && getPubkeysFromList(listEvent);

  const filter = useMemo<NostrQuery | undefined>(() => {
    if (list === "global") return {};
    return people && { authors: people.map((p) => p.pubkey) };
  }, [people, list]);

  const context = useMemo(
    () => ({
      people,
      list,
      listEvent,
      setList,
      filter,
    }),
    [list, setList, people, listEvent],
  );

  return <PeopleListContext.Provider value={context}>{children}</PeopleListContext.Provider>;
}
