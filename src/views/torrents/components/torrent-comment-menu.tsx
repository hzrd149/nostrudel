import { NostrEvent } from "nostr-tools";

import CopyEmbedCodeMenuItem from "../../../components/common-menu-items/copy-embed-code";
import DeleteEventMenuItem from "../../../components/common-menu-items/delete-event";
import MuteUserMenuItem from "../../../components/common-menu-items/mute-user";
import OpenInAppMenuItem from "../../../components/common-menu-items/open-in-app";
import ShareLinkMenuItem from "../../../components/common-menu-items/share-link";
import DebugEventMenuItem from "../../../components/debug-modal/debug-event-menu-item";
import { DotsMenuButton, MenuIconButtonProps } from "../../../components/dots-menu-button";

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
