import { MenuItem } from "@chakra-ui/react";
import { NostrEvent } from "nostr-tools";
import { useCallback } from "react";

import CopyEmbedCodeMenuItem from "../../../components/menu/copy-embed-code";
import DeleteEventMenuItem from "../../../components/menu/delete-event";
import OpenInAppMenuItem from "../../../components/menu/open-in-app";
import PinEventMenuItem from "../../../components/menu/pin-event";
import ShareLinkMenuItem from "../../../components/menu/share-link";
import DebugEventMenuItem from "../../../components/debug-modal/debug-event-menu-item";
import { DotsMenuButton, MenuIconButtonProps } from "../../../components/menu/dots-menu-button";
import { BroadcastEventIcon } from "../../../components/icons";
import { usePublishEvent } from "../../../providers/global/publish-provider";

export default function ArticleMenu({
  article,
  ...props
}: { article: NostrEvent } & Omit<MenuIconButtonProps, "children">) {
  const publish = usePublishEvent();

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

        <MenuItem onClick={broadcast} icon={<BroadcastEventIcon />}>
          Broadcast
        </MenuItem>
        <DebugEventMenuItem event={article} />
      </DotsMenuButton>
    </>
  );
}
