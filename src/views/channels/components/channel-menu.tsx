import { MenuItem, useDisclosure } from "@chakra-ui/react";

import { CustomMenuIconButton, MenuIconButtonProps } from "../../../components/menu-icon-button";
import { NostrEvent } from "../../../types/nostr-event";
import OpenInAppMenuItem from "../../../components/common-menu-items/open-in-app";
import CopyEmbedCodeMenuItem from "../../../components/common-menu-items/copy-embed-code";
import { CodeIcon } from "../../../components/icons";
import NoteDebugModal from "../../../components/debug-modals/note-debug-modal";

export default function ChannelMenu({
  channel,
  ...props
}: Omit<MenuIconButtonProps, "children"> & { channel: NostrEvent }) {
  const debugModal = useDisclosure();

  return (
    <>
      <CustomMenuIconButton {...props}>
        <OpenInAppMenuItem event={channel} />
        <CopyEmbedCodeMenuItem event={channel} />
        <MenuItem onClick={debugModal.onOpen} icon={<CodeIcon />}>
          View Raw
        </MenuItem>
      </CustomMenuIconButton>

      {debugModal.isOpen && (
        <NoteDebugModal event={channel} isOpen={debugModal.isOpen} onClose={debugModal.onClose} size="6xl" />
      )}
    </>
  );
}
