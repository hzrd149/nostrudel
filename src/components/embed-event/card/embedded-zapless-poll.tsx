import { Box, BoxProps, Flex, Link, LinkBox, Spacer, Text } from "@chakra-ui/react";
import { NostrEvent } from "nostr-tools";
import { MouseEventHandler, useCallback } from "react";
import { Link as RouterLink, useNavigate } from "react-router-dom";

import { getSharableEventAddress } from "../../../services/relay-hints";
import HoverLinkOverlay from "../../hover-link-overlay";
import BarChart09 from "../../icons/bar-chart-09";
import Timestamp from "../../timestamp";
import UserAvatarLink from "../../user/user-avatar-link";
import UserLink from "../../user/user-link";
import ZaplessPollContent from "../../zapless-poll/zapless-poll-content";

export default function EmbeddedZaplessPoll({
  event,
  ...props
}: Omit<BoxProps, "children" | "as"> & { event: NostrEvent }) {
  const navigate = useNavigate();
  const to = `/poll/${getSharableEventAddress(event)}`;

  const handleClick = useCallback<MouseEventHandler>(
    (e) => {
      e.preventDefault();
      navigate(to);
    },
    [navigate, to],
  );

  return (
    <Box
      as={LinkBox}
      borderWidth={0}
      borderLeftWidth={4}
      borderLeftColor="primary.500"
      borderRadius="md"
      pb={2}
      pt={1}
      {...props}
    >
      <Flex p="2" gap="2" alignItems="center" fontSize="sm">
        <BarChart09 boxSize={4} />
        <Text fontWeight="bold">Poll</Text>
        <UserAvatarLink pubkey={event.pubkey} size="xs" showNip05={false} />
        <UserLink pubkey={event.pubkey} isTruncated fontSize="md" />
        <Link as={RouterLink} to={to} whiteSpace="nowrap" color="GrayText">
          <Timestamp timestamp={event.created_at} />
        </Link>
        <HoverLinkOverlay as={RouterLink} to={to} onClick={handleClick} />
        <Spacer />
      </Flex>
      <ZaplessPollContent px="2" event={event} position="relative" zIndex={1} />
    </Box>
  );
}
