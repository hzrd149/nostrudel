import { Code, Flex, FlexProps, LinkBox, Text } from "@chakra-ui/react";
import { NostrEvent, kinds, nip19, nip25 } from "nostr-tools";
import { Link as RouterLink } from "react-router-dom";

import { useReadRelays } from "../../../hooks/use-client-relays";
import useCurrentAccount from "../../../hooks/use-current-account";
import useTimelineLoader from "../../../hooks/use-timeline-loader";
import useSubject from "../../../hooks/use-subject";
import TimelineActionAndStatus from "../../timeline/timeline-action-and-status";
import IntersectionObserverProvider from "../../../providers/local/intersection-observer";
import Timestamp from "../../timestamp";
import { useTimelineCurserIntersectionCallback } from "../../../hooks/use-timeline-cursor-intersection-callback";
import { getDMRecipient, getDMSender } from "../../../helpers/nostr/dms";
import UserName from "../../user/user-name";
import HoverLinkOverlay from "../../hover-link-overlay";
import useEventIntersectionRef from "../../../hooks/use-event-intersection-ref";
import relayHintService from "../../../services/event-relay-hint";

const kindColors: Record<number, FlexProps["bg"]> = {
  [kinds.ShortTextNote]: "blue.500",
  [kinds.EncryptedDirectMessage]: "orange.500",
  [kinds.Repost]: "yellow.500",
  [kinds.GenericRepost]: "yellow.500",
  [kinds.Reaction]: "green.500",
  [kinds.LongFormArticle]: "purple.500",
};

function KindTag({ event }: { event: NostrEvent }) {
  return (
    <Code
      px="2"
      fontFamily="monospace"
      fontWeight="bold"
      borderLeftWidth={4}
      borderLeftColor={kindColors[event.kind] || "gray.500"}
      fontSize="md"
    >
      {event.kind}
    </Code>
  );
}

function TimelineItem({ event }: { event: NostrEvent }) {
  const ref = useEventIntersectionRef(event);

  const renderContent = () => {
    switch (event.kind) {
      case kinds.EncryptedDirectMessage:
        const sender = getDMSender(event);
        const recipient = getDMRecipient(event);
        return (
          <Text>
            <UserName pubkey={sender} fontWeight="bold" /> messaged <UserName pubkey={recipient} fontWeight="bold" />
          </Text>
        );
      case kinds.Contacts:
        return (
          <Text noOfLines={1} isTruncated>
            Updated contacts
          </Text>
        );
      case kinds.Reaction:
        const pointer = nip25.getReactedEventPointer(event);
        return (
          <HoverLinkOverlay
            as={RouterLink}
            to={`/l/${pointer ? nip19.neventEncode(pointer) : ""}`}
            noOfLines={1}
            isTruncated
          >
            {event.content}
          </HoverLinkOverlay>
        );
      default:
        return (
          <HoverLinkOverlay
            as={RouterLink}
            to={`/l/${relayHintService.getSharableEventAddress(event)}`}
            noOfLines={1}
            isTruncated
          >
            {event.content}
          </HoverLinkOverlay>
        );
    }
  };

  return (
    <Flex as={LinkBox} ref={ref} gap="2" py="1" overflow="hidden" flexShrink={0}>
      <KindTag event={event} />
      {renderContent()}
      <Timestamp timestamp={event.created_at} ml="auto" />
    </Flex>
  );
}

export default function GhostTimeline({ ...props }: Omit<FlexProps, "children">) {
  const account = useCurrentAccount()!;
  const readRelays = useReadRelays();

  const timeline = useTimelineLoader(`${account.pubkey}-ghost`, readRelays, { authors: [account.pubkey] });
  const events = useSubject(timeline.timeline);

  const callback = useTimelineCurserIntersectionCallback(timeline);

  return (
    <IntersectionObserverProvider callback={callback}>
      <Flex direction="column" overflow="auto" {...props}>
        {events.map((event) => (
          <TimelineItem key={event.id} event={event} />
        ))}
        <TimelineActionAndStatus timeline={timeline} />
      </Flex>
    </IntersectionObserverProvider>
  );
}
