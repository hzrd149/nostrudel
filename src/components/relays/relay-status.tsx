import { Badge, BadgeProps } from "@chakra-ui/react";
import { useObservable } from "applesauce-react/hooks";

import { connections$ } from "../../services/pool";
import { getConnectionStateColor } from "../../helpers/relay";

export default function RelayStatusBadge({
  relay,
  ...props
}: { relay: string } & Omit<BadgeProps, "colorScheme" | "children">) {
  const connections = useObservable(connections$) ?? {};
  const state = connections[relay];

  return (
    <Badge colorScheme={getConnectionStateColor(state)} {...props}>
      {state}
    </Badge>
  );
}
