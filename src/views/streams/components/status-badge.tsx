import { Badge, BadgeProps } from "@chakra-ui/react";
import { Stream } from "applesauce-common/casts";

export default function StreamStatusBadge({ stream, ...props }: { stream: Stream } & Omit<BadgeProps, "children">) {
  switch (stream.status) {
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
