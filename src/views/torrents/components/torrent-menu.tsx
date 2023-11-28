import { MenuItem, useDisclosure } from "@chakra-ui/react";

import { CustomMenuIconButton, MenuIconButtonProps } from "../../../components/menu-icon-button";
import { NostrEvent } from "../../../types/nostr-event";
import { CodeIcon, TranslateIcon } from "../../../components/icons";
import DeleteEventMenuItem from "../../../components/common-menu-items/delete-event";
import NoteTranslationModal from "../../../components/note-translation-modal";
import NoteDebugModal from "../../../components/debug-modals/note-debug-modal";
import MuteUserMenuItem from "../../../components/common-menu-items/mute-user";
import OpenInAppMenuItem from "../../../components/common-menu-items/open-in-app";
import CopyEmbedCodeMenuItem from "../../../components/common-menu-items/copy-embed-code";

export default function TorrentMenu({
  torrent,
  ...props
}: { torrent: NostrEvent } & Omit<MenuIconButtonProps, "children">) {
  const debugModal = useDisclosure();
  const translationsModal = useDisclosure();

  return (
    <>
      <CustomMenuIconButton {...props}>
        <OpenInAppMenuItem event={torrent} />
        <CopyEmbedCodeMenuItem event={torrent} />
        <MuteUserMenuItem event={torrent} />
        <DeleteEventMenuItem event={torrent} />
        <MenuItem onClick={translationsModal.onOpen} icon={<TranslateIcon />}>
          Translations
        </MenuItem>
        <MenuItem onClick={debugModal.onOpen} icon={<CodeIcon />}>
          View Raw
        </MenuItem>
      </CustomMenuIconButton>

      {debugModal.isOpen && (
        <NoteDebugModal event={torrent} isOpen={debugModal.isOpen} onClose={debugModal.onClose} size="6xl" />
      )}

      {translationsModal.isOpen && <NoteTranslationModal isOpen onClose={translationsModal.onClose} note={torrent} />}
    </>
  );
}
