import { NostrEvent } from "../../../types/nostr-event";
import { DotsMenuButton, MenuIconButtonProps } from "../../../components/dots-menu-button";
import OpenInAppMenuItem from "../../../components/common-menu-items/open-in-app";
import DeleteEventMenuItem from "../../../components/common-menu-items/delete-event";
import CopyEmbedCodeMenuItem from "../../../components/common-menu-items/copy-embed-code";
import DebugEventMenuItem from "../../../components/debug-modal/debug-event-menu-item";

export default function EmojiPackMenu({
  pack,
  ...props
}: { pack: NostrEvent } & Omit<MenuIconButtonProps, "children">) {
  return (
    <>
      <DotsMenuButton {...props}>
        <OpenInAppMenuItem event={pack} />
        <CopyEmbedCodeMenuItem event={pack} />
        <DeleteEventMenuItem event={pack} label="Delete Pack" />
        <DebugEventMenuItem event={pack} />
      </DotsMenuButton>
    </>
  );
}
