import { MenuItem } from "@chakra-ui/react";
import { NostrEvent } from "nostr-tools";
import { useCallback } from "react";

import CopyEmbedCodeMenuItem from "../../../components/common-menu-items/copy-embed-code";
import DeleteEventMenuItem from "../../../components/common-menu-items/delete-event";
import OpenInAppMenuItem from "../../../components/common-menu-items/open-in-app";
import PinEventMenuItem from "../../../components/common-menu-items/pin-event";
import ShareLinkMenuItem from "../../../components/common-menu-items/share-link";
import DebugEventMenuItem from "../../../components/debug-modal/debug-event-menu-item";
import { DotsMenuButton, MenuIconButtonProps } from "../../../components/dots-menu-button";
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
