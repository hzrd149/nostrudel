import { NostrEvent } from "nostr-tools";

import DebugEventMenuItem from "../debug-modal/debug-event-menu-item";
import CopyEmbedCodeMenuItem from "../menu/copy-embed-code";
import DeleteEventMenuItem from "../menu/delete-event";
import { DotsMenuButton, MenuIconButtonProps } from "../menu/dots-menu-button";
import OpenInAppMenuItem from "../menu/open-in-app";
import ShareLinkMenuItem from "../menu/share-link";

export default function PollMenu({ event, ...props }: { event: NostrEvent } & Omit<MenuIconButtonProps, "children">) {
  return (
    <DotsMenuButton {...props}>
      <OpenInAppMenuItem event={event} />
      <ShareLinkMenuItem event={event} />
      <CopyEmbedCodeMenuItem event={event} />
      <DeleteEventMenuItem event={event} />
      <DebugEventMenuItem event={event} />
    </DotsMenuButton>
  );
}
