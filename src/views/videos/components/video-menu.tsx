import { MenuItem, useDisclosure } from "@chakra-ui/react";

import { CustomMenuIconButton, MenuIconButtonProps } from "../../../components/menu-icon-button";
import OpenInAppMenuItem from "../../../components/common-menu-items/open-in-app";
import CopyShareLinkMenuItem from "../../../components/common-menu-items/copy-share-link";
import CopyEmbedCodeMenuItem from "../../../components/common-menu-items/copy-embed-code";
import MuteUserMenuItem from "../../../components/common-menu-items/mute-user";
import { CodeIcon } from "../../../components/icons";
import NoteDebugModal from "../../../components/debug-modals/note-debug-modal";
import { NostrEvent } from "../../../types/nostr-event";

export default function VideoMenu({ video, ...props }: { video: NostrEvent } & Omit<MenuIconButtonProps, "children">) {
  const debugModal = useDisclosure();

  return (
    <>
      <CustomMenuIconButton {...props}>
        <OpenInAppMenuItem event={video} />
        <CopyShareLinkMenuItem event={video} />
        <CopyEmbedCodeMenuItem event={video} />
        <MuteUserMenuItem event={video} />

        <MenuItem onClick={debugModal.onOpen} icon={<CodeIcon />}>
          View Raw
        </MenuItem>
      </CustomMenuIconButton>

      {debugModal.isOpen && (
        <NoteDebugModal event={video} isOpen={debugModal.isOpen} onClose={debugModal.onClose} size="6xl" />
      )}
    </>
  );
}
