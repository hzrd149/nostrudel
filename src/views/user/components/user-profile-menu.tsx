import {
  Avatar,
  Code,
  Flex,
  Heading,
  MenuItem,
  Modal,
  ModalBody,
  ModalCloseButton,
  ModalContent,
  ModalOverlay,
  useDisclosure,
} from "@chakra-ui/react";
import { MenuIconButton, MenuIconButtonProps } from "../../../components/menu-icon-button";

import { CodeIcon, IMAGE_ICONS, SpyIcon } from "../../../components/icons";
import { Bech32Prefix, normalizeToBech32 } from "../../../helpers/nip19";
import accountService from "../../../services/account";
import { useUserMetadata } from "../../../hooks/use-user-metadata";
import { getUserDisplayName } from "../../../helpers/user-metadata";
import { useUserRelays } from "../../../hooks/use-user-relays";
import { RelayMode } from "../../../classes/relay";
import { CopyIconButton } from "../../../components/copy-icon-button";

export const UserProfileMenu = ({ pubkey, ...props }: { pubkey: string } & Omit<MenuIconButtonProps, "children">) => {
  const npub = normalizeToBech32(pubkey, Bech32Prefix.Pubkey);
  const metadata = useUserMetadata(pubkey);
  const userRelays = useUserRelays(pubkey);
  const infoModal = useDisclosure();

  const loginAsUser = () => {
    const readRelays = userRelays?.relays.filter((r) => r.mode === RelayMode.READ).map((r) => r.url) ?? [];
    if (!accountService.hasAccount(pubkey)) {
      accountService.addAccount({
        pubkey,
        relays: readRelays,
        readonly: true,
      });
    }
    accountService.switchAccount(pubkey);
  };

  return (
    <>
      <MenuIconButton {...props}>
        <MenuItem icon={<SpyIcon fontSize="1.5em" />} onClick={() => loginAsUser()}>
          Login as {getUserDisplayName(metadata, pubkey)}
        </MenuItem>
        <MenuItem onClick={infoModal.onOpen} icon={<CodeIcon />}>
          View Raw
        </MenuItem>
        <MenuItem
          as="a"
          icon={<Avatar src={IMAGE_ICONS.nostrGuruIcon} size="xs" />}
          href={`https://www.nostr.guru/p/${pubkey}`}
          target="_blank"
        >
          Open in Nostr.guru
        </MenuItem>
        <MenuItem
          as="a"
          icon={<Avatar src={IMAGE_ICONS.snortSocialIcon} size="xs" />}
          href={`https://snort.social/p/${npub}`}
          target="_blank"
        >
          Open in snort.social
        </MenuItem>
      </MenuIconButton>
      {infoModal.isOpen && (
        <Modal isOpen={infoModal.isOpen} onClose={infoModal.onClose} size="6xl">
          <ModalOverlay />
          <ModalContent>
            <ModalCloseButton />
            <ModalBody overflow="auto" fontSize="sm" padding="2">
              <Flex gap="2" direction="column">
                <Heading size="sm" mt="2">
                  Hex pubkey
                </Heading>
                <Flex gap="2">
                  <Code fontSize="md" wordBreak="break-all">
                    {pubkey}
                  </Code>
                  <CopyIconButton text={pubkey} size="xs" aria-label="copy hex" />
                </Flex>

                {npub && (
                  <>
                    <Heading size="sm" mt="2">
                      Encoded pubkey (NIP-19)
                    </Heading>
                    <Flex gap="2">
                      <Code fontSize="md" wordBreak="break-all">
                        {npub}
                      </Code>
                      <CopyIconButton text={npub} size="xs" aria-label="copy npub" />
                    </Flex>
                  </>
                )}

                <Heading size="sm" mt="2">
                  Metadata (kind 0)
                </Heading>
                <Code whiteSpace="pre" overflowX="auto">
                  {JSON.stringify(metadata, null, 2)}
                </Code>
              </Flex>
            </ModalBody>
          </ModalContent>
        </Modal>
      )}
    </>
  );
};
