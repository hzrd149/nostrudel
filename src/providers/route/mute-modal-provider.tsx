import {
  Button,
  Modal,
  ModalBody,
  ModalCloseButton,
  ModalContent,
  ModalFooter,
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
    <Modal onClose={onClose} size="lg" {...props}>
      <ModalOverlay />
      <ModalContent>
        <ModalHeader p="4">Mute {getDisplayName(metadata, pubkey)}</ModalHeader>
        <ModalCloseButton />
        <ModalBody px="4" py="0" display="flex" gap="2">
          <Button onClick={() => run(false)} isDisabled={loading || muting}>
            Mute publicly
          </Button>
          <Button onClick={() => run(true)} isDisabled={loading || muting}>
            Mute privately
          </Button>
        </ModalBody>
        <ModalFooter p="4">
          <Button onClick={onClose}>Cancel</Button>
        </ModalFooter>
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
