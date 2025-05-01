import { useCallback } from "react";
import { MenuItem } from "@chakra-ui/react";
import { NostrEvent } from "nostr-tools";

import { usePublishEvent } from "../../../providers/global/publish-provider";
import { DotsMenuButton, MenuIconButtonProps } from "../../../components/menu/dots-menu-button";
import OpenInAppMenuItem from "../../../components/menu/open-in-app";
import ShareLinkMenuItem from "../../../components/menu/share-link";
import CopyEmbedCodeMenuItem from "../../../components/menu/copy-embed-code";
import DeleteEventMenuItem from "../../../components/menu/delete-event";
import { BroadcastEventIcon } from "../../../components/icons";
import DebugEventMenuItem from "../../../components/debug-modal/debug-event-menu-item";

export default function FileMenu({ file, ...props }: { file: NostrEvent } & Omit<MenuIconButtonProps, "children">) {
  const publish = usePublishEvent();

  const broadcast = useCallback(async () => {
    await publish("Broadcast", file);
  }, []);

  return (
    <>
      <DotsMenuButton {...props}>
        <OpenInAppMenuItem event={file} />
        <ShareLinkMenuItem event={file} />
        <CopyEmbedCodeMenuItem event={file} />
        <DeleteEventMenuItem event={file} />

        <MenuItem onClick={broadcast} icon={<BroadcastEventIcon />}>
          Broadcast
        </MenuItem>
        <DebugEventMenuItem event={file} />
      </DotsMenuButton>
    </>
  );
}
