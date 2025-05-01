import { DotsMenuButton, MenuIconButtonProps } from "../../../components/menu/dots-menu-button";
import { NostrEvent } from "nostr-tools";
import OpenInAppMenuItem from "../../../components/menu/open-in-app";
import CopyEmbedCodeMenuItem from "../../../components/menu/copy-embed-code";
import DebugEventMenuItem from "../../../components/debug-modal/debug-event-menu-item";

export default function ChannelMenu({
  channel,
  ...props
}: Omit<MenuIconButtonProps, "children"> & { channel: NostrEvent }) {
  return (
    <>
      <DotsMenuButton {...props}>
        <OpenInAppMenuItem event={channel} />
        <CopyEmbedCodeMenuItem event={channel} />
        <DebugEventMenuItem event={channel} />
      </DotsMenuButton>
    </>
  );
}
