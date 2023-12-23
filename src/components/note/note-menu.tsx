import { useCallback } from "react";
import { MenuItem, useDisclosure } from "@chakra-ui/react";
import { Link as RouterLink } from "react-router-dom";

import { BroadcastEventIcon, CodeIcon } from "../icons";
import { NostrEvent } from "../../types/nostr-event";
import { CustomMenuIconButton, MenuIconButtonProps } from "../menu-icon-button";
import NoteDebugModal from "../debug-modals/note-debug-modal";
import clientRelaysService from "../../services/client-relays";
import { handleEventFromRelay } from "../../services/event-relays";
import NostrPublishAction from "../../classes/nostr-publish-action";
import NoteTranslationModal from "../note-translation-modal";
import Translate01 from "../icons/translate-01";
import InfoCircle from "../icons/info-circle";
import PinNoteMenuItem from "../common-menu-items/pin-note";
import CopyShareLinkMenuItem from "../common-menu-items/copy-share-link";
import OpenInAppMenuItem from "../common-menu-items/open-in-app";
import MuteUserMenuItem from "../common-menu-items/mute-user";
import DeleteEventMenuItem from "../common-menu-items/delete-event";
import CopyEmbedCodeMenuItem from "../common-menu-items/copy-embed-code";
import { getSharableEventAddress } from "../../helpers/nip19";
import Dataflow02 from "../icons/dataflow-02";

export default function NoteMenu({
  event,
  detailsClick,
  ...props
}: { event: NostrEvent; detailsClick?: () => void } & Omit<MenuIconButtonProps, "children">) {
  const debugModal = useDisclosure();
  const translationsModal = useDisclosure();

  const broadcast = useCallback(() => {
    const missingRelays = clientRelaysService.getWriteUrls();
    const pub = new NostrPublishAction("Broadcast", missingRelays, event, 5000);
    pub.onResult.subscribe((result) => {
      if (result.status) handleEventFromRelay(result.relay, event);
    });
  }, []);

  return (
    <>
      <CustomMenuIconButton {...props}>
        <OpenInAppMenuItem event={event} />
        <CopyShareLinkMenuItem event={event} />
        <CopyEmbedCodeMenuItem event={event} />
        <MuteUserMenuItem event={event} />
        <DeleteEventMenuItem event={event} />
        {detailsClick && (
          <MenuItem onClick={detailsClick} icon={<InfoCircle />}>
            Details
          </MenuItem>
        )}

        <MenuItem as={RouterLink} icon={<Dataflow02 />} to={`/tools/transform/${getSharableEventAddress(event)}`}>
          Transform Note
        </MenuItem>
        <MenuItem onClick={translationsModal.onOpen} icon={<Translate01 />}>
          Translate
        </MenuItem>
        <MenuItem onClick={broadcast} icon={<BroadcastEventIcon />}>
          Broadcast
        </MenuItem>
        <PinNoteMenuItem event={event} />
        <MenuItem onClick={debugModal.onOpen} icon={<CodeIcon />}>
          View Raw
        </MenuItem>
      </CustomMenuIconButton>

      {debugModal.isOpen && (
        <NoteDebugModal event={event} isOpen={debugModal.isOpen} onClose={debugModal.onClose} size="6xl" />
      )}

      {translationsModal.isOpen && <NoteTranslationModal isOpen onClose={translationsModal.onClose} note={event} />}
    </>
  );
}
