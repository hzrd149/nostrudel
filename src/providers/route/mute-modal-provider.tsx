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
} from "@chakra-ui/react";
import dayjs from "dayjs";
import { PropsWithChildren, createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";

import { useActiveAccount } from "applesauce-react/hooks";
import { ChevronDownIcon } from "../../components/icons";
import UserAvatar from "../../components/user/user-avatar";
import UserLink from "../../components/user/user-link";
import { cloneList } from "../../helpers/nostr/lists";
import {
  createEmptyMuteList,
  getPubkeysExpiration,
  muteListAddPubkey,
  muteListRemovePubkey,
  pruneExpiredPubkeys,
} from "../../helpers/nostr/mute-list";
import { getDisplayName } from "../../helpers/nostr/profile";
import useUserMuteList from "../../hooks/use-user-mute-list";
import useUserProfile from "../../hooks/use-user-profile";
import { usePublishEvent } from "../global/publish-provider";
import { EventTemplate } from "nostr-tools";

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
  const publish = usePublishEvent();

  const account = useActiveAccount();
  const muteList = useUserMuteList(account?.pubkey);
  const handleClick = async (expiration: number) => {
    let draft = muteList ? cloneList(muteList) : createEmptyMuteList();
    draft = pruneExpiredPubkeys(draft);
    draft = muteListAddPubkey(draft, pubkey, expiration);

    await publish("Mute", draft);
    onClose();
  };

  return (
    <Modal onClose={onClose} size="lg" {...props}>
      <ModalOverlay />
      <ModalContent>
        <ModalHeader p="4">Mute {getDisplayName(metadata, pubkey)} for:</ModalHeader>
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
  const publish = usePublishEvent();
  const account = useActiveAccount()!;
  const muteList = useUserMuteList(account?.pubkey);
  const modal = useDisclosure();

  const unmuteAll = async () => {
    if (!muteList) return;
    let draft: EventTemplate = cloneList(muteList);
    draft = pruneExpiredPubkeys(draft);

    const pub = await publish("Unmute", draft);
    return !!pub;
  };

  const check = async () => {
    if (!muteList) return;
    if (modal.isOpen) return;

    const now = dayjs().unix();
    const expirations = getPubkeysExpiration(muteList);
    const expired = Object.entries(expirations).filter(([pubkey, ex]) => ex < now);

    if (expired.length > 0) {
      const accepted = await unmuteAll();
      if (!accepted) modal.onOpen();
    } else if (modal.isOpen) modal.onClose();
  };

  useEffect(() => {
    check();
  }, [muteList?.id]);

  return modal.isOpen ? <UnmuteModal onClose={modal.onClose} isOpen={modal.isOpen} /> : null;
}

function UnmuteModal({ onClose }: Omit<ModalProps, "children">) {
  const publish = usePublishEvent();
  const account = useActiveAccount()!;
  const muteList = useUserMuteList(account?.pubkey);

  const getExpiredPubkeys = useCallback(() => {
    if (!muteList) return [];
    const now = dayjs().unix();
    const expirations = getPubkeysExpiration(muteList);

    return Object.entries(expirations).filter(([pubkey, ex]) => ex < now);
  }, [muteList]);

  const unmuteAll = async () => {
    if (!muteList) return;
    let draft: EventTemplate = cloneList(muteList);
    draft = pruneExpiredPubkeys(draft);
    const pub = await publish("Unmute", draft);
    if (pub) onClose();
  };
  const extendAll = async (expiration: number) => {
    if (!muteList) return;
    const expired = getExpiredPubkeys();
    let draft: EventTemplate = cloneList(muteList);
    draft = pruneExpiredPubkeys(draft);
    for (const [pubkey] of expired) {
      draft = muteListAddPubkey(draft, pubkey, expiration);
    }

    const pub = await publish("Extend mute", draft);
    if (pub) onClose();
  };

  const unmuteUser = async (pubkey: string) => {
    if (!muteList) return;
    let draft: EventTemplate = cloneList(muteList);
    draft = muteListRemovePubkey(draft, pubkey);
    await publish("Unmute", draft);
  };
  const extendUser = async (pubkey: string, expiration: number) => {
    if (!muteList) return;
    let draft: EventTemplate = cloneList(muteList);
    draft = muteListRemovePubkey(draft, pubkey);
    draft = muteListAddPubkey(draft, pubkey, expiration);
    await publish("Extend mute", draft);
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
