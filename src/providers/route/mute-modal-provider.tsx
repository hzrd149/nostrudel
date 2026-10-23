import {
  Button,
  Modal,
  ModalBody,
  ModalCloseButton,
  ModalContent,
  ModalHeader,
  ModalOverlay,
  ModalProps,
} from "@chakra-ui/react";
import { PropsWithChildren, createContext, useCallback, useContext, useMemo, useState } from "react";

import { getDisplayName } from "../../helpers/nostr/profile";
import useAsyncAction from "../../hooks/use-async-action";
import useUserMuteActions from "../../hooks/use-user-mute-actions";
import useUserProfile from "../../hooks/use-user-profile";

type MuteModalContextType = {
  openModal: (pubkey: string) => void;
};

const MuteModalContext = createContext<MuteModalContextType>({
  openModal: () => {},
});

export function useMuteModalContext() {
  return useContext(MuteModalContext);
}

function MuteModal({ pubkey, onClose, ...props }: Omit<ModalProps, "children"> & { pubkey: string }) {
  const metadata = useUserProfile(pubkey);
  const { mute, muting } = useUserMuteActions(pubkey);
  const { run, loading } = useAsyncAction(
    async (hidden: boolean) => {
      const result = await mute(hidden);
      if (result !== undefined) onClose();
    },
    [mute, onClose],
  );

  return (
    <Modal onClose={onClose} size="sm" {...props}>
      <ModalOverlay />
      <ModalContent mx="2" overflow="hidden">
        <ModalHeader p="4" pr="12" overflowWrap="anywhere">
          Mute {getDisplayName(metadata, pubkey)}
        </ModalHeader>
        <ModalCloseButton />
        <ModalBody p="0" pb="2" display="flex" flexDirection="column">
          <Button
            variant="ghost"
            justifyContent="flex-start"
            borderRadius="0"
            px="4"
            minH="12"
            onClick={() => run(false)}
            isDisabled={loading || muting}
          >
            Mute publicly
          </Button>
          <Button
            variant="ghost"
            justifyContent="flex-start"
            borderRadius="0"
            px="4"
            minH="12"
            onClick={() => run(true)}
            isDisabled={loading || muting}
          >
            Mute privately
          </Button>
          <Button variant="ghost" justifyContent="flex-start" borderRadius="0" px="4" minH="12" onClick={onClose}>
            Cancel
          </Button>
        </ModalBody>
      </ModalContent>
    </Modal>
  );
}

export default function MuteModalProvider({ children }: PropsWithChildren) {
  const [muteUser, setMuteUser] = useState("");

  const openModal = useCallback(
    (pubkey: string) => {
      setMuteUser(pubkey);
    },
    [setMuteUser],
  );

  const context = useMemo(() => ({ openModal }), [openModal]);

  return (
    <MuteModalContext.Provider value={context}>
      {children}
      {muteUser && <MuteModal isOpen onClose={() => setMuteUser("")} pubkey={muteUser} />}
    </MuteModalContext.Provider>
  );
}
