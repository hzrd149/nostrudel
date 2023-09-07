import { Badge, BadgeProps } from "@chakra-ui/react";
import { ParsedStream } from "../../../helpers/nostr/stream";

export default function StreamStatusBadge({
  stream,
  ...props
}: { stream: ParsedStream } & Omit<BadgeProps, "children">) {
  switch (stream.status) {
    case "live":
      return (
        <Badge colorScheme="green" variant="solid" {...props}>
          live
        </Badge>
      );
    case "ended":
      return (
        <Badge colorScheme="red" variant="solid" {...props}>
          ended
        </Badge>
      );
  }
  return null;
}
