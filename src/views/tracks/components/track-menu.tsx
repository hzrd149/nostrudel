import { NostrEvent } from "nostr-tools";
import { DotsMenuButton, MenuIconButtonProps } from "../../../components/menu/dots-menu-button";
import OpenInAppMenuItem from "../../../components/menu/open-in-app";
import ShareLinkMenuItem from "../../../components/menu/share-link";
import CopyEmbedCodeMenuItem from "../../../components/menu/copy-embed-code";
import MuteUserMenuItem from "../../../components/menu/mute-user";
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
