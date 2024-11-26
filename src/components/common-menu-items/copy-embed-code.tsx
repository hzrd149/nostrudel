import { MenuItem } from "@chakra-ui/react";

import { NostrEvent } from "../../types/nostr-event";
import { CopyToClipboardIcon } from "../icons";
import { getSharableEventAddress } from "../../services/event-relay-hint";

export default function CopyEmbedCodeMenuItem({ event }: { event: NostrEvent }) {
  const address = getSharableEventAddress(event);

  return (
    address && (
      <MenuItem onClick={() => window.navigator.clipboard.writeText("nostr:" + address)} icon={<CopyToClipboardIcon />}>
        Copy embed code
      </MenuItem>
    )
  );
}
