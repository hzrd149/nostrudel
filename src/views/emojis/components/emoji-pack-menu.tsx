import { NostrEvent } from "nostr-tools";
import { DotsMenuButton, MenuIconButtonProps } from "../../../components/menu/dots-menu-button";
import OpenInAppMenuItem from "../../../components/menu/open-in-app";
import DeleteEventMenuItem from "../../../components/menu/delete-event";
import CopyEmbedCodeMenuItem from "../../../components/menu/copy-embed-code";
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
