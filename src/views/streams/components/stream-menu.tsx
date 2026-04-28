import { MenuDivider, MenuGroup, MenuItem, useToast } from "@chakra-ui/react";
import { NostrEvent } from "nostr-tools";
import { useMemo } from "react";

import DebugEventMenuItem from "../../../components/debug-modal/debug-event-menu-item";
import { CopyToClipboardIcon, ExternalLinkIcon } from "../../../components/icons";
import CopyEmbedCodeMenuItem from "../../../components/menu/copy-embed-code";
import { DotsMenuButton, MenuIconButtonProps } from "../../../components/menu/dots-menu-button";
import OpenInAppMenuItem from "../../../components/menu/open-in-app";
import QuoteEventMenuItem from "../../../components/menu/quote-event";
import ShareLinkMenuItem from "../../../components/menu/share-link";
import { getStreamStreamingURLs } from "../../../helpers/nostr/stream";
import useAsyncAction from "../../../hooks/use-async-action";

export default function StreamMenu({
  stream,
  ...props
}: { stream: NostrEvent } & Omit<MenuIconButtonProps, "children">) {
  const toast = useToast();
  const streamURL = useMemo(() => getStreamStreamingURLs(stream)[0], [stream]);

  const { run: copyStreamURL } = useAsyncAction(async () => {
    if (!streamURL) return;

    if (navigator.clipboard) {
      await navigator.clipboard.writeText(streamURL);
      toast({ status: "success", description: "Copied stream URL" });
    } else toast({ description: streamURL, isClosable: true, duration: null });
  }, [streamURL, toast]);

  return (
    <DotsMenuButton {...props}>
      <OpenInAppMenuItem event={stream} />
      <ShareLinkMenuItem event={stream} />
      <QuoteEventMenuItem event={stream} />
      <CopyEmbedCodeMenuItem event={stream} />
      <DebugEventMenuItem event={stream} />
      {streamURL && (
        <>
          <MenuDivider />
          <MenuGroup title="Stream URL">
            <MenuItem icon={<CopyToClipboardIcon />} onClick={() => copyStreamURL()}>
              Copy URL
            </MenuItem>
            <MenuItem icon={<ExternalLinkIcon />} onClick={() => location.assign(streamURL)}>
              Open URL
            </MenuItem>
            <MenuItem
              icon={<ExternalLinkIcon />}
              onClick={() => window.open(streamURL, "_blank", "noopener,noreferrer")}
            >
              Open URL in new tab
            </MenuItem>
          </MenuGroup>
        </>
      )}
    </DotsMenuButton>
  );
}
