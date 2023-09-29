import {
  Button,
  Flex,
  Modal,
  ModalBody,
  ModalCloseButton,
  ModalContent,
  ModalFooter,
  ModalHeader,
  ModalOverlay,
  ModalProps,
  SimpleGrid,
  useDisclosure,
  useToast,
} from "@chakra-ui/react";
import { PropsWithChildren, createContext, useCallback, useContext, useMemo, useState } from "react";
import dayjs from "dayjs";

import { getUserDisplayName } from "../helpers/user-metadata";
import { useUserMetadata } from "../hooks/use-user-metadata";
import { useCurrentAccount } from "../hooks/use-current-account";
import {
  createEmptyMuteList,
  getPubkeysExpiration,
  muteListAddPubkey,
  pruneExpiredPubkeys,
} from "../helpers/nostr/mute-list";
import { cloneList } from "../helpers/nostr/lists";
import { useSigningContext } from "./signing-provider";
import NostrPublishAction from "../classes/nostr-publish-action";
import clientRelaysService from "../services/client-relays";
import replaceableEventLoaderService from "../services/replaceable-event-requester";
import useUserMuteList from "../hooks/use-user-mute-list";
import { useInterval } from "react-use";
import { DraftNostrEvent } from "../types/nostr-event";
import { UserAvatar } from "../components/user-avatar";
import { UserLink } from "../components/user-link";

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
  const metadata = useUserMetadata(pubkey);
  const toast = useToast();
  const { requestSignature } = useSigningContext();

  const account = useCurrentAccount();
  const muteList = useUserMuteList(account?.pubkey, [], { ignoreCache: true });
  const handleClick = async (expiration: number) => {
    try {
      // mute user
      let draft = muteList ? cloneList(muteList) : createEmptyMuteList();
      draft = pruneExpiredPubkeys(draft);
      draft = muteListAddPubkey(draft, pubkey, expiration);

      const signed = await requestSignature(draft);
      new NostrPublishAction("Mute", clientRelaysService.getWriteUrls(), signed);
      replaceableEventLoaderService.handleEvent(signed);
      onClose();
    } catch (e) {
      if (e instanceof Error) toast({ description: e.message, status: "error" });
    }
  };

  return (
    <Modal onClose={onClose} size="lg" {...props}>
      <ModalOverlay />
      <ModalContent>
        <ModalHeader p="4">Mute {getUserDisplayName(metadata, pubkey)} for:</ModalHeader>
        <ModalCloseButton />
        <ModalBody px="4" py="0">
          <SimpleGrid columns={3} spacing="2">
            <Button variant="outline" onClick={() => handleClick(dayjs().add(1, "minute").unix())}>
              1 Minute
            </Button>
            <Button variant="outline" onClick={() => handleClick(dayjs().add(5, "minutes").unix())}>
              5 Minutes
            </Button>
            <Button variant="outline" onClick={() => handleClick(dayjs().add(30, "minutes").unix())}>
              30 Minutes
            </Button>
            <Button variant="outline" onClick={() => handleClick(dayjs().add(1, "hour").unix())}>
              1 Hour
            </Button>
            <Button variant="outline" onClick={() => handleClick(dayjs().add(5, "hours").unix())}>
              5 Hours
            </Button>
            <Button variant="outline" onClick={() => handleClick(dayjs().add(1, "day").unix())}>
              1 Day
            </Button>
            <Button variant="outline" onClick={() => handleClick(dayjs().add(3, "days").unix())}>
              3 Days
            </Button>
            <Button variant="outline" onClick={() => handleClick(dayjs().add(1, "week").unix())}>
              1 Week
            </Button>
            <Button variant="outline" onClick={() => handleClick(dayjs().add(2, "weeks").unix())}>
              2 Weeks
            </Button>
          </SimpleGrid>
          <Button variant="outline" onClick={() => handleClick(Infinity)} w="full" mt="2">
            Forever
          </Button>
        </ModalBody>
        <ModalFooter p="4">
          <Button onClick={onClose}>Cancel</Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}

function UnmuteModal({}) {
  const toast = useToast();
  const account = useCurrentAccount()!;
  const { requestSignature } = useSigningContext();
  const muteList = useUserMuteList(account?.pubkey, [], { ignoreCache: true });

  const modal = useDisclosure();
  const removeExpiredMutes = async () => {
    if (!muteList) return;
    try {
      // unmute users
      let draft: DraftNostrEvent = cloneList(muteList);
      draft = pruneExpiredPubkeys(muteList);

      const signed = await requestSignature(draft);
      new NostrPublishAction("Unmute Users", clientRelaysService.getWriteUrls(), signed);
      replaceableEventLoaderService.handleEvent(signed);
      modal.onClose();
    } catch (e) {
      if (e instanceof Error) toast({ description: e.message, status: "error" });
    }
  };

  const getExpiredPubkeys = () => {
    if (!muteList) return [];
    const now = dayjs().unix();
    const expirations = getPubkeysExpiration(muteList);
    return Object.entries(expirations)
      .filter(([pubkey, ex]) => ex < now)
      .map(([pubkey]) => pubkey);
  };
  useInterval(() => {
    if (!muteList) return;
    if (!modal.isOpen && getExpiredPubkeys().length > 0) {
      modal.onOpen();
    }
  }, 30 * 1000);

  return (
    <Modal onClose={modal.onClose} size="lg" isOpen={modal.isOpen}>
      <ModalOverlay />
      <ModalContent>
        <ModalHeader p="4">Unmute temporary muted users</ModalHeader>
        <ModalCloseButton />
        <ModalBody display="flex" flexWrap="wrap" gap="2" px="4" py="0">
          {getExpiredPubkeys().map((pubkey) => (
            <Flex gap="2" key={pubkey} alignItems="center">
              <UserAvatar pubkey={pubkey} size="sm" />
              <UserLink pubkey={pubkey} fontWeight="bold" />
            </Flex>
          ))}
        </ModalBody>
        <ModalFooter p="4">
          <Button onClick={modal.onClose} mr="3">
            Cancel
          </Button>
          <Button colorScheme="brand" onClick={removeExpiredMutes}>
            Unmute all
          </Button>
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
      <UnmuteModal />
      {muteUser && <MuteModal isOpen onClose={() => setMuteUser("")} pubkey={muteUser} />}
    </MuteModalContext.Provider>
  );
}
