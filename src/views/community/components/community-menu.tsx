import { MenuItem, useDisclosure } from "@chakra-ui/react";
import { useCopyToClipboard } from "react-use";

import { CustomMenuIconButton, MenuIconButtonProps } from "../../../components/menu-icon-button";
import { NostrEvent } from "../../../types/nostr-event";
import { CodeIcon, ExternalLinkIcon, RepostIcon } from "../../../components/icons";
import NoteDebugModal from "../../../components/debug-modals/note-debug-modal";
import { buildAppSelectUrl } from "../../../helpers/nostr/apps";
import { getSharableEventAddress } from "../../../helpers/nip19";
import { useCurrentAccount } from "../../../hooks/use-current-account";
import PencilLine from "../../../components/icons/pencil-line";

export default function CommunityMenu({
  community,
  onEditClick,
  ...props
}: Omit<MenuIconButtonProps, "children"> & { community: NostrEvent; onEditClick?: () => void }) {
  const account = useCurrentAccount();
  const debugModal = useDisclosure();
  const [_clipboardState, copyToClipboard] = useCopyToClipboard();

  const address = getSharableEventAddress(community);

  return (
    <>
      <CustomMenuIconButton {...props}>
        {address && (
          <MenuItem onClick={() => window.open(buildAppSelectUrl(address), "_blank")} icon={<ExternalLinkIcon />}>
            View in app...
          </MenuItem>
        )}
        {account?.pubkey === community.pubkey && onEditClick && (
          <MenuItem onClick={onEditClick} icon={<PencilLine />}>
            Edit Community
          </MenuItem>
        )}
        <MenuItem onClick={() => copyToClipboard("nostr:" + address)} icon={<RepostIcon />}>
          Copy Share Link
        </MenuItem>
        <MenuItem onClick={debugModal.onOpen} icon={<CodeIcon />}>
          View Raw
        </MenuItem>
      </CustomMenuIconButton>

      {debugModal.isOpen && (
        <NoteDebugModal event={community} isOpen={debugModal.isOpen} onClose={debugModal.onClose} size="6xl" />
      )}
    </>
  );
}
