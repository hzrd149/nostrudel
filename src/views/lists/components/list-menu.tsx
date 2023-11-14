import { Image, MenuItem, useDisclosure } from "@chakra-ui/react";
import { useCopyToClipboard } from "react-use";

import { NostrEvent, isPTag } from "../../../types/nostr-event";
import { CustomMenuIconButton, MenuIconButtonProps } from "../../../components/menu-icon-button";
import useCurrentAccount from "../../../hooks/use-current-account";
import NoteDebugModal from "../../../components/debug-modals/note-debug-modal";
import { CodeIcon, ExternalLinkIcon, RepostIcon, TrashIcon } from "../../../components/icons";
import { getSharableEventAddress } from "../../../helpers/nip19";
import { buildAppSelectUrl } from "../../../helpers/nostr/apps";
import { useDeleteEventContext } from "../../../providers/delete-event-provider";
import { isSpecialListKind } from "../../../helpers/nostr/lists";

export default function ListMenu({ list, ...props }: { list: NostrEvent } & Omit<MenuIconButtonProps, "children">) {
  const account = useCurrentAccount();
  const infoModal = useDisclosure();

  const { deleteEvent } = useDeleteEventContext();

  const [_clipboardState, copyToClipboard] = useCopyToClipboard();

  const naddr = getSharableEventAddress(list);

  const hasPeople = list.tags.some(isPTag);

  return (
    <>
      <CustomMenuIconButton {...props}>
        {naddr && (
          <>
            <MenuItem onClick={() => window.open(buildAppSelectUrl(naddr), "_blank")} icon={<ExternalLinkIcon />}>
              View in app...
            </MenuItem>
            <MenuItem onClick={() => copyToClipboard("nostr:" + naddr)} icon={<RepostIcon />}>
              Copy Share Link
            </MenuItem>
          </>
        )}
        {account?.pubkey === list.pubkey && !isSpecialListKind(list.kind) && (
          <MenuItem icon={<TrashIcon />} color="red.500" onClick={() => deleteEvent(list)}>
            Delete List
          </MenuItem>
        )}
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
