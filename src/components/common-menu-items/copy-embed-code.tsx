import { MenuItem } from "@chakra-ui/react";

import { NostrEvent } from "../../types/nostr-event";
import { getSharableEventAddress } from "../../helpers/nip19";
import { CopyToClipboardIcon } from "../icons";

export default function CopyEmbedCodeMenuItem({ event }: { event: NostrEvent }) {
  const address = getSharableEventAddress(event);

  return (
    address && (
      <MenuItem onClick={() => window.navigator.clipboard.writeText("nostr:" + address)} icon={<CopyToClipboardIcon />}>
        Copy Embed Code
      </MenuItem>
    )
  );
}
