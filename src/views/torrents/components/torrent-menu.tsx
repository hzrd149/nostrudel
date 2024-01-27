import { MenuItem, useDisclosure } from "@chakra-ui/react";

import { CustomMenuIconButton, MenuIconButtonProps } from "../../../components/menu-icon-button";
import { NostrEvent } from "../../../types/nostr-event";
import { TranslateIcon } from "../../../components/icons";
import DeleteEventMenuItem from "../../../components/common-menu-items/delete-event";
import NoteTranslationModal from "../../tools/transform-note/translation";
import MuteUserMenuItem from "../../../components/common-menu-items/mute-user";
import OpenInAppMenuItem from "../../../components/common-menu-items/open-in-app";
import CopyEmbedCodeMenuItem from "../../../components/common-menu-items/copy-embed-code";
import DebugEventMenuItem from "../../../components/debug-modal/debug-event-menu-item";

export default function TorrentMenu({
  torrent,
  ...props
}: { torrent: NostrEvent } & Omit<MenuIconButtonProps, "children">) {
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
        <DebugEventMenuItem event={torrent} />
      </CustomMenuIconButton>

      {translationsModal.isOpen && <NoteTranslationModal isOpen onClose={translationsModal.onClose} note={torrent} />}
    </>
  );
}
