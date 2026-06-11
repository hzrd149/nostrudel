import { NostrEvent } from "nostr-tools";
import { PropsWithChildren, createContext, useCallback, useContext, useMemo, useState } from "react";

import ListHistoryModal from "../../views/lists/components/list-history-modal";

type ListHistoryModalContextType = {
  openModal: (list: NostrEvent) => void;
};

const ListHistoryModalContext = createContext<ListHistoryModalContextType>({
  openModal: () => {},
});

export function useListHistoryModalContext() {
  return useContext(ListHistoryModalContext);
}

export default function ListHistoryModalProvider({ children }: PropsWithChildren) {
  const [list, setList] = useState<NostrEvent>();

  const openModal = useCallback((list: NostrEvent) => setList(list), []);

  const context = useMemo(() => ({ openModal }), [openModal]);

  return (
    <ListHistoryModalContext.Provider value={context}>
      {children}
      {list && <ListHistoryModal isOpen list={list} onClose={() => setList(undefined)} />}
    </ListHistoryModalContext.Provider>
  );
}
