import { MenuItem, useDisclosure } from "@chakra-ui/react";

import { CustomMenuIconButton, MenuIconButtonProps } from "../../../components/menu-icon-button";
import OpenInAppMenuItem from "../../../components/common-menu-items/open-in-app";
import CopyShareLinkMenuItem from "../../../components/common-menu-items/copy-share-link";
import CopyEmbedCodeMenuItem from "../../../components/common-menu-items/copy-embed-code";
import MuteUserMenuItem from "../../../components/common-menu-items/mute-user";
import DeleteEventMenuItem from "../../../components/common-menu-items/delete-event";
import Translate01 from "../../../components/icons/translate-01";
import { CodeIcon } from "../../../components/icons";
import NoteDebugModal from "../../../components/debug-modals/note-debug-modal";
import NoteTranslationModal from "../../../components/note-translation-modal";
import { NostrEvent } from "../../../types/nostr-event";

export default function TorrentCommentMenu({
  comment,
  detailsClick,
  ...props
}: { comment: NostrEvent; detailsClick?: () => void } & Omit<MenuIconButtonProps, "children">) {
  const debugModal = useDisclosure();
  const translationsModal = useDisclosure();

  return (
    <>
      <CustomMenuIconButton {...props}>
        <OpenInAppMenuItem event={comment} />
        <CopyShareLinkMenuItem event={comment} />
        <CopyEmbedCodeMenuItem event={comment} />
        <MuteUserMenuItem event={comment} />
        <DeleteEventMenuItem event={comment} />
        <MenuItem onClick={translationsModal.onOpen} icon={<Translate01 />}>
          Translations
        </MenuItem>
        <MenuItem onClick={debugModal.onOpen} icon={<CodeIcon />}>
          View Raw
        </MenuItem>
      </CustomMenuIconButton>

      {debugModal.isOpen && (
        <NoteDebugModal event={comment} isOpen={debugModal.isOpen} onClose={debugModal.onClose} size="6xl" />
      )}

      {translationsModal.isOpen && <NoteTranslationModal isOpen onClose={translationsModal.onClose} note={comment} />}
    </>
  );
}
