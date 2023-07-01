import { Badge } from "@chakra-ui/react";
import { ParsedStream } from "../../../helpers/nostr/stream";

export default function StreamStatusBadge({ stream }: { stream: ParsedStream }) {
  switch (stream.status) {
    case "live":
      return <Badge colorScheme="green">live</Badge>;
    case "ended":
      return <Badge colorScheme="red">ended</Badge>;
  }
  return null;
}
