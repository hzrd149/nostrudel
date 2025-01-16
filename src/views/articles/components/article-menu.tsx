import { useCallback } from "react";
import { MenuItem } from "@chakra-ui/react";
import { Link as RouterLink } from "react-router";
import { NostrEvent } from "nostr-tools";

import useShareableEventAddress from "../../../hooks/use-shareable-event-address";
import { usePublishEvent } from "../../../providers/global/publish-provider";
import { DotsMenuButton, MenuIconButtonProps } from "../../../components/dots-menu-button";
import OpenInAppMenuItem from "../../../components/common-menu-items/open-in-app";
import ShareLinkMenuItem from "../../../components/common-menu-items/share-link";
import CopyEmbedCodeMenuItem from "../../../components/common-menu-items/copy-embed-code";
import DeleteEventMenuItem from "../../../components/common-menu-items/delete-event";
import Recording02 from "../../../components/icons/recording-02";
import Translate01 from "../../../components/icons/translate-01";
import { BroadcastEventIcon } from "../../../components/icons";
import DebugEventMenuItem from "../../../components/debug-modal/debug-event-menu-item";
import PinEventMenuItem from "../../../components/common-menu-items/pin-event";

export default function ArticleMenu({
  article,
  ...props
}: { article: NostrEvent } & Omit<MenuIconButtonProps, "children">) {
  const publish = usePublishEvent();

  const address = useShareableEventAddress(article);

  const broadcast = useCallback(async () => {
    await publish("Broadcast", article);
  }, []);

  return (
    <>
      <DotsMenuButton {...props}>
        <OpenInAppMenuItem event={article} />
        <ShareLinkMenuItem event={article} />
        <CopyEmbedCodeMenuItem event={article} />
        <DeleteEventMenuItem event={article} />
        <PinEventMenuItem event={article} />

        {/* <MenuItem as={RouterLink} icon={<Recording02 />} to={`/tools/transform/${address}?tab=tts`}>
          Text to speech
        </MenuItem>
        <MenuItem as={RouterLink} icon={<Translate01 />} to={`/tools/transform/${address}?tab=translation`}>
          Translate
        </MenuItem> */}
        <MenuItem onClick={broadcast} icon={<BroadcastEventIcon />}>
          Broadcast
        </MenuItem>
        <DebugEventMenuItem event={article} />
      </DotsMenuButton>
    </>
  );
}
