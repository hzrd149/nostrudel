import { Box, Flex, Select, Text } from "@chakra-ui/react";
import dayjs from "dayjs";
import { useCallback, useMemo, useRef, useState } from "react";
import { useOutletContext } from "react-router-dom";

import { ErrorBoundary, ErrorFallback } from "../../components/error-boundary";
import { LightningIcon } from "../../components/icons";
import { NoteLink } from "../../components/note-link";
import { UserAvatarLink } from "../../components/user-avatar-link";
import { UserLink } from "../../components/user-link";
import { readablizeSats } from "../../helpers/bolt11";
import { isProfileZap, isNoteZap, parseZapEvent, totalZaps } from "../../helpers/zaps";
import useTimelineLoader from "../../hooks/use-timeline-loader";
import { NostrEvent } from "../../types/nostr-event";
import { useAdditionalRelayContext } from "../../providers/additional-relay-context";
import { useReadRelayUrls } from "../../hooks/use-client-relays";
import TimelineActionAndStatus from "../../components/timeline-page/timeline-action-and-status";
import useSubject from "../../hooks/use-subject";
import IntersectionObserverProvider, { useRegisterIntersectionEntity } from "../../providers/intersection-observer";
import { useTimelineCurserIntersectionCallback } from "../../hooks/use-timeline-cursor-intersection-callback";
import { EmbedableContent, embedUrls } from "../../helpers/embeds";
import { embedNostrLinks, renderGenericUrl } from "../../components/embed-types";
import Timestamp from "../../components/timestamp";

const Zap = ({ zapEvent }: { zapEvent: NostrEvent }) => {
  const ref = useRef<HTMLDivElement | null>(null);

  useRegisterIntersectionEntity(ref, zapEvent.id);

  try {
    const { request, payment, eventId } = parseZapEvent(zapEvent);

    let embedContent: EmbedableContent = [request.content];
    embedContent = embedNostrLinks(embedContent);
    embedContent = embedUrls(embedContent, [renderGenericUrl]);

    return (
      <Box
        borderWidth="1px"
        borderRadius="lg"
        overflow="hidden"
        padding="2"
        display="flex"
        gap="2"
        flexDirection="column"
        flexShrink={0}
        ref={ref}
      >
        <Flex gap="2" alignItems="center" wrap="wrap">
          <UserAvatarLink pubkey={request.pubkey} size="xs" />
          <UserLink pubkey={request.pubkey} />
          <Text>Zapped</Text>
          {eventId && <NoteLink noteId={eventId} />}
          {payment.amount && (
            <Flex gap="2">
              <LightningIcon color="yellow.400" />
              <Text>{readablizeSats(payment.amount / 1000)} sats</Text>
            </Flex>
          )}
          <Timestamp ml="auto" timestamp={request.created_at} />
        </Flex>
        {embedContent && <Box>{embedContent}</Box>}
      </Box>
    );
  } catch (e) {
    if (e instanceof Error) {
      console.log(e);

      return <ErrorFallback error={e} resetErrorBoundary={() => {}} />;
    }
    return null;
  }
};

const UserZapsTab = () => {
  const { pubkey } = useOutletContext() as { pubkey: string };
  const [filter, setFilter] = useState("both");
  const contextRelays = useAdditionalRelayContext();
  const relays = useReadRelayUrls(contextRelays);

  const eventFilter = useCallback(
    (event: NostrEvent) => {
      switch (filter) {
        case "note":
          return isNoteZap(event);
        case "profile":
          return isProfileZap(event);
      }
      return true;
    },
    [filter],
  );

  const timeline = useTimelineLoader(`${pubkey}-zaps`, relays, { "#p": [pubkey], kinds: [9735] }, { eventFilter });

  const events = useSubject(timeline.timeline);
  const zaps = useMemo(() => {
    const parsed = [];
    for (const zap of events) {
      try {
        parsed.push(parseZapEvent(zap));
      } catch (e) {}
    }
    return parsed;
  }, [events]);

  const callback = useTimelineCurserIntersectionCallback(timeline);

  return (
    <IntersectionObserverProvider callback={callback}>
      <Flex direction="column" gap="2" p="2" pb="8">
        <Flex gap="2" alignItems="center" wrap="wrap">
          <Select value={filter} onChange={(e) => setFilter(e.target.value)} maxW="md">
            <option value="both">Note & Profile Zaps</option>
            <option value="note">Note Zaps</option>
            <option value="profile">Profile Zaps</option>
          </Select>
          {events.length && (
            <Flex gap="2">
              <LightningIcon color="yellow.400" />
              <Text>
                {readablizeSats(totalZaps(zaps) / 1000)} sats in the last{" "}
                {dayjs.unix(events[events.length - 1].created_at).fromNow(true)}
              </Text>
            </Flex>
          )}
        </Flex>
        {events.map((event) => (
          <ErrorBoundary key={event.id}>
            <Zap zapEvent={event} />
          </ErrorBoundary>
        ))}

        <TimelineActionAndStatus timeline={timeline} />
      </Flex>
    </IntersectionObserverProvider>
  );
};

export default UserZapsTab;
