import { Link, MenuItem } from "@chakra-ui/react";

import { NostrEvent } from "../../types/nostr-event";
import { buildAppSelectUrl } from "../../helpers/nostr/apps";
import { ExternalLinkIcon } from "../icons";
import { getSharableEventAddress } from "../../helpers/nip19";

export default function OpenInAppMenuItem({ event }: { event: NostrEvent }) {
  const address = getSharableEventAddress(event);

  return (
    address && (
      <MenuItem
        as={Link}
        href={buildAppSelectUrl(address)}
        icon={<ExternalLinkIcon />}
        isExternal
        textDecoration="none !important"
      >
        View in app...
      </MenuItem>
    )
  );
}
