import React, { PropsWithChildren, useMemo } from "react";
import { useDisclosure } from "@chakra-ui/react";
import { ErrorBoundary } from "../components/error-boundary";
import PostModal from "../components/post-modal";
import { DraftNostrEvent } from "../types/nostr-event";

export type PostModalContextType = {
  openModal: (draft?: Partial<DraftNostrEvent>) => void;
};

export const PostModalContext = React.createContext<PostModalContextType>({
  openModal: () => {},
});

export default function PostModalProvider({ children }: PropsWithChildren) {
  const { isOpen, onOpen, onClose } = useDisclosure();
  const context = useMemo(() => ({ openModal: onOpen }), [onOpen]);

  return (
    <PostModalContext.Provider value={context}>
      <ErrorBoundary>
        {isOpen && <PostModal isOpen onClose={onClose} />}
        {children}
      </ErrorBoundary>
    </PostModalContext.Provider>
  );
}
