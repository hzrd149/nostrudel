import { MenuItem } from "@chakra-ui/react";

import { NostrEvent } from "../../types/nostr-event";
import { ExternalLinkIcon } from "../icons";
import { getSharableEventAddress } from "../../helpers/nip19";
import { useCallback, useContext, useMemo } from "react";
import { AppHandlerContext } from "../../providers/route/app-handler-provider";

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
