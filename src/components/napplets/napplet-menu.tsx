import { MenuItem, useToast } from "@chakra-ui/react";
import { NostrEvent } from "nostr-tools";

import DebugEventMenuItem from "../debug-modal/debug-event-menu-item";
import useAsyncAction from "../../hooks/use-async-action";
import useShareableEventAddress from "../../hooks/use-shareable-event-address";
import { CopyToClipboardIcon } from "../icons";
import { DotsMenuButton, MenuIconButtonProps } from "../menu/dots-menu-button";
import QuoteEventMenuItem from "../menu/quote-event";
import ShareLinkMenuItem from "../menu/share-link";

export default function NappletMenu({
  event,
  "aria-label": ariaLabel = "App menu",
  ...props
}: { event: NostrEvent } & Omit<MenuIconButtonProps, "children" | "aria-label"> & { "aria-label"?: string }) {
  const toast = useToast();
  const address = useShareableEventAddress(event);

  const { run: copyAddress } = useAsyncAction(async () => {
    if (!address) return;

    if (navigator.clipboard) {
      await navigator.clipboard.writeText(address);
      toast({ status: "success", description: "Copied app address" });
    } else toast({ description: address, isClosable: true, duration: null });
  }, [address, toast]);

  return (
    <DotsMenuButton aria-label={ariaLabel} {...props}>
      <ShareLinkMenuItem event={event} />
      {address && (
        <MenuItem icon={<CopyToClipboardIcon />} onClick={() => copyAddress()}>
          Copy app address
        </MenuItem>
      )}
      <QuoteEventMenuItem event={event} />
      <DebugEventMenuItem event={event} />
    </DotsMenuButton>
  );
}
