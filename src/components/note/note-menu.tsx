import { useCallback } from "react";
import { MenuItem, useDisclosure } from "@chakra-ui/react";
import { Link as RouterLink } from "react-router-dom";

import { BroadcastEventIcon } from "../icons";
import { NostrEvent } from "../../types/nostr-event";
import { DotsMenuButton, MenuIconButtonProps } from "../dots-menu-button";
import NoteTranslationModal from "../../views/tools/transform-note/translation";
import Translate01 from "../icons/translate-01";
import InfoCircle from "../icons/info-circle";
import PinNoteMenuItem from "../common-menu-items/pin-note";
import CopyShareLinkMenuItem from "../common-menu-items/copy-share-link";
import OpenInAppMenuItem from "../common-menu-items/open-in-app";
import MuteUserMenuItem from "../common-menu-items/mute-user";
import DeleteEventMenuItem from "../common-menu-items/delete-event";
import CopyEmbedCodeMenuItem from "../common-menu-items/copy-embed-code";
import { getSharableEventAddress } from "../../helpers/nip19";
import Recording02 from "../icons/recording-02";
import { usePublishEvent } from "../../providers/global/publish-provider";
import DebugEventMenuItem from "../debug-modal/debug-event-menu-item";

export default function NoteMenu({
  event,
  detailsClick,
  ...props
}: { event: NostrEvent; detailsClick?: () => void } & Omit<MenuIconButtonProps, "children">) {
  const translationsModal = useDisclosure();
  const publish = usePublishEvent();

  const broadcast = useCallback(async () => {
    await publish("Broadcast", event);
  }, []);

  return (
    <>
      <DotsMenuButton {...props}>
        <OpenInAppMenuItem event={event} />
        <CopyShareLinkMenuItem event={event} />
        <CopyEmbedCodeMenuItem event={event} />
        <MuteUserMenuItem event={event} />
        <DeleteEventMenuItem event={event} />

        <MenuItem
          as={RouterLink}
          icon={<Recording02 />}
          to={`/tools/transform/${getSharableEventAddress(event)}?tab=tts`}
        >
          Text to speech
        </MenuItem>
        <MenuItem
          as={RouterLink}
          icon={<Translate01 />}
          to={`/tools/transform/${getSharableEventAddress(event)}?tab=translation`}
        >
          Translate
        </MenuItem>

        <MenuItem onClick={broadcast} icon={<BroadcastEventIcon />}>
          Broadcast
        </MenuItem>
        <PinNoteMenuItem event={event} />
        {detailsClick && (
          <MenuItem onClick={detailsClick} icon={<InfoCircle />}>
            Details
          </MenuItem>
        )}
        <DebugEventMenuItem event={event} />
      </DotsMenuButton>

      {translationsModal.isOpen && <NoteTranslationModal isOpen onClose={translationsModal.onClose} note={event} />}
    </>
  );
}
