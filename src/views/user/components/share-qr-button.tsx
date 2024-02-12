import {
  IconButton,
  IconButtonProps,
  Modal,
  ModalBody,
  ModalCloseButton,
  ModalContent,
  ModalOverlay,
  useDisclosure,
  Tabs,
  TabList,
  Tab,
  TabPanels,
  TabPanel,
  Input,
  Flex,
} from "@chakra-ui/react";
import { nip19 } from "nostr-tools";

import { QrCodeIcon } from "../../../components/icons";
import QrCodeSvg from "../../../components/qr-code-svg";
import { CopyIconButton } from "../../../components/copy-icon-button";
import { useSharableProfileId } from "../../../hooks/use-shareable-profile-id";

export const QrIconButton = ({ pubkey, ...props }: { pubkey: string } & Omit<IconButtonProps, "icon">) => {
  const { isOpen, onOpen, onClose } = useDisclosure();

  const npub = nip19.npubEncode(pubkey);
  const npubLink = "nostr:" + npub;
  const nprofile = useSharableProfileId(pubkey);
  const nprofileLink = "nostr:" + nprofile;

  return (
    <>
      <IconButton icon={<QrCodeIcon />} onClick={onOpen} {...props} />
      <Modal isOpen={isOpen} onClose={onClose}>
        <ModalOverlay />
        <ModalContent>
          <ModalBody p="2">
            <Tabs>
              <TabList>
                <Tab>nprofile</Tab>
                <Tab>npub</Tab>
              </TabList>

              <TabPanels>
                <TabPanel p="0" pt="2">
                  <QrCodeSvg content={nprofileLink} border={2} />
                  <Flex gap="2" mt="2">
                    <Input readOnly value={nprofileLink} />
                    <CopyIconButton text={nprofileLink} aria-label="copy nprofile" />
                  </Flex>
                </TabPanel>
                <TabPanel p="0" pt="2">
                  <QrCodeSvg content={npubLink} border={2} />
                  <Flex gap="2" mt="2">
                    <Input readOnly value={npubLink} />
                    <CopyIconButton text={npubLink} aria-label="copy npub" />
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
};
