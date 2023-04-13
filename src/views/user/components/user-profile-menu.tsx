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
import UserDebugModal from "../../../components/debug-modals/user-debug-modal";

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
        <UserDebugModal pubkey={pubkey} isOpen={infoModal.isOpen} onClose={infoModal.onClose} size="6xl" />
      )}
    </>
  );
};
