import { DotsMenuButton, MenuIconButtonProps } from "../../../components/dots-menu-button";
import OpenInAppMenuItem from "../../../components/common-menu-items/open-in-app";
import ShareLinkMenuItem from "../../../components/common-menu-items/share-link";
import CopyEmbedCodeMenuItem from "../../../components/common-menu-items/copy-embed-code";
import MuteUserMenuItem from "../../../components/common-menu-items/mute-user";
import DeleteEventMenuItem from "../../../components/common-menu-items/delete-event";
import { NostrEvent } from "../../../types/nostr-event";
import DebugEventMenuItem from "../../../components/debug-modal/debug-event-menu-item";

export default function TorrentCommentMenu({
  comment,
  ...props
}: { comment: NostrEvent } & Omit<MenuIconButtonProps, "children">) {
  return (
    <>
      <DotsMenuButton {...props}>
        <OpenInAppMenuItem event={comment} />
        <ShareLinkMenuItem event={comment} />
        <CopyEmbedCodeMenuItem event={comment} />
        <MuteUserMenuItem event={comment} />
        <DeleteEventMenuItem event={comment} />
        <DebugEventMenuItem event={comment} />
      </DotsMenuButton>
    </>
  );
}
