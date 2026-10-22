import { CenterProps } from "@chakra-ui/react";
import { useMemo } from "react";

import { getNappletEventPointer, parseNappletPointer } from "../../helpers/nostr/napplets";
import useEvent from "../../hooks/use-event";
import { type InstalledNapplet } from "../../services/installed-napplets";
import NappletIconImage from "./napplet-icon";

/** The icon of an installed napplet, loaded from its manifest */
export default function InstalledNappletIcon({ napplet, ...props }: { napplet: InstalledNapplet } & CenterProps) {
  const pointer = useMemo(() => {
    const decoded = parseNappletPointer(napplet.address);
    return decoded && getNappletEventPointer(decoded);
  }, [napplet.address]);
  const manifest = useEvent(pointer);

  return <NappletIconImage event={manifest} {...props} />;
}
