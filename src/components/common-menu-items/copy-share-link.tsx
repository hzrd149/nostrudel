import { MenuItem, useToast } from "@chakra-ui/react";

import { NostrEvent } from "../../types/nostr-event";
import { getSharableEventAddress } from "../../helpers/nip19";
import { ShareIcon } from "../icons";

export default function CopyShareLinkMenuItem({ event }: { event: NostrEvent }) {
  const toast = useToast();
  const address = getSharableEventAddress(event);

  return (
    address && (
      <MenuItem
        onClick={() => {
          const text = "https://njump.me/" + address;
          if (navigator.clipboard) navigator.clipboard.writeText(text);
          else toast({ description: text, isClosable: true, duration: null });
        }}
        icon={<ShareIcon />}
      >
        Copy share link
      </MenuItem>
    )
  );
}
