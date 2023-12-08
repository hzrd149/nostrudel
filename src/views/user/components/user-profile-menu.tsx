import { MenuItem, useDisclosure } from "@chakra-ui/react";
import { Link as RouterLink } from "react-router-dom";
import { nip19 } from "nostr-tools";
import { useCopyToClipboard } from "react-use";

import { CustomMenuIconButton, MenuIconButtonProps } from "../../../components/menu-icon-button";
import {
  DirectMessagesIcon,
  CopyToClipboardIcon,
  CodeIcon,
  ExternalLinkIcon,
  MuteIcon,
  RelayIcon,
  SpyIcon,
  UnmuteIcon,
} from "../../../components/icons";
import accountService from "../../../services/account";
import { useUserMetadata } from "../../../hooks/use-user-metadata";
import { getUserDisplayName } from "../../../helpers/user-metadata";
import { useUserRelays } from "../../../hooks/use-user-relays";
import { RelayMode } from "../../../classes/relay";
import UserDebugModal from "../../../components/debug-modals/user-debug-modal";
import { useSharableProfileId } from "../../../hooks/use-shareable-profile-id";
import { buildAppSelectUrl } from "../../../helpers/nostr/apps";
import { truncatedId } from "../../../helpers/nostr/events";
import useUserMuteFunctions from "../../../hooks/use-user-mute-functions";
import useCurrentAccount from "../../../hooks/use-current-account";

export const UserProfileMenu = ({
  pubkey,
  showRelaySelectionModal,
  ...props
}: { pubkey: string; showRelaySelectionModal?: () => void } & Omit<MenuIconButtonProps, "children">) => {
  const account = useCurrentAccount();
  const metadata = useUserMetadata(pubkey);
  const userRelays = useUserRelays(pubkey);
  const infoModal = useDisclosure();
  const sharableId = useSharableProfileId(pubkey);
  const { isMuted, mute, unmute } = useUserMuteFunctions(pubkey);

  const [_clipboardState, copyToClipboard] = useCopyToClipboard();

  const loginAsUser = () => {
    const readRelays = userRelays.filter((r) => r.mode === RelayMode.READ).map((r) => r.url) ?? [];
    if (!accountService.hasAccount(pubkey)) {
      accountService.addAccount({
        type: 'pubkey',
        pubkey,
        relays: readRelays,
        readonly: true,
      });
    }
    accountService.switchAccount(pubkey);
  };

  return (
    <>
      <CustomMenuIconButton {...props}>
        <MenuItem onClick={() => window.open(buildAppSelectUrl(sharableId), "_blank")} icon={<ExternalLinkIcon />}>
          View in app...
        </MenuItem>
        {account?.pubkey !== pubkey && (
          <MenuItem onClick={isMuted ? unmute : mute} icon={isMuted ? <UnmuteIcon /> : <MuteIcon />} color="red.500">
            {isMuted ? "Unmute User" : "Mute User"}
          </MenuItem>
        )}
        <MenuItem icon={<DirectMessagesIcon fontSize="1.5em" />} as={RouterLink} to={`/dm/${nip19.npubEncode(pubkey)}`}>
          Direct messages
        </MenuItem>
        <MenuItem icon={<SpyIcon fontSize="1.5em" />} onClick={() => loginAsUser()}>
          Login as {truncatedId(getUserDisplayName(metadata, pubkey))}
        </MenuItem>
        <MenuItem onClick={() => copyToClipboard("nostr:" + sharableId)} icon={<CopyToClipboardIcon />}>
          Copy share link
        </MenuItem>
        <MenuItem onClick={infoModal.onOpen} icon={<CodeIcon />}>
          View Raw
        </MenuItem>
        {showRelaySelectionModal && (
          <MenuItem icon={<RelayIcon />} onClick={showRelaySelectionModal}>
            Relay selection
          </MenuItem>
        )}
      </CustomMenuIconButton>
      {infoModal.isOpen && (
        <UserDebugModal pubkey={pubkey} isOpen={infoModal.isOpen} onClose={infoModal.onClose} size="6xl" />
      )}
    </>
  );
};
