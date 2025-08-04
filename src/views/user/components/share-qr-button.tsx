import {
  Flex,
  HStack,
  IconButton,
  IconButtonProps,
  Input,
  List,
  ListItem,
  Modal,
  ModalBody,
  ModalCloseButton,
  ModalContent,
  ModalOverlay,
  Tab,
  TabList,
  TabPanel,
  TabPanels,
  Tabs,
  Text,
  useDisclosure,
} from "@chakra-ui/react";
import { nip19 } from "nostr-tools";
import { useEffect, useMemo, useState } from "react";

import { useActiveAccount } from "applesauce-react/hooks";
import { nprofileEncode, ProfilePointer } from "nostr-tools/nip19";
import { CopyIconButton } from "../../../components/copy-icon-button";
import { CheckIcon, QrCodeIcon } from "../../../components/icons";
import QrCodeSvg from "../../../components/qr-code/qr-code-svg";
import RelayFavicon from "../../../components/relay/relay-favicon";
import useUserMailboxes from "../../../hooks/use-user-mailboxes";

function NprofileTab({ user }: { user: ProfilePointer }) {
  const account = useActiveAccount();
  const mailboxes = useUserMailboxes(account?.pubkey);
  const outboxRelays = mailboxes?.outboxes;

  const [selectedRelays, setSelectedRelays] = useState<string[]>([]);

  // Initialize with at least 2 relays selected
  useEffect(() => {
    if (outboxRelays && outboxRelays.length > 0) setSelectedRelays(outboxRelays.slice(0, 2));
  }, [outboxRelays]);

  const nprofile = useMemo(() => {
    const relays = selectedRelays.length > 0 ? selectedRelays : undefined;
    return "nostr:" + nprofileEncode({ pubkey: user.pubkey, relays });
  }, [user.pubkey, selectedRelays]);

  const handleRelayToggle = (relay: string) => {
    setSelectedRelays((prev) => (prev.includes(relay) ? prev.filter((r) => r !== relay) : [...prev, relay]));
  };

  return (
    <>
      <QrCodeSvg content={nprofile} border={2} />
      <Flex gap="2" mt="2">
        <Input readOnly value={nprofile} />
        <CopyIconButton value={nprofile} aria-label="copy nprofile" />
      </Flex>
      <List mt="2">
        {outboxRelays?.map((relay: string) => {
          const isSelected = selectedRelays.includes(relay);
          return (
            <ListItem
              key={relay}
              px={2}
              py={1}
              borderRadius="md"
              cursor="pointer"
              _hover={{ bg: "gray.50", _dark: { bg: "gray.700" } }}
              onClick={() => handleRelayToggle(relay)}
              transition="background-color 0.2s"
            >
              <HStack justify="space-between">
                <RelayFavicon relay={relay} size="xs" />
                <Text fontSize="sm" fontFamily="mono" isTruncated flex="1">
                  {relay}
                </Text>
                {isSelected && <CheckIcon boxSize="4" color="green.500" />}
              </HStack>
            </ListItem>
          );
        })}
        {(!outboxRelays || outboxRelays.length === 0) && (
          <Text fontSize="xs" color="gray.500">
            No outbox relays found
          </Text>
        )}
      </List>
    </>
  );
}

export function QrIconButton({ user, ...props }: { user: ProfilePointer } & Omit<IconButtonProps, "icon">) {
  const { isOpen, onOpen, onClose } = useDisclosure();
  const [activeTab, setActiveTab] = useState(0);

  const npub = nip19.npubEncode(user.pubkey);
  const npubLink = "nostr:" + npub;

  const handleTabChange = (index: number) => {
    setActiveTab(index);
  };

  return (
    <>
      <IconButton icon={<QrCodeIcon boxSize="1.4em" />} onClick={onOpen} {...props} />
      <Modal isOpen={isOpen} onClose={onClose}>
        <ModalOverlay />
        <ModalContent>
          <ModalBody p="2">
            <Tabs variant="soft-rounded" colorScheme="primary" index={activeTab} onChange={handleTabChange}>
              <TabList>
                <Tab>nprofile</Tab>
                <Tab>npub</Tab>
              </TabList>

              <TabPanels>
                <TabPanel p="0" pt="2">
                  <NprofileTab user={user} />
                </TabPanel>
                <TabPanel p="0" pt="2">
                  <QrCodeSvg content={npubLink} border={2} />
                  <Flex gap="2" mt="2">
                    <Input readOnly value={npubLink} />
                    <CopyIconButton value={npubLink} aria-label="copy npub" />
                  </Flex>
                </TabPanel>
              </TabPanels>
            </Tabs>
          </ModalBody>
          <ModalCloseButton />
        </ModalContent>
      </Modal>
    </>
  );
}
