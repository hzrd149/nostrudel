import { Box, Flex, Select, Text } from "@chakra-ui/react";
import dayjs from "dayjs";
import { ReactNode, useCallback, useMemo, useRef, useState } from "react";
import { useOutletContext } from "react-router-dom";

import { ErrorBoundary, ErrorFallback } from "../../components/error-boundary";
import { LightningIcon } from "../../components/icons";
import { NoteLink } from "../../components/note-link";
import { UserAvatarLink } from "../../components/user-avatar-link";
import { UserLink } from "../../components/user-link";
import { readablizeSats } from "../../helpers/bolt11";
import { isProfileZap, isNoteZap, parseZapEvent, totalZaps } from "../../helpers/nostr/zaps";
import useTimelineLoader from "../../hooks/use-timeline-loader";
import { NostrEvent, isATag, isETag, isPTag } from "../../types/nostr-event";
import { useAdditionalRelayContext } from "../../providers/additional-relay-context";
import { useReadRelayUrls } from "../../hooks/use-client-relays";
import TimelineActionAndStatus from "../../components/timeline-page/timeline-action-and-status";
import useSubject from "../../hooks/use-subject";
import IntersectionObserverProvider, { useRegisterIntersectionEntity } from "../../providers/intersection-observer";
import { useTimelineCurserIntersectionCallback } from "../../hooks/use-timeline-cursor-intersection-callback";
import { EmbedableContent, embedUrls } from "../../helpers/embeds";
import { embedNostrLinks, renderGenericUrl } from "../../components/embed-types";
import Timestamp from "../../components/timestamp";
import { EmbedEventNostrLink, EmbedEventPointer } from "../../components/embed-event";
import { parseCoordinate } from "../../helpers/nostr/events";
import VerticalPageLayout from "../../components/vertical-page-layout";

const Zap = ({ zapEvent }: { zapEvent: NostrEvent }) => {
  const ref = useRef<HTMLDivElement | null>(null);
  useRegisterIntersectionEntity(ref, zapEvent.id);

  const { request, payment } = parseZapEvent(zapEvent);

  const eventId = request.tags.find(isETag)?.[1];
  const coordinate = request.tags.find(isATag)?.[1];
  const parsedCoordinate = coordinate ? parseCoordinate(coordinate) : null;

  let eventJSX: ReactNode | null = null;
  if (parsedCoordinate && parsedCoordinate.identifier) {
    eventJSX = (
      <EmbedEventPointer
        pointer={{
          type: "naddr",
          data: {
            pubkey: parsedCoordinate.pubkey,
            identifier: parsedCoordinate.identifier,
            kind: parsedCoordinate.kind,
          },
        }}
      />
    );
  } else if (eventId) {
    eventJSX = <EmbedEventPointer pointer={{ type: "note", data: eventId }} />;
  }

  let embedContent: EmbedableContent = [request.content];
  embedContent = embedNostrLinks(embedContent);
  embedContent = embedUrls(embedContent, [renderGenericUrl]);

  return (
    <Box ref={ref}>
      <Flex gap="2" alignItems="center" wrap="wrap" mb="2">
        <UserAvatarLink pubkey={request.pubkey} size="sm" />
        <UserLink pubkey={request.pubkey} fontWeight="bold" />
        <Text>Zapped</Text>
        {payment.amount && (
          <Flex gap="2">
            <LightningIcon color="yellow.400" />
            <Text>{readablizeSats(payment.amount / 1000)} sats</Text>
          </Flex>
        )}
        <Timestamp ml="auto" timestamp={request.created_at} />
      </Flex>
      {embedContent && <Box>{embedContent}</Box>}
      {eventJSX}
    </Box>
  );
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
      <VerticalPageLayout>
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
      </VerticalPageLayout>
    </IntersectionObserverProvider>
  );
};

export default UserZapsTab;
