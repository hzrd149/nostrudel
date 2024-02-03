import { NostrEvent } from "../../../types/nostr-event";
import { CustomMenuIconButton, MenuIconButtonProps } from "../../../components/menu-icon-button";
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
      <CustomMenuIconButton {...props}>
        <OpenInAppMenuItem event={pack} />
        <CopyEmbedCodeMenuItem event={pack} />
        <DeleteEventMenuItem event={pack} label="Delete Pack" />
        <DebugEventMenuItem event={pack} />
      </CustomMenuIconButton>
    </>
  );
}
