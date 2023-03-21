import { useDisclosure } from "@chakra-ui/react";
import React, { useCallback, useMemo, useState } from "react";
import { ErrorBoundary } from "../components/error-boundary";
import { PostModal } from "../components/post-modal";
import { DraftNostrEvent } from "../types/nostr-event";

export type PostModalContextType = {
  openModal: (draft?: Partial<DraftNostrEvent>) => void;
};

export const PostModalContext = React.createContext<PostModalContextType>({
  openModal: () => {},
});

export const PostModalProvider = ({ children }: { children: React.ReactNode }) => {
  const { isOpen, onOpen, onClose } = useDisclosure();
  const [draft, setDraft] = useState<Partial<DraftNostrEvent> | undefined>(undefined);
  const openModal = useCallback(
    (draft?: Partial<DraftNostrEvent>) => {
      setDraft(draft);
      onOpen();
    },
    [setDraft, onOpen]
  );
  const context = useMemo(() => ({ openModal }), [openModal]);

  return (
    <PostModalContext.Provider value={context}>
      <ErrorBoundary>
        {isOpen && <PostModal isOpen initialDraft={draft} onClose={onClose} />}
        {children}
      </ErrorBoundary>
    </PostModalContext.Provider>
  );
};
