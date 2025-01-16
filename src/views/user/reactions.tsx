import { useOutletContext } from "react-router";
import { Box, Flex, Spacer, Text } from "@chakra-ui/react";
import { nip25 } from "nostr-tools";

import useTimelineLoader from "../../hooks/use-timeline-loader";
import { NostrEvent } from "../../types/nostr-event";
import { useAdditionalRelayContext } from "../../providers/local/additional-relay-context";
import { useReadRelays } from "../../hooks/use-client-relays";
import TimelineActionAndStatus from "../../components/timeline/timeline-action-and-status";
import IntersectionObserverProvider from "../../providers/local/intersection-observer";
import { useTimelineCurserIntersectionCallback } from "../../hooks/use-timeline-cursor-intersection-callback";
import { TrustProvider } from "../../providers/local/trust-provider";
import UserAvatar from "../../components/user/user-avatar";
import UserLink from "../../components/user/user-link";
import { EmbedEventPointer } from "../../components/embed-event";
import VerticalPageLayout from "../../components/vertical-page-layout";
import NoteMenu from "../../components/note/note-menu";
import useEventIntersectionRef from "../../hooks/use-event-intersection-ref";

const Reaction = ({ reaction: reaction }: { reaction: NostrEvent }) => {
  const ref = useEventIntersectionRef(reaction);

  const pointer = nip25.getReactedEventPointer(reaction);
  if (!pointer) return null;

  const decoded = { type: "nevent", data: pointer } as const;

  return (
    <Box ref={ref}>
      <Flex gap="2" mb="2">
        <UserAvatar pubkey={reaction.pubkey} size="xs" />
        <Text>
          <UserLink pubkey={reaction.pubkey} /> {reaction.content === "+" ? "liked " : "reacted with "}
          {reaction.content}
        </Text>
        <Spacer />
        <NoteMenu event={reaction} aria-label="Note menu" variant="ghost" size="xs" />
      </Flex>
      <EmbedEventPointer pointer={decoded} />
    </Box>
  );
};

export default function UserReactionsTab() {
  const { pubkey } = useOutletContext() as { pubkey: string };
  const contextRelays = useAdditionalRelayContext();
  const readRelays = useReadRelays(contextRelays);

  const { loader, timeline: reactions } = useTimelineLoader(`${pubkey}-reactions`, readRelays, {
    authors: [pubkey],
    kinds: [7],
  });
  const callback = useTimelineCurserIntersectionCallback(loader);

  return (
    <IntersectionObserverProvider callback={callback}>
      <TrustProvider trust>
        <VerticalPageLayout>
          {reactions?.map((event) => <Reaction key={event.id} reaction={event} />)}

          <TimelineActionAndStatus timeline={loader} />
        </VerticalPageLayout>
      </TrustProvider>
    </IntersectionObserverProvider>
  );
}
