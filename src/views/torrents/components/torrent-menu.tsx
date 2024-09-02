import { MenuItem, useDisclosure } from "@chakra-ui/react";

import { DotsMenuButton, MenuIconButtonProps } from "../../../components/dots-menu-button";
import { NostrEvent } from "../../../types/nostr-event";
import { TranslateIcon } from "../../../components/icons";
import DeleteEventMenuItem from "../../../components/common-menu-items/delete-event";
import NoteTranslationModal from "../../tools/transform-note/translation";
import MuteUserMenuItem from "../../../components/common-menu-items/mute-user";
import OpenInAppMenuItem from "../../../components/common-menu-items/open-in-app";
import CopyEmbedCodeMenuItem from "../../../components/common-menu-items/copy-embed-code";
import DebugEventMenuItem from "../../../components/debug-modal/debug-event-menu-item";
import QuoteEventMenuItem from "../../../components/common-menu-items/quote-event";

export default function TorrentMenu({
  torrent,
  ...props
}: { torrent: NostrEvent } & Omit<MenuIconButtonProps, "children">) {
  const translationsModal = useDisclosure();

  return (
    <>
      <DotsMenuButton {...props}>
        <OpenInAppMenuItem event={torrent} />
        <QuoteEventMenuItem event={torrent} />
        <CopyEmbedCodeMenuItem event={torrent} />
        <MuteUserMenuItem event={torrent} />
        <DeleteEventMenuItem event={torrent} />
        <MenuItem onClick={translationsModal.onOpen} icon={<TranslateIcon />}>
          Translations
        </MenuItem>
        <DebugEventMenuItem event={torrent} />
      </DotsMenuButton>

      {translationsModal.isOpen && <NoteTranslationModal isOpen onClose={translationsModal.onClose} note={torrent} />}
    </>
  );
}
