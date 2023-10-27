import React, { PropsWithChildren, useCallback, useMemo, useState } from "react";
import { useDisclosure } from "@chakra-ui/react";
import { ErrorBoundary } from "../components/error-boundary";
import PostModal, { PostModalProps } from "../components/post-modal";

export type PostModalContextType = {
  openModal: (props?: PostModalProps) => void;
};

export const PostModalContext = React.createContext<PostModalContextType>({
  openModal: () => {},
});

export default function PostModalProvider({ children }: PropsWithChildren) {
  const { isOpen, onOpen, onClose } = useDisclosure();
  const [initProps, setInitProps] = useState<PostModalProps>({});

  const openModal = useCallback(
    (props?: PostModalProps) => {
      setInitProps(props ?? {});
      onOpen();
    },
    [onOpen, setInitProps],
  );
  const closeModal = useCallback(() => {
    setInitProps({});
    onClose();
  }, [onOpen, setInitProps]);

  const context = useMemo(() => ({ openModal }), [openModal]);

  return (
    <PostModalContext.Provider value={context}>
      <ErrorBoundary>
        {isOpen && <PostModal {...initProps} isOpen={isOpen} onClose={closeModal} />}
        {children}
      </ErrorBoundary>
    </PostModalContext.Provider>
  );
}
