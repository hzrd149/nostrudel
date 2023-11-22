import { MenuItem, useDisclosure } from "@chakra-ui/react";
import { nip19 } from "nostr-tools";

import { CustomMenuIconButton, MenuIconButtonProps } from "../../../components/menu-icon-button";
import useCurrentAccount from "../../../hooks/use-current-account";
import { NostrEvent } from "../../../types/nostr-event";
import { useMuteModalContext } from "../../../providers/mute-modal-provider";
import useUserMuteFunctions from "../../../hooks/use-user-mute-functions";
import { useDeleteEventContext } from "../../../providers/delete-event-provider";
import { getSharableEventAddress } from "../../../helpers/nip19";
import {
  CodeIcon,
  CopyToClipboardIcon,
  ExternalLinkIcon,
  MuteIcon,
  RepostIcon,
  TrashIcon,
  UnmuteIcon,
} from "../../../components/icons";
import { buildAppSelectUrl } from "../../../helpers/nostr/apps";
import CommunityPostDebugModal from "../../../components/debug-modals/community-post-debug-modal";

export default function CommunityPostMenu({
  event,
  approvals,
  ...props
}: Omit<MenuIconButtonProps, "children"> & { event: NostrEvent; approvals: NostrEvent[] }) {
  const account = useCurrentAccount();
  const debugModal = useDisclosure();

  // const { isMuted, unmute } = useUserMuteFunctions(event.pubkey);
  // const { openModal } = useMuteModalContext();

  const { deleteEvent } = useDeleteEventContext();

  const address = getSharableEventAddress(event);

  return (
    <>
      <CustomMenuIconButton {...props}>
        {address && (
          <MenuItem onClick={() => window.open(buildAppSelectUrl(address), "_blank")} icon={<ExternalLinkIcon />}>
            View in app...
          </MenuItem>
        )}
        {/* {account?.pubkey !== event.pubkey && (
          <MenuItem
            onClick={isMuted ? unmute : () => openModal(event.pubkey)}
            icon={isMuted ? <UnmuteIcon /> : <MuteIcon />}
            color="red.500"
          >
            {isMuted ? "Unmute User" : "Mute User"}
          </MenuItem>
        )} */}
        <MenuItem onClick={() => window.navigator.clipboard.writeText("nostr:" + address)} icon={<RepostIcon />}>
          Copy Share Link
        </MenuItem>
        <MenuItem onClick={() => window.navigator.clipboard.writeText(event.id)} icon={<CopyToClipboardIcon />}>
          Copy Note ID
        </MenuItem>
        {account?.pubkey === event.pubkey && (
          <MenuItem icon={<TrashIcon />} color="red.500" onClick={() => deleteEvent(event)}>
            Delete Note
          </MenuItem>
        )}
        <MenuItem onClick={debugModal.onOpen} icon={<CodeIcon />}>
          View Raw
        </MenuItem>
      </CustomMenuIconButton>

      {debugModal.isOpen && (
        <CommunityPostDebugModal
          event={event}
          isOpen={debugModal.isOpen}
          onClose={debugModal.onClose}
          size="6xl"
          approvals={approvals}
        />
      )}
    </>
  );
}
