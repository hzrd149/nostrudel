import { Badge, BadgeProps } from "@chakra-ui/react";
import { useObservableState } from "applesauce-react/hooks";

import { getConnectionStateColor } from "../../helpers/relay";
import { connections$ } from "../../services/pool";

export default function RelayStatusBadge({
  relay,
  ...props
}: { relay: string } & Omit<BadgeProps, "colorScheme" | "children">) {
  const connections = useObservableState(connections$) ?? {};
  const state = connections[relay];

  return (
    <Badge colorScheme={getConnectionStateColor(state)} {...props}>
      {state}
    </Badge>
  );
}
