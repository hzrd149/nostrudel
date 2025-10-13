import { MenuItem, useDisclosure } from "@chakra-ui/react";
import { NostrEvent } from "nostr-tools";

import CopyEmbedCodeMenuItem from "../../../components/menu/copy-embed-code";
import DeleteEventMenuItem from "../../../components/menu/delete-event";
import MuteUserMenuItem from "../../../components/menu/mute-user";
import OpenInAppMenuItem from "../../../components/menu/open-in-app";
import QuoteEventMenuItem from "../../../components/menu/quote-event";
import DebugEventMenuItem from "../../../components/debug-modal/debug-event-menu-item";
import { DotsMenuButton, MenuIconButtonProps } from "../../../components/menu/dots-menu-button";

export default function TorrentMenu({
  torrent,
  ...props
}: { torrent: NostrEvent } & Omit<MenuIconButtonProps, "children">) {
  return (
    <>
      <DotsMenuButton {...props}>
        <OpenInAppMenuItem event={torrent} />
        <QuoteEventMenuItem event={torrent} />
        <CopyEmbedCodeMenuItem event={torrent} />
        <MuteUserMenuItem event={torrent} />
        <DeleteEventMenuItem event={torrent} />
        <DebugEventMenuItem event={torrent} />
      </DotsMenuButton>
    </>
  );
}
