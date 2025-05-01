import { MenuItem, useDisclosure } from "@chakra-ui/react";
import { NostrEvent } from "nostr-tools";
import { useCallback, useMemo } from "react";
import { Link as RouterLink } from "react-router-dom";

import { usePublishEvent } from "../../providers/global/publish-provider";
import { getSharableEventAddress } from "../../services/relay-hints";
import NoteTranslationModal from "../../views/tools/transform-note/translation";
import CopyEmbedCodeMenuItem from "../menu/copy-embed-code";
import DeleteEventMenuItem from "../menu/delete-event";
import MuteUserMenuItem from "../menu/mute-user";
import OpenInAppMenuItem from "../menu/open-in-app";
import PinEventMenuItem from "../menu/pin-event";
import ShareLinkMenuItem from "../menu/share-link";
import DebugEventMenuItem from "../debug-modal/debug-event-menu-item";
import { DotsMenuButton, MenuIconButtonProps } from "../menu/dots-menu-button";
import { BroadcastEventIcon } from "../icons";
import Recording02 from "../icons/recording-02";
import Translate01 from "../icons/translate-01";

export default function NoteMenu({ event, ...props }: { event: NostrEvent } & Omit<MenuIconButtonProps, "children">) {
  const translationsModal = useDisclosure();
  const publish = usePublishEvent();

  const address = useMemo(() => getSharableEventAddress(event), [event]);

  const broadcast = useCallback(async () => {
    await publish("Broadcast", event);
  }, []);

  return (
    <>
      <DotsMenuButton {...props}>
        <OpenInAppMenuItem event={event} />
        <ShareLinkMenuItem event={event} />
        <CopyEmbedCodeMenuItem event={event} />
        <MuteUserMenuItem event={event} />
        <DeleteEventMenuItem event={event} />

        <MenuItem as={RouterLink} icon={<Recording02 />} to={`/tools/transform/${address}?tab=tts`}>
          Text to speech
        </MenuItem>
        <MenuItem as={RouterLink} icon={<Translate01 />} to={`/tools/transform/${address}?tab=translation`}>
          Translate
        </MenuItem>

        <MenuItem onClick={broadcast} icon={<BroadcastEventIcon />}>
          Broadcast
        </MenuItem>
        <PinEventMenuItem event={event} />
        <DebugEventMenuItem event={event} />
      </DotsMenuButton>

      {translationsModal.isOpen && <NoteTranslationModal isOpen onClose={translationsModal.onClose} note={event} />}
    </>
  );
}
