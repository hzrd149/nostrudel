import { useContext, useMemo } from "react";
import { Link, Text, TextProps } from "@chakra-ui/react";
import { nip19, NostrEvent } from "nostr-tools";

import { getEventCommunityPointer } from "../../../helpers/nostr/communities";
import { AppHandlerContext } from "../../../providers/route/app-handler-provider";

/** @deprecated remove when communities are no longer supported */
export default function NoteCommunityMetadata({
  event,
  ...props
}: Omit<TextProps, "children"> & { event: NostrEvent }) {
  const communityPointer = useMemo(() => getEventCommunityPointer(event), [event]);
  const { openAddress } = useContext(AppHandlerContext);

  if (!communityPointer) return null;

  return (
    <Text fontStyle="italic" {...props}>
      Posted in{" "}
      <Link onClick={() => openAddress(nip19.naddrEncode(communityPointer))} color="blue.500">
        {communityPointer.identifier}
      </Link>{" "}
      community
    </Text>
  );
}
