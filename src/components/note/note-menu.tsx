import { useCallback } from "react";
import { MenuItem, useDisclosure } from "@chakra-ui/react";
import { useCopyToClipboard } from "react-use";
import { nip19 } from "nostr-tools";

import { getSharableEventAddress } from "../../helpers/nip19";
import { NostrEvent } from "../../types/nostr-event";
import { CustomMenuIconButton, MenuIconButtonProps } from "../menu-icon-button";

import {
  BroadcastEventIcon,
  CopyToClipboardIcon,
  CodeIcon,
  ExternalLinkIcon,
  LikeIcon,
  MuteIcon,
  RepostIcon,
  TrashIcon,
  UnmuteIcon,
} from "../icons";
import NoteReactionsModal from "./note-zaps-modal";
import NoteDebugModal from "../debug-modals/note-debug-modal";
import useCurrentAccount from "../../hooks/use-current-account";
import { buildAppSelectUrl } from "../../helpers/nostr/apps";
import { useDeleteEventContext } from "../../providers/delete-event-provider";
import clientRelaysService from "../../services/client-relays";
import { handleEventFromRelay } from "../../services/event-relays";
import NostrPublishAction from "../../classes/nostr-publish-action";
import useUserMuteFunctions from "../../hooks/use-user-mute-functions";
import { useMuteModalContext } from "../../providers/mute-modal-provider";

export default function NoteMenu({ event, ...props }: { event: NostrEvent } & Omit<MenuIconButtonProps, "children">) {
  const account = useCurrentAccount();
  const infoModal = useDisclosure();
  const reactionsModal = useDisclosure();
  const { isMuted, mute, unmute } = useUserMuteFunctions(event.pubkey);
  const { openModal } = useMuteModalContext();

  const { deleteEvent } = useDeleteEventContext();

  const [_clipboardState, copyToClipboard] = useCopyToClipboard();
  const noteId = nip19.noteEncode(event.id);

  const broadcast = useCallback(() => {
    const missingRelays = clientRelaysService.getWriteUrls();
    const pub = new NostrPublishAction("Broadcast", missingRelays, event, 5000);
    pub.onResult.subscribe((result) => {
      if (result.status) handleEventFromRelay(result.relay, event);
    });
  }, []);

  const address = getSharableEventAddress(event);

  return (
    <>
      <CustomMenuIconButton {...props}>
        {address && (
          <MenuItem onClick={() => window.open(buildAppSelectUrl(address), "_blank")} icon={<ExternalLinkIcon />}>
            View in app...
          </MenuItem>
        )}
        {account?.pubkey !== event.pubkey && (
          <MenuItem
            onClick={isMuted ? unmute : () => openModal(event.pubkey)}
            icon={isMuted ? <UnmuteIcon /> : <MuteIcon />}
            color="red.500"
          >
            {isMuted ? "Unmute User" : "Mute User"}
          </MenuItem>
        )}
        <MenuItem onClick={() => copyToClipboard("nostr:" + address)} icon={<RepostIcon />}>
          Copy Share Link
        </MenuItem>
        {noteId && (
          <MenuItem onClick={() => copyToClipboard(noteId)} icon={<CopyToClipboardIcon />}>
            Copy Note ID
          </MenuItem>
        )}
        {account?.pubkey === event.pubkey && (
          <MenuItem icon={<TrashIcon />} color="red.500" onClick={() => deleteEvent(event)}>
            Delete Note
          </MenuItem>
        )}
        <MenuItem onClick={broadcast} icon={<BroadcastEventIcon />}>
          Broadcast
        </MenuItem>
        <MenuItem onClick={infoModal.onOpen} icon={<CodeIcon />}>
          View Raw
        </MenuItem>
        <MenuItem onClick={reactionsModal.onOpen} icon={<LikeIcon />}>
          Zaps/Reactions
        </MenuItem>
      </CustomMenuIconButton>

      {infoModal.isOpen && (
        <NoteDebugModal event={event} isOpen={infoModal.isOpen} onClose={infoModal.onClose} size="6xl" />
      )}

      {reactionsModal.isOpen && (
        <NoteReactionsModal noteId={event.id} isOpen={reactionsModal.isOpen} onClose={reactionsModal.onClose} />
      )}
    </>
  );
}
