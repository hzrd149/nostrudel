import { NostrEvent } from "nostr-tools";

import CopyEmbedCodeMenuItem from "../../../components/menu/copy-embed-code";
import DeleteEventMenuItem from "../../../components/menu/delete-event";
import MuteUserMenuItem from "../../../components/menu/mute-user";
import OpenInAppMenuItem from "../../../components/menu/open-in-app";
import ShareLinkMenuItem from "../../../components/menu/share-link";
import DebugEventMenuItem from "../../../components/debug-modal/debug-event-menu-item";
import { DotsMenuButton, MenuIconButtonProps } from "../../../components/menu/dots-menu-button";

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
