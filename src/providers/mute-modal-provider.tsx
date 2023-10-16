import {
  Button,
  Flex,
  Menu,
  MenuButton,
  MenuItem,
  MenuList,
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
import { useInterval } from "react-use";

import { getUserDisplayName } from "../helpers/user-metadata";
import { useUserMetadata } from "../hooks/use-user-metadata";
import { useCurrentAccount } from "../hooks/use-current-account";
import {
  createEmptyMuteList,
  getPubkeysExpiration,
  muteListAddPubkey,
  muteListRemovePubkey,
  pruneExpiredPubkeys,
} from "../helpers/nostr/mute-list";
import { cloneList } from "../helpers/nostr/lists";
import { useSigningContext } from "./signing-provider";
import NostrPublishAction from "../classes/nostr-publish-action";
import clientRelaysService from "../services/client-relays";
import replaceableEventLoaderService from "../services/replaceable-event-requester";
import useUserMuteList from "../hooks/use-user-mute-list";
import { DraftNostrEvent } from "../types/nostr-event";
import { UserAvatar } from "../components/user-avatar";
import { UserLink } from "../components/user-link";
import { ChevronDownIcon } from "../components/icons";

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

function UnmuteHandler() {
  const toast = useToast();
  const account = useCurrentAccount()!;
  const { requestSignature } = useSigningContext();
  const muteList = useUserMuteList(account?.pubkey, [], { ignoreCache: true });
  const modal = useDisclosure();

  const unmuteAll = async () => {
    if (!muteList) return;
    try {
      let draft: DraftNostrEvent = cloneList(muteList);
      draft = pruneExpiredPubkeys(draft);

      const signed = await requestSignature(draft);
      new NostrPublishAction("Unmute", clientRelaysService.getWriteUrls(), signed);
      replaceableEventLoaderService.handleEvent(signed);
      return true;
    } catch (e) {
      if (e instanceof Error) toast({ description: e.message, status: "error" });
    }
    return false;
  };

  const check = async () => {
    if (!muteList) return;
    const now = dayjs().unix();
    const expirations = getPubkeysExpiration(muteList);
    const expired = Object.entries(expirations).filter(([pubkey, ex]) => ex < now);

    if (expired.length > 0) {
      const accepted = await unmuteAll();
      if (!accepted) modal.onOpen();
    } else if (modal.isOpen) modal.onClose();
  };

  useInterval(check, 10 * 1000);

  return modal.isOpen ? <UnmuteModal onClose={modal.onClose} isOpen={modal.isOpen} /> : null;
}

function UnmuteModal({ onClose }: Omit<ModalProps, "children">) {
  const toast = useToast();
  const account = useCurrentAccount()!;
  const { requestSignature } = useSigningContext();
  const muteList = useUserMuteList(account?.pubkey, [], { ignoreCache: true });

  const getExpiredPubkeys = useCallback(() => {
    if (!muteList) return [];
    const now = dayjs().unix();
    const expirations = getPubkeysExpiration(muteList);

    return Object.entries(expirations).filter(([pubkey, ex]) => ex < now);
  }, [muteList]);

  const unmuteAll = async () => {
    if (!muteList) return;
    try {
      let draft: DraftNostrEvent = cloneList(muteList);
      draft = pruneExpiredPubkeys(draft);

      const signed = await requestSignature(draft);
      new NostrPublishAction("Unmute", clientRelaysService.getWriteUrls(), signed);
      replaceableEventLoaderService.handleEvent(signed);
      onClose();
    } catch (e) {
      if (e instanceof Error) toast({ description: e.message, status: "error" });
    }
  };
  const extendAll = async (expiration: number) => {
    if (!muteList) return;
    try {
      const expired = getExpiredPubkeys();
      let draft: DraftNostrEvent = cloneList(muteList);
      draft = pruneExpiredPubkeys(draft);
      for (const [pubkey] of expired) {
        draft = muteListAddPubkey(draft, pubkey, expiration);
      }

      const signed = await requestSignature(draft);
      new NostrPublishAction("Extend mute", clientRelaysService.getWriteUrls(), signed);
      replaceableEventLoaderService.handleEvent(signed);
      onClose();
    } catch (e) {
      if (e instanceof Error) toast({ description: e.message, status: "error" });
    }
  };

  const unmuteUser = async (pubkey: string) => {
    if (!muteList) return;
    try {
      let draft: DraftNostrEvent = cloneList(muteList);
      draft = muteListRemovePubkey(draft, pubkey);

      const signed = await requestSignature(draft);
      new NostrPublishAction("Unmute", clientRelaysService.getWriteUrls(), signed);
      replaceableEventLoaderService.handleEvent(signed);
    } catch (e) {
      if (e instanceof Error) toast({ description: e.message, status: "error" });
    }
  };
  const extendUser = async (pubkey: string, expiration: number) => {
    if (!muteList) return;
    try {
      let draft: DraftNostrEvent = cloneList(muteList);
      draft = muteListRemovePubkey(draft, pubkey);
      draft = muteListAddPubkey(draft, pubkey, expiration);

      const signed = await requestSignature(draft);
      new NostrPublishAction("Extend mute", clientRelaysService.getWriteUrls(), signed);
      replaceableEventLoaderService.handleEvent(signed);
    } catch (e) {
      if (e instanceof Error) toast({ description: e.message, status: "error" });
    }
  };

  const expiredPubkeys = getExpiredPubkeys().map(([pubkey]) => pubkey);
  return (
    <Modal onClose={onClose} isOpen size="xl">
      <ModalOverlay />
      <ModalContent>
        <ModalHeader p="4">Unmute temporary muted users</ModalHeader>
        <ModalCloseButton />
        <ModalBody display="flex" flexDirection="column" gap="2" px="4" py="0">
          {expiredPubkeys.map((pubkey) => (
            <Flex gap="2" key={pubkey} alignItems="center">
              <UserAvatar pubkey={pubkey} size="sm" />
              <UserLink pubkey={pubkey} fontWeight="bold" />
              <Menu>
                <MenuButton as={Button} size="sm" ml="auto" rightIcon={<ChevronDownIcon />}>
                  Extend
                </MenuButton>
                <MenuList>
                  <MenuItem onClick={() => extendUser(pubkey, Infinity)}>Forever</MenuItem>
                  <MenuItem onClick={() => extendUser(pubkey, dayjs().add(30, "minutes").unix())}>30 Minutes</MenuItem>
                  <MenuItem onClick={() => extendUser(pubkey, dayjs().add(1, "day").unix())}>1 Day</MenuItem>
                  <MenuItem onClick={() => extendUser(pubkey, dayjs().add(1, "week").unix())}>1 Week</MenuItem>
                </MenuList>
              </Menu>
              <Button onClick={() => unmuteUser(pubkey)} size="sm">
                Unmute
              </Button>
            </Flex>
          ))}
        </ModalBody>
        <ModalFooter p="4">
          <Menu>
            <MenuButton as={Button} mr="2" rightIcon={<ChevronDownIcon />}>
              Extend
            </MenuButton>
            <MenuList>
              <MenuItem onClick={() => extendAll(Infinity)}>Forever</MenuItem>
              <MenuItem onClick={() => extendAll(dayjs().add(30, "minutes").unix())}>30 Minutes</MenuItem>
              <MenuItem onClick={() => extendAll(dayjs().add(1, "day").unix())}>1 Day</MenuItem>
              <MenuItem onClick={() => extendAll(dayjs().add(1, "week").unix())}>1 Week</MenuItem>
            </MenuList>
          </Menu>
          <Button colorScheme="primary" onClick={unmuteAll}>
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
      {muteUser && <MuteModal isOpen onClose={() => setMuteUser("")} pubkey={muteUser} />}
      <UnmuteHandler />
    </MuteModalContext.Provider>
  );
}
