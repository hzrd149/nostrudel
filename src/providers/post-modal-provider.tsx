import React, { PropsWithChildren, useCallback, useMemo, useState } from "react";
import { useDisclosure } from "@chakra-ui/react";
import { ErrorBoundary } from "../components/error-boundary";
import PostModal from "../components/post-modal";

export type PostModalContextType = {
  openModal: (content?: string) => void;
};

export const PostModalContext = React.createContext<PostModalContextType>({
  openModal: () => {},
});

export default function PostModalProvider({ children }: PropsWithChildren) {
  const { isOpen, onOpen, onClose } = useDisclosure();
  const [initContent, setInitContent] = useState("");
  const openModal = useCallback(
    (content?: string) => {
      if (content) setInitContent(content);
      onOpen();
    },
    [onOpen, setInitContent],
  );
  const context = useMemo(() => ({ openModal }), [openModal]);

  return (
    <PostModalContext.Provider value={context}>
      <ErrorBoundary>
        {isOpen && <PostModal isOpen={isOpen} onClose={onClose} initContent={initContent} />}
        {children}
      </ErrorBoundary>
    </PostModalContext.Provider>
  );
}
