import { MenuItem } from "@chakra-ui/react";

import { NostrEvent } from "../../types/nostr-event";
import { getSharableEventAddress } from "../../helpers/nip19";
import { ShareIcon } from "../icons";

export default function CopyShareLinkMenuItem({ event }: { event: NostrEvent }) {
  const address = getSharableEventAddress(event);

  return (
    address && (
      <MenuItem
        onClick={() => window.navigator.clipboard.writeText("https://njump.me/" + address)}
        icon={<ShareIcon />}
      >
        Copy share link
      </MenuItem>
    )
  );
}
