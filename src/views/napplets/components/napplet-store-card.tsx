import { Badge, Box, Flex, LinkBox, LinkBoxProps, LinkOverlay, Text } from "@chakra-ui/react";
import { NostrEvent } from "nostr-tools";
import { memo, type ReactNode } from "react";
import { Link as RouterLink } from "react-router-dom";

import { LightningIcon, LikeIcon, ThreadIcon } from "../../../components/icons";
import NappletIconImage from "../../../components/napplets/napplet-icon";
import UserAvatar from "../../../components/user/user-avatar";
import UserName from "../../../components/user/user-name";
import { getNappletDescription, getNappletNaddr, getNappletTitle } from "../../../helpers/nostr/napplets";
import { humanReadableSats } from "../../../helpers/lightning";
import useEventIntersectionRef from "../../../hooks/use-event-intersection-ref";
import { type NappletEngagement } from "../../../hooks/use-napplet-engagement";

/** Fixed height so virtualized grids can size rows without measuring */
export const NAPPLET_STORE_CARD_HEIGHT = 120;

function EngagementStat({ icon, value }: { icon: ReactNode; value: string }) {
  return (
    <Flex gap="1" alignItems="center" flexShrink={0}>
      {icon}
      <Text>{value}</Text>
    </Flex>
  );
}

const NappletStoreCard = memo(function NappletStoreCard({
  event,
  installed,
  engagement,
  showAuthor = true,
  ...props
}: {
  event: NostrEvent;
  installed: boolean;
  engagement?: NappletEngagement;
  showAuthor?: boolean;
} & Omit<LinkBoxProps, "children">) {
  const ref = useEventIntersectionRef(event);
  const address = getNappletNaddr(event);
  const description = getNappletDescription(event);
  const hasEngagement = !!engagement && engagement.likes + engagement.comments + engagement.zaps > 0;

  return (
    <LinkBox
      ref={ref}
      display="flex"
      gap="3"
      p="3"
      h={`${NAPPLET_STORE_CARD_HEIGHT}px`}
      overflow="hidden"
      borderRadius="lg"
      _hover={{ bg: "var(--chakra-colors-card-hover-overlay)" }}
      {...props}
    >
      <NappletIconImage event={event} boxSize="14" flexShrink={0} />
      <Box minW="0" flex="1">
        <Flex gap="2" alignItems="center" minW="0">
          <LinkOverlay as={RouterLink} to={`/app/store/${address}`} fontWeight="bold" isTruncated>
            {getNappletTitle(event)}
          </LinkOverlay>
          {installed && <Badge colorScheme="primary">Installed</Badge>}
        </Flex>
        {(showAuthor || hasEngagement) && (
          <Flex gap="3" color="GrayText" alignItems="center" minW="0">
            {showAuthor && (
              <Flex gap="2" alignItems="center" minW="0" mr="auto">
                <UserAvatar pubkey={event.pubkey} size="xs" />
                <UserName pubkey={event.pubkey} isTruncated />
              </Flex>
            )}
            {!!engagement?.likes && <EngagementStat icon={<LikeIcon />} value={String(engagement.likes)} />}
            {!!engagement?.comments && <EngagementStat icon={<ThreadIcon />} value={String(engagement.comments)} />}
            {!!engagement?.zaps && (
              <EngagementStat icon={<LightningIcon />} value={humanReadableSats(engagement.zaps)} />
            )}
          </Flex>
        )}
        {description && (
          <Text color="GrayText" noOfLines={showAuthor || hasEngagement ? 2 : 3}>
            {description}
          </Text>
        )}
      </Box>
    </LinkBox>
  );
});

export default NappletStoreCard;
