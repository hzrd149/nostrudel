import { memo } from "react";
import { NostrEvent } from "nostr-tools";

import { getEventRelays } from "../../services/event-relays";
import useSubject from "../../hooks/use-subject";
import { RelayIconStack, RelayIconStackProps } from "../relay-icon-stack";
import { getEventUID } from "../../helpers/nostr/event";
import { useBreakpointValue } from "../../providers/global/breakpoint-provider";

export const EventRelays = memo(
  ({ event, ...props }: { event: NostrEvent } & Omit<RelayIconStackProps, "relays" | "maxRelays">) => {
    const maxRelays = useBreakpointValue({ base: 3, md: undefined });
    const eventRelays = useSubject(getEventRelays(getEventUID(event)));

    return <RelayIconStack relays={eventRelays} direction="row-reverse" maxRelays={maxRelays} {...props} />;
  },
);
