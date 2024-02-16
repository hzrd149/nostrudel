import { NostrEvent } from "../../../types/nostr-event";
import { DotsMenuButton, MenuIconButtonProps } from "../../../components/dots-menu-button";
import OpenInAppMenuItem from "../../../components/common-menu-items/open-in-app";
import CopyShareLinkMenuItem from "../../../components/common-menu-items/copy-share-link";
import CopyEmbedCodeMenuItem from "../../../components/common-menu-items/copy-embed-code";
import MuteUserMenuItem from "../../../components/common-menu-items/mute-user";
import DebugEventMenuItem from "../../../components/debug-modal/debug-event-menu-item";

export default function TrackMenu({
  track,
  detailsClick,
  ...props
}: { track: NostrEvent; detailsClick?: () => void } & Omit<MenuIconButtonProps, "children">) {
  return (
    <>
      <DotsMenuButton {...props}>
        <OpenInAppMenuItem event={track} />
        <CopyShareLinkMenuItem event={track} />
        <CopyEmbedCodeMenuItem event={track} />
        <MuteUserMenuItem event={track} />

        <DebugEventMenuItem event={track} />
      </DotsMenuButton>
    </>
  );
}
