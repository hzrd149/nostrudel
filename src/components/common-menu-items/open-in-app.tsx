import { useCallback, useContext, useMemo } from "react";
import { MenuItem } from "@chakra-ui/react";

import { NostrEvent } from "../../types/nostr-event";
import { ExternalLinkIcon } from "../icons";
import { AppHandlerContext } from "../../providers/route/app-handler-provider";
import { getSharableEventAddress } from "../../services/relay-hints";

export default function OpenInAppMenuItem({ event }: { event: NostrEvent }) {
  const address = useMemo(() => getSharableEventAddress(event), [event]);
  const { openAddress } = useContext(AppHandlerContext);
  const open = useCallback(() => address && openAddress(address), [address, openAddress]);

  if (!address) return null;
  return (
    <MenuItem icon={<ExternalLinkIcon />} onClick={open}>
      View in app...
    </MenuItem>
  );
}
