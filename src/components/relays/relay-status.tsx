import { Badge, BadgeProps } from "@chakra-ui/react";
import { use$ } from "applesauce-react/hooks";

import { getConnectionStateColor } from "../../helpers/relay";
import { connectionState$ } from "../../services/pool";

export default function RelayStatusBadge({
  relay,
  ...props
}: { relay: string } & Omit<BadgeProps, "colorScheme" | "children">) {
  const state = use$(() => connectionState$(relay), [relay]);

  return (
    <Badge colorScheme={getConnectionStateColor(state)} {...props}>
      {state}
    </Badge>
  );
}
