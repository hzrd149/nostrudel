import { Badge, BadgeProps } from "@chakra-ui/react";
import { NostrEvent } from "nostr-tools";

import { getStreamStatus } from "../../../helpers/nostr/stream";

export default function StreamStatusBadge({ stream, ...props }: { stream: NostrEvent } & Omit<BadgeProps, "children">) {
  switch (getStreamStatus(stream)) {
    case "planned":
      return (
        <Badge colorScheme="orange" variant="solid" {...props}>
          Planned
        </Badge>
      );
    case "live":
      return (
        <Badge colorScheme="green" variant="solid" px="3" {...props}>
          Live
        </Badge>
      );
    case "ended":
      return (
        <Badge colorScheme="red" variant="solid" {...props}>
          Ended
        </Badge>
      );
  }
  return null;
}
