import { Box, Flex, Spacer, Text } from "@chakra-ui/react";
import { nip25, NostrEvent } from "nostr-tools";
import { useOutletContext } from "react-router-dom";

import { EmbedEventPointerCard } from "../../components/embed-event/card";
import NoteMenu from "../../components/note/note-menu";
import TimelineActionAndStatus from "../../components/timeline/timeline-action-and-status";
import UserAvatar from "../../components/user/user-avatar";
import UserLink from "../../components/user/user-link";
import VerticalPageLayout from "../../components/vertical-page-layout";
import { useReadRelays } from "../../hooks/use-client-relays";
import useEventIntersectionRef from "../../hooks/use-event-intersection-ref";
import { useTimelineCurserIntersectionCallback } from "../../hooks/use-timeline-cursor-intersection-callback";
import useTimelineLoader from "../../hooks/use-timeline-loader";
import { useAdditionalRelayContext } from "../../providers/local/additional-relay";
import IntersectionObserverProvider from "../../providers/local/intersection-observer";
import { ContentSettingsProvider } from "../../providers/local/content-settings";

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
      <EmbedEventPointerCard pointer={decoded} />
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
      <ContentSettingsProvider blurMedia={false}>
        <VerticalPageLayout>
          {reactions?.map((event) => <Reaction key={event.id} reaction={event} />)}

          <TimelineActionAndStatus loader={loader} />
        </VerticalPageLayout>
      </ContentSettingsProvider>
    </IntersectionObserverProvider>
  );
}
