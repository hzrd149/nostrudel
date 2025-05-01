import { NostrEvent } from "nostr-tools";

import CopyEmbedCodeMenuItem from "../../../components/menu/copy-embed-code";
import MuteUserMenuItem from "../../../components/menu/mute-user";
import OpenInAppMenuItem from "../../../components/menu/open-in-app";
import ShareLinkMenuItem from "../../../components/menu/share-link";
import DebugEventMenuItem from "../../../components/debug-modal/debug-event-menu-item";
import { DotsMenuButton, MenuIconButtonProps } from "../../../components/menu/dots-menu-button";

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
