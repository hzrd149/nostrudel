import React, { lazy, PropsWithChildren, Suspense, useCallback, useMemo, useState } from "react";
import { Spinner, useDisclosure } from "@chakra-ui/react";
import { ErrorBoundary } from "../../components/error-boundary";
import type { PostModalProps } from "../../components/post-modal";

const PostModal = lazy(() => import("../../components/post-modal"));

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
  }, [onClose, setInitProps]);

  const context = useMemo(() => ({ openModal }), [openModal]);

  return (
    <PostModalContext.Provider value={context}>
      <ErrorBoundary>
        {isOpen && (
          <Suspense fallback={<Spinner />}>
            <PostModal {...initProps} isOpen={isOpen} onClose={closeModal} />
          </Suspense>
        )}
        {children}
      </ErrorBoundary>
    </PostModalContext.Provider>
  );
}
