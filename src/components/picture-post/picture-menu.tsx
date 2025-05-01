import { NostrEvent } from "nostr-tools";

import DebugEventMenuItem from "../debug-modal/debug-event-menu-item";
import CopyEmbedCodeMenuItem from "../menu/copy-embed-code";
import DeleteEventMenuItem from "../menu/delete-event";
import { DotsMenuButton, MenuIconButtonProps } from "../menu/dots-menu-button";
import MuteUserMenuItem from "../menu/mute-user";
import OpenInAppMenuItem from "../menu/open-in-app";
import ShareLinkMenuItem from "../menu/share-link";

export default function PicturePostMenu({
  post,
  ...props
}: { post: NostrEvent } & Omit<MenuIconButtonProps, "children">) {
  return (
    <DotsMenuButton {...props}>
      <OpenInAppMenuItem event={post} />
      <ShareLinkMenuItem event={post} />
      <CopyEmbedCodeMenuItem event={post} />
      <MuteUserMenuItem event={post} />
      <DeleteEventMenuItem event={post} />

      <DebugEventMenuItem event={post} />
    </DotsMenuButton>
  );
}
