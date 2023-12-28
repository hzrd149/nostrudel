import { MenuItem, useDisclosure } from "@chakra-ui/react";

import { NostrEvent } from "../../../types/nostr-event";
import { CustomMenuIconButton, MenuIconButtonProps } from "../../../components/menu-icon-button";
import useCurrentAccount from "../../../hooks/use-current-account";
import NoteDebugModal from "../../../components/debug-modals/note-debug-modal";
import { CodeIcon, TrashIcon } from "../../../components/icons";
import { useDeleteEventContext } from "../../../providers/route/delete-event-provider";
import OpenInAppMenuItem from "../../../components/common-menu-items/open-in-app";
import CopyEmbedCodeMenuItem from "../../../components/common-menu-items/copy-embed-code";

export default function BadgeMenu({ badge, ...props }: { badge: NostrEvent } & Omit<MenuIconButtonProps, "children">) {
  const account = useCurrentAccount();
  const infoModal = useDisclosure();

  const { deleteEvent } = useDeleteEventContext();

  return (
    <>
      <CustomMenuIconButton {...props}>
        <OpenInAppMenuItem event={badge} />
        <CopyEmbedCodeMenuItem event={badge} />
        {account?.pubkey === badge.pubkey && (
          <MenuItem icon={<TrashIcon />} color="red.500" onClick={() => deleteEvent(badge)}>
            Delete Badge
          </MenuItem>
        )}
        <MenuItem onClick={infoModal.onOpen} icon={<CodeIcon />}>
          View Raw
        </MenuItem>
      </CustomMenuIconButton>

      {infoModal.isOpen && (
        <NoteDebugModal event={badge} isOpen={infoModal.isOpen} onClose={infoModal.onClose} size="6xl" />
      )}
    </>
  );
}
