import { MenuItem, useToast } from "@chakra-ui/react";

import { NostrEvent } from "../../types/nostr-event";
import { getSharableEventAddress } from "../../helpers/nip19";
import { ShareIcon } from "../icons";
import { Signature } from "@noble/secp256k1";
import { descriptors } from "chart.js/dist/core/core.defaults";
import useUserMetadata from "../../hooks/use-user-metadata";
import { useCallback } from "react";
import { getDisplayName } from "../../helpers/nostr/user-metadata";

let urlShareFailed = false;

export default function ShareLinkMenuItem({ event }: { event: NostrEvent }) {
  const toast = useToast();
  const address = getSharableEventAddress(event);
  const metadata = useUserMetadata(event.pubkey);

  const share = useCallback(async () => {
    const data: ShareData = {
      url: "https://njump.me/" + address,
      title: event.tags.find((t) => t[0] === "title")?.[1] || "Nostr note by " + getDisplayName(metadata, event.pubkey),
    };

    if (event.content.length <= 256) data.text = event.content;

    try {
      if (navigator.canShare?.(data)) {
        await navigator.share(data);
      } else {
        if (navigator.clipboard) {
          await navigator.clipboard.writeText(data.url!);
          toast({ status: "success", description: "Copied" });
        } else toast({ description: data.url, isClosable: true, duration: null });
      }
    } catch (err) {
      if (err instanceof Error) toast({ status: "error", description: err.message });
    }
  }, [metadata, event, toast]);

  return (
    address && (
      <MenuItem onClick={share} icon={<ShareIcon />}>
        Share Link
      </MenuItem>
    )
  );
}
