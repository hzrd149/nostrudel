import { NostrEvent } from "nostr-tools";
import { DotsMenuButton, MenuIconButtonProps } from "../../../components/dots-menu-button";
import OpenInAppMenuItem from "../../../components/common-menu-items/open-in-app";
import ShareLinkMenuItem from "../../../components/common-menu-items/share-link";
import CopyEmbedCodeMenuItem from "../../../components/common-menu-items/copy-embed-code";
import MuteUserMenuItem from "../../../components/common-menu-items/mute-user";
import DebugEventMenuItem from "../../../components/debug-modal/debug-event-menu-item";

export default function TrackMenu({ track, ...props }: { track: NostrEvent } & Omit<MenuIconButtonProps, "children">) {
  return (
    <>
      <DotsMenuButton {...props}>
        <OpenInAppMenuItem event={track} />
        <ShareLinkMenuItem event={track} />
        <CopyEmbedCodeMenuItem event={track} />
        <MuteUserMenuItem event={track} />

        <DebugEventMenuItem event={track} />
      </DotsMenuButton>
    </>
  );
}
