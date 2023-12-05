import { MenuItem, useDisclosure } from "@chakra-ui/react";

import { NostrEvent } from "../../../types/nostr-event";
import { CustomMenuIconButton, MenuIconButtonProps } from "../../../components/menu-icon-button";
import NoteDebugModal from "../../../components/debug-modals/note-debug-modal";
import { CodeIcon } from "../../../components/icons";
import OpenInAppMenuItem from "../../../components/common-menu-items/open-in-app";
import CopyEmbedCodeMenuItem from "../../../components/common-menu-items/copy-embed-code";

export default function GoalMenu({ goal, ...props }: { goal: NostrEvent } & Omit<MenuIconButtonProps, "children">) {
  const infoModal = useDisclosure();

  return (
    <>
      <CustomMenuIconButton {...props}>
        <OpenInAppMenuItem event={goal} />
        <CopyEmbedCodeMenuItem event={goal} />
        <MenuItem onClick={infoModal.onOpen} icon={<CodeIcon />}>
          View Raw
        </MenuItem>
      </CustomMenuIconButton>

      {infoModal.isOpen && (
        <NoteDebugModal event={goal} isOpen={infoModal.isOpen} onClose={infoModal.onClose} size="6xl" />
      )}
    </>
  );
}
