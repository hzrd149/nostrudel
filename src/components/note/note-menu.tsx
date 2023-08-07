import { useCallback } from "react";
import { MenuItem, useDisclosure } from "@chakra-ui/react";
import { useCopyToClipboard } from "react-use";

import { Bech32Prefix, getSharableNoteId, normalizeToBech32 } from "../../helpers/nip19";
import { NostrEvent } from "../../types/nostr-event";
import { MenuIconButton, MenuIconButtonProps } from "../menu-icon-button";

import { ClipboardIcon, CodeIcon, ExternalLinkIcon, LikeIcon, RelayIcon, RepostIcon, TrashIcon } from "../icons";
import NoteReactionsModal from "./note-zaps-modal";
import NoteDebugModal from "../debug-modals/note-debug-modal";
import { useCurrentAccount } from "../../hooks/use-current-account";
import { buildAppSelectUrl } from "../../helpers/nostr-apps";
import { useDeleteEventContext } from "../../providers/delete-event-provider";
import { nostrPostAction } from "../../classes/nostr-post-action";
import clientRelaysService from "../../services/client-relays";
import { handleEventFromRelay } from "../../services/event-relays";
import relayPoolService from "../../services/relay-pool";

export const NoteMenu = ({ event, ...props }: { event: NostrEvent } & Omit<MenuIconButtonProps, "children">) => {
  const account = useCurrentAccount();
  const infoModal = useDisclosure();
  const reactionsModal = useDisclosure();

  const { deleteEvent } = useDeleteEventContext();

  const [_clipboardState, copyToClipboard] = useCopyToClipboard();
  const noteId = normalizeToBech32(event.id, Bech32Prefix.Note);

  const broadcast = useCallback(() => {
    const missingRelays = clientRelaysService.getWriteUrls();

    const { results, onComplete } = nostrPostAction(missingRelays, event, 5000);

    results.subscribe((result) => {
      if (result.status) {
        handleEventFromRelay(relayPoolService.requestRelay(result.url, false), event);
      }
    });
  }, []);

  return (
    <>
      <MenuIconButton {...props}>
        <MenuItem onClick={reactionsModal.onOpen} icon={<LikeIcon />}>
          Zaps/Reactions
        </MenuItem>
        <MenuItem
          onClick={() => window.open(buildAppSelectUrl(getSharableNoteId(event.id)), "_blank")}
          icon={<ExternalLinkIcon />}
        >
          View in app...
        </MenuItem>
        <MenuItem onClick={() => copyToClipboard("nostr:" + getSharableNoteId(event.id))} icon={<RepostIcon />}>
          Copy Share Link
        </MenuItem>
        {noteId && (
          <MenuItem onClick={() => copyToClipboard(noteId)} icon={<ClipboardIcon />}>
            Copy Note ID
          </MenuItem>
        )}
        {account?.pubkey === event.pubkey && (
          <MenuItem icon={<TrashIcon />} color="red.500" onClick={() => deleteEvent(event)}>
            Delete Note
          </MenuItem>
        )}
        <MenuItem onClick={broadcast} icon={<RelayIcon />}>
          Broadcast
        </MenuItem>
        <MenuItem onClick={infoModal.onOpen} icon={<CodeIcon />}>
          View Raw
        </MenuItem>
      </MenuIconButton>

      {infoModal.isOpen && (
        <NoteDebugModal event={event} isOpen={infoModal.isOpen} onClose={infoModal.onClose} size="6xl" />
      )}

      {reactionsModal.isOpen && (
        <NoteReactionsModal noteId={event.id} isOpen={reactionsModal.isOpen} onClose={reactionsModal.onClose} />
      )}
    </>
  );
};
