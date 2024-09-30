import { ReactNode, useCallback, useMemo, useState } from "react";
import { Box, Flex, Select, Text } from "@chakra-ui/react";
import dayjs from "dayjs";
import { useOutletContext } from "react-router-dom";

import { ErrorBoundary } from "../../components/error-boundary";
import { LightningIcon } from "../../components/icons";
import UserAvatarLink from "../../components/user/user-avatar-link";
import UserLink from "../../components/user/user-link";
import { readablizeSats } from "../../helpers/bolt11";
import { isProfileZap, isNoteZap, totalZaps, parseZapEvents, getParsedZap } from "../../helpers/nostr/zaps";
import useTimelineLoader from "../../hooks/use-timeline-loader";
import { NostrEvent, isATag, isETag } from "../../types/nostr-event";
import { useAdditionalRelayContext } from "../../providers/local/additional-relay-context";
import { useReadRelays } from "../../hooks/use-client-relays";
import TimelineActionAndStatus from "../../components/timeline/timeline-action-and-status";
import useSubject from "../../hooks/use-subject";
import IntersectionObserverProvider from "../../providers/local/intersection-observer";
import { useTimelineCurserIntersectionCallback } from "../../hooks/use-timeline-cursor-intersection-callback";
import { EmbedableContent, embedUrls } from "../../helpers/embeds";
import { embedNostrLinks, renderGenericUrl } from "../../components/external-embeds";
import Timestamp from "../../components/timestamp";
import { EmbedEventPointer } from "../../components/embed-event";
import { parseCoordinate } from "../../helpers/nostr/event";
import VerticalPageLayout from "../../components/vertical-page-layout";
import useEventIntersectionRef from "../../hooks/use-event-intersection-ref";

const Zap = ({ zapEvent }: { zapEvent: NostrEvent }) => {
  const ref = useEventIntersectionRef(zapEvent);

  const { request, payment } = getParsedZap(zapEvent, false);

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
  const relays = useReadRelays(contextRelays);

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
  const zaps = useMemo(() => parseZapEvents(events), [events]);

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
          <ErrorBoundary key={event.id} event={event}>
            <Zap zapEvent={event} />
          </ErrorBoundary>
        ))}

        <TimelineActionAndStatus timeline={timeline} />
      </VerticalPageLayout>
    </IntersectionObserverProvider>
  );
};

export default UserZapsTab;
