import { MenuItem, useDisclosure } from "@chakra-ui/react";

import { CustomMenuIconButton, MenuIconButtonProps } from "../../../components/menu-icon-button";
import { NostrEvent } from "../../../types/nostr-event";
import { CodeIcon } from "../../../components/icons";
import NoteDebugModal from "../../../components/debug-modals/note-debug-modal";
import useCurrentAccount from "../../../hooks/use-current-account";
import PencilLine from "../../../components/icons/pencil-line";
import OpenInAppMenuItem from "../../../components/common-menu-items/open-in-app";
import CopyEmbedCodeMenuItem from "../../../components/common-menu-items/copy-embed-code";

export default function CommunityMenu({
  community,
  onEditClick,
  ...props
}: Omit<MenuIconButtonProps, "children"> & { community: NostrEvent; onEditClick?: () => void }) {
  const account = useCurrentAccount();
  const debugModal = useDisclosure();

  return (
    <>
      <CustomMenuIconButton {...props}>
        <OpenInAppMenuItem event={community} />
        <CopyEmbedCodeMenuItem event={community} />
        {account?.pubkey === community.pubkey && onEditClick && (
          <MenuItem onClick={onEditClick} icon={<PencilLine />}>
            Edit Community
          </MenuItem>
        )}
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
