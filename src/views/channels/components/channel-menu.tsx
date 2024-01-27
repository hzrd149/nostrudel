import { CustomMenuIconButton, MenuIconButtonProps } from "../../../components/menu-icon-button";
import { NostrEvent } from "../../../types/nostr-event";
import OpenInAppMenuItem from "../../../components/common-menu-items/open-in-app";
import CopyEmbedCodeMenuItem from "../../../components/common-menu-items/copy-embed-code";
import DebugEventMenuItem from "../../../components/debug-modal/debug-event-menu-item";

export default function ChannelMenu({
  channel,
  ...props
}: Omit<MenuIconButtonProps, "children"> & { channel: NostrEvent }) {
  return (
    <>
      <CustomMenuIconButton {...props}>
        <OpenInAppMenuItem event={channel} />
        <CopyEmbedCodeMenuItem event={channel} />
        <DebugEventMenuItem event={channel} />
      </CustomMenuIconButton>
    </>
  );
}
