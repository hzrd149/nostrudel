import { DotsMenuButton, MenuIconButtonProps } from "../../../components/dots-menu-button";
import OpenInAppMenuItem from "../../../components/common-menu-items/open-in-app";
import CopyShareLinkMenuItem from "../../../components/common-menu-items/copy-share-link";
import CopyEmbedCodeMenuItem from "../../../components/common-menu-items/copy-embed-code";
import MuteUserMenuItem from "../../../components/common-menu-items/mute-user";
import { NostrEvent } from "../../../types/nostr-event";
import DebugEventMenuItem from "../../../components/debug-modal/debug-event-menu-item";

export default function VideoMenu({ video, ...props }: { video: NostrEvent } & Omit<MenuIconButtonProps, "children">) {
  return (
    <>
      <DotsMenuButton {...props}>
        <OpenInAppMenuItem event={video} />
        <CopyShareLinkMenuItem event={video} />
        <CopyEmbedCodeMenuItem event={video} />
        <MuteUserMenuItem event={video} />
        <DebugEventMenuItem event={video} />
      </DotsMenuButton>
    </>
  );
}
