import { Heading, LinkBox, Text } from "@chakra-ui/react";
import { NostrEvent } from "nostr-tools";
import { Link as RouterLink } from "react-router-dom";

import HoverLinkOverlay from "../../../components/hover-link-overlay";
import { getSharableEventAddress } from "../../../helpers/nip19";
import { getPageSummary, getPageTitle } from "../../../helpers/nostr/wiki";
import UserLink from "../../../components/user/user-link";
import Timestamp from "../../../components/timestamp";

export default function WikiPageResult({ page }: { page: NostrEvent }) {
  return (
    <LinkBox py="2" px="4">
      <Heading size="md">
        <HoverLinkOverlay as={RouterLink} to={`/wiki/page/${getSharableEventAddress(page)}`}>
          {getPageTitle(page)}
        </HoverLinkOverlay>
      </Heading>
      <Text>
        by <UserLink pubkey={page.pubkey} fontWeight="bold " /> - <Timestamp timestamp={page.created_at} />
      </Text>
      <Text color="GrayText" noOfLines={2}>
        {getPageSummary(page)}
      </Text>
    </LinkBox>
  );
}
