import { Image, MenuItem, useDisclosure } from "@chakra-ui/react";

import { NostrEvent, isPTag } from "../../../types/nostr-event";
import { CustomMenuIconButton, MenuIconButtonProps } from "../../../components/menu-icon-button";
import NoteDebugModal from "../../../components/debug-modals/note-debug-modal";
import { CodeIcon } from "../../../components/icons";
import { getSharableEventAddress } from "../../../helpers/nip19";
import DeleteEventMenuItem from "../../../components/common-menu-items/delete-event";
import OpenInAppMenuItem from "../../../components/common-menu-items/open-in-app";
import CopyEmbedCodeMenuItem from "../../../components/common-menu-items/copy-embed-code";
import { isSpecialListKind } from "../../../helpers/nostr/lists";

export default function ListMenu({ list, ...props }: { list: NostrEvent } & Omit<MenuIconButtonProps, "children">) {
  const infoModal = useDisclosure();

  const naddr = getSharableEventAddress(list);
  const isSpecial = isSpecialListKind(list.kind);

  const hasPeople = list.tags.some(isPTag);

  return (
    <>
      <CustomMenuIconButton {...props}>
        <OpenInAppMenuItem event={list} />
        <CopyEmbedCodeMenuItem event={list} />
        {!isSpecial && <DeleteEventMenuItem event={list} label="Delete List" />}
        {hasPeople && (
          <MenuItem
            icon={<Image w="4" h="4" src="https://www.makeprisms.com/favicon.ico" />}
            onClick={() => window.open(`https://www.makeprisms.com/create/${naddr}`, "_blank")}
          >
            Create $prism
          </MenuItem>
        )}
        <MenuItem onClick={infoModal.onOpen} icon={<CodeIcon />}>
          View Raw
        </MenuItem>
      </CustomMenuIconButton>

      {infoModal.isOpen && (
        <NoteDebugModal event={list} isOpen={infoModal.isOpen} onClose={infoModal.onClose} size="6xl" />
      )}
    </>
  );
}
