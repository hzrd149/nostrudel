import { useRef } from "react";
import { useOutletContext } from "react-router-dom";
import { Box, Flex, SkeletonText, Spacer, Text } from "@chakra-ui/react";
import { Kind } from "nostr-tools";
import { getReferences, truncatedId } from "../../helpers/nostr/event";
import useTimelineLoader from "../../hooks/use-timeline-loader";
import { NostrEvent } from "../../types/nostr-event";
import { useAdditionalRelayContext } from "../../providers/additional-relay-context";
import { useReadRelayUrls } from "../../hooks/use-client-relays";
import TimelineActionAndStatus from "../../components/timeline-page/timeline-action-and-status";
import useSubject from "../../hooks/use-subject";
import IntersectionObserverProvider, { useRegisterIntersectionEntity } from "../../providers/intersection-observer";
import { useTimelineCurserIntersectionCallback } from "../../hooks/use-timeline-cursor-intersection-callback";
import useSingleEvent from "../../hooks/use-single-event";
import { Note } from "../../components/note";
import { TrustProvider } from "../../providers/trust";
import { UserAvatar } from "../../components/user-avatar";
import { UserLink } from "../../components/user-link";
import { NoteMenu } from "../../components/note/note-menu";

const Like = ({ event }: { event: NostrEvent }) => {
  const ref = useRef<HTMLDivElement | null>(null);
  useRegisterIntersectionEntity(ref, event.id);

  const contextRelays = useAdditionalRelayContext();
  const readRelays = useReadRelayUrls(contextRelays);

  const refs = getReferences(event);
  const eventId: string | undefined = refs.events[0];
  const { event: note } = useSingleEvent(eventId, readRelays);

  var content = <></>;
  if (!note) return <SkeletonText />;

  if (note.kind === Kind.Text) {
    content = (
      <>
        <Flex gap="2" mb="2">
          <UserAvatar pubkey={event.pubkey} size="xs" />
          <Text>
            <UserLink pubkey={event.pubkey} /> {event.content === "+" ? "liked" : "reacted with " + event.content}
          </Text>
          <Spacer />
          <NoteMenu event={event} aria-label="Note menu" variant="ghost" size="xs" />
        </Flex>
        <Note key={note.id} event={note} />
      </>
    );
  } else content = <>Unknown note type {note.kind}</>;

  return <Box ref={ref}>{content}</Box>;
};

export default function UserLikesTab() {
  const { pubkey } = useOutletContext() as { pubkey: string };
  const contextRelays = useAdditionalRelayContext();
  const readRelays = useReadRelayUrls(contextRelays);

  const timeline = useTimelineLoader(`${truncatedId(pubkey)}-likes`, readRelays, { authors: [pubkey], kinds: [7] });

  const likes = useSubject(timeline.timeline);

  const callback = useTimelineCurserIntersectionCallback(timeline);

  return (
    <IntersectionObserverProvider callback={callback}>
      <TrustProvider trust>
        <Flex direction="column" gap="2" p="2" pb="8">
          {likes.map((event) => (
            <Like event={event} />
          ))}

          <TimelineActionAndStatus timeline={timeline} />
        </Flex>
      </TrustProvider>
    </IntersectionObserverProvider>
  );
}
