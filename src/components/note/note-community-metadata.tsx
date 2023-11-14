import { useMemo } from "react";
import { Link as RouterLink } from "react-router-dom";
import { Link, Text, TextProps } from "@chakra-ui/react";

import { NostrEvent } from "../../types/nostr-event";
import { getEventCommunityPointer } from "../../helpers/nostr/communities";

export default function NoteCommunityMetadata({
  event,
  ...props
}: Omit<TextProps, "children"> & { event: NostrEvent }) {
  const communityPointer = useMemo(() => getEventCommunityPointer(event), [event]);

  if (!communityPointer) return null;

  return (
    <Text fontStyle="italic" {...props}>
      Posted in{" "}
      <Link as={RouterLink} to={`/c/${communityPointer.identifier}/${communityPointer.pubkey}`} color="blue.500">
        {communityPointer.identifier}
      </Link>{" "}
      community
    </Text>
  );
}
