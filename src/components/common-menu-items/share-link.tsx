import { Share } from "@capacitor/share";
import { MenuItem, useToast } from "@chakra-ui/react";
import { NostrEvent } from "nostr-tools";
import { useCallback } from "react";

import { CAP_IS_NATIVE } from "../../env";
import { getDisplayName } from "../../helpers/nostr/profile";
import useShareableEventAddress from "../../hooks/use-shareable-event-address";
import useUserProfile from "../../hooks/use-user-profile";
import { ShareIcon } from "../icons";

export default function ShareLinkMenuItem({ event }: { event: NostrEvent }) {
  const toast = useToast();
  const address = useShareableEventAddress(event);
  const metadata = useUserProfile(event.pubkey);

  const handleClick = useCallback(async () => {
    const data: ShareData = {
      url: "https://njump.me/" + address,
      title: event.tags.find((t) => t[0] === "title")?.[1] || "Nostr note by " + getDisplayName(metadata, event.pubkey),
    };

    if (event.content.length <= 256) data.text = event.content;

    try {
      if (CAP_IS_NATIVE) {
        await Share.share({
          title: data.title,
          text: data.text,
          url: data.url,
        });
      } else if (navigator.canShare?.(data)) {
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
      <MenuItem onClick={handleClick} icon={<ShareIcon />}>
        Share Link
      </MenuItem>
    )
  );
}
