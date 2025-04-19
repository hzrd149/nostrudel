import { NostrEvent } from "nostr-tools";

import CopyEmbedCodeMenuItem from "../../../components/common-menu-items/copy-embed-code";
import MuteUserMenuItem from "../../../components/common-menu-items/mute-user";
import OpenInAppMenuItem from "../../../components/common-menu-items/open-in-app";
import ShareLinkMenuItem from "../../../components/common-menu-items/share-link";
import DebugEventMenuItem from "../../../components/debug-modal/debug-event-menu-item";
import { DotsMenuButton, MenuIconButtonProps } from "../../../components/dots-menu-button";

export default function VideoMenu({ video, ...props }: { video: NostrEvent } & Omit<MenuIconButtonProps, "children">) {
  return (
    <>
      <DotsMenuButton {...props}>
        <OpenInAppMenuItem event={video} />
        <ShareLinkMenuItem event={video} />
        <CopyEmbedCodeMenuItem event={video} />
        <MuteUserMenuItem event={video} />
        <DebugEventMenuItem event={video} />
      </DotsMenuButton>
    </>
  );
}
