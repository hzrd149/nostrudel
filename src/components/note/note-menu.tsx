import { useCallback, useMemo } from "react";
import { MenuItem, useDisclosure } from "@chakra-ui/react";
import { Link as RouterLink } from "react-router";

import { BroadcastEventIcon } from "../icons";
import { NostrEvent } from "../../types/nostr-event";
import { DotsMenuButton, MenuIconButtonProps } from "../dots-menu-button";
import NoteTranslationModal from "../../views/tools/transform-note/translation";
import Translate01 from "../icons/translate-01";
import PinEventMenuItem from "../common-menu-items/pin-event";
import ShareLinkMenuItem from "../common-menu-items/share-link";
import OpenInAppMenuItem from "../common-menu-items/open-in-app";
import MuteUserMenuItem from "../common-menu-items/mute-user";
import DeleteEventMenuItem from "../common-menu-items/delete-event";
import CopyEmbedCodeMenuItem from "../common-menu-items/copy-embed-code";
import Recording02 from "../icons/recording-02";
import { usePublishEvent } from "../../providers/global/publish-provider";
import DebugEventMenuItem from "../debug-modal/debug-event-menu-item";
import { getSharableEventAddress } from "../../services/relay-hints";

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
