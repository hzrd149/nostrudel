import { useRef } from "react";
import { useOutletContext } from "react-router-dom";
import { Box, Flex, Spacer, Text } from "@chakra-ui/react";
import { nip25 } from "nostr-tools";

import useTimelineLoader from "../../hooks/use-timeline-loader";
import { NostrEvent } from "../../types/nostr-event";
import { useAdditionalRelayContext } from "../../providers/local/additional-relay-context";
import { useReadRelays } from "../../hooks/use-client-relays";
import TimelineActionAndStatus from "../../components/timeline-page/timeline-action-and-status";
import useSubject from "../../hooks/use-subject";
import IntersectionObserverProvider, {
  useRegisterIntersectionEntity,
} from "../../providers/local/intersection-observer";
import { useTimelineCurserIntersectionCallback } from "../../hooks/use-timeline-cursor-intersection-callback";
import { TrustProvider } from "../../providers/local/trust-provider";
import UserAvatar from "../../components/user/user-avatar";
import UserLink from "../../components/user/user-link";
import { EmbedEventPointer } from "../../components/embed-event";
import { embedEmoji } from "../../components/external-embeds";
import VerticalPageLayout from "../../components/vertical-page-layout";
import NoteMenu from "../../components/note/note-menu";

const Reaction = ({ reaction: reaction }: { reaction: NostrEvent }) => {
  const ref = useRef<HTMLDivElement | null>(null);
  useRegisterIntersectionEntity(ref, reaction.id);

  const pointer = nip25.getReactedEventPointer(reaction);
  if (!pointer) return null;

  const decoded = { type: "nevent", data: pointer } as const;

  return (
    <Box ref={ref}>
      <Flex gap="2" mb="2">
        <UserAvatar pubkey={reaction.pubkey} size="xs" />
        <Text>
          <UserLink pubkey={reaction.pubkey} /> {reaction.content === "+" ? "liked " : "reacted with "}
          {embedEmoji([reaction.content], reaction)}
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

  const timeline = useTimelineLoader(`${pubkey}-likes`, readRelays, { authors: [pubkey], kinds: [7] });

  const reactions = useSubject(timeline.timeline);
  const callback = useTimelineCurserIntersectionCallback(timeline);

  return (
    <IntersectionObserverProvider callback={callback}>
      <TrustProvider trust>
        <VerticalPageLayout>
          {reactions.map((event) => (
            <Reaction reaction={event} />
          ))}

          <TimelineActionAndStatus timeline={timeline} />
        </VerticalPageLayout>
      </TrustProvider>
    </IntersectionObserverProvider>
  );
}
