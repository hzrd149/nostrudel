import { Box, Flex, Select, Text } from "@chakra-ui/react";
import { getZapPayment, getZapRequest, isATag, isETag } from "applesauce-core/helpers";
import { useRenderedContent } from "applesauce-react/hooks";
import dayjs from "dayjs";
import { NostrEvent } from "nostr-tools";
import { ReactNode, useCallback, useState } from "react";
import { useOutletContext } from "react-router-dom";

import { components } from "../../components/content";
import { renderGenericUrl } from "../../components/content/links/common";
import { EmbedEventPointerCard } from "../../components/embed-event/card";
import { ErrorBoundary } from "../../components/error-boundary";
import { LightningIcon } from "../../components/icons";
import TimelineActionAndStatus from "../../components/timeline/timeline-action-and-status";
import Timestamp from "../../components/timestamp";
import UserAvatarLink from "../../components/user/user-avatar-link";
import UserLink from "../../components/user/user-link";
import VerticalPageLayout from "../../components/vertical-page-layout";
import { humanReadableSats } from "../../helpers/lightning";
import { parseCoordinate } from "../../helpers/nostr/event";
import { isNoteZap, isProfileZap, totalZaps } from "../../helpers/nostr/zaps";
import { useReadRelays } from "../../hooks/use-client-relays";
import useEventIntersectionRef from "../../hooks/use-event-intersection-ref";
import { useTimelineCurserIntersectionCallback } from "../../hooks/use-timeline-cursor-intersection-callback";
import useTimelineLoader from "../../hooks/use-timeline-loader";
import { useAdditionalRelayContext } from "../../providers/local/additional-relay";
import IntersectionObserverProvider from "../../providers/local/intersection-observer";

const ZapContentSymbol = Symbol.for("zap-content");
const linkRenderers = [renderGenericUrl];

const Zap = ({ zap }: { zap: NostrEvent }) => {
  const ref = useEventIntersectionRef(zap);

  const request = getZapRequest(zap);
  const payment = getZapPayment(zap);

  const eventId = request.tags.find(isETag)?.[1];
  const coordinate = request.tags.find(isATag)?.[1];
  const parsedCoordinate = coordinate ? parseCoordinate(coordinate) : null;

  let eventJSX: ReactNode | null = null;
  if (parsedCoordinate && parsedCoordinate.identifier) {
    eventJSX = (
      <EmbedEventPointerCard
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
    eventJSX = <EmbedEventPointerCard pointer={{ type: "note", data: eventId }} />;
  }

  const content = useRenderedContent(request, components, { linkRenderers, cacheKey: ZapContentSymbol });

  return (
    <Box ref={ref}>
      <Flex gap="2" alignItems="center" wrap="wrap" mb="2">
        <UserAvatarLink pubkey={request.pubkey} size="sm" />
        <UserLink pubkey={request.pubkey} fontWeight="bold" />
        <Text>Zapped</Text>
        {payment?.amount && (
          <Flex gap="2">
            <LightningIcon color="yellow.400" />
            <Text>{humanReadableSats(payment.amount / 1000)} sats</Text>
          </Flex>
        )}
        <Timestamp ml="auto" timestamp={request.created_at} />
      </Flex>
      {content && <Box whiteSpace="pre">{content}</Box>}
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

  const { loader, timeline: zaps } = useTimelineLoader(
    `${pubkey}-zaps`,
    relays,
    { "#p": [pubkey], kinds: [9735] },
    { eventFilter },
  );

  const callback = useTimelineCurserIntersectionCallback(loader);

  return (
    <IntersectionObserverProvider callback={callback}>
      <VerticalPageLayout maxW="4xl" mx="auto">
        <Flex gap="2" alignItems="center" wrap="wrap">
          <Select value={filter} onChange={(e) => setFilter(e.target.value)} maxW="md">
            <option value="both">Note & Profile Zaps</option>
            <option value="note">Note Zaps</option>
            <option value="profile">Profile Zaps</option>
          </Select>
          {zaps.length && (
            <Flex gap="2">
              <LightningIcon color="yellow.400" />
              <Text>
                {humanReadableSats(totalZaps(zaps) / 1000)} sats in the last{" "}
                {dayjs.unix(zaps[zaps.length - 1].created_at).fromNow(true)}
              </Text>
            </Flex>
          )}
        </Flex>
        {zaps.map((zaps) => (
          <ErrorBoundary key={zaps.id} event={zaps}>
            <Zap zap={zaps} />
          </ErrorBoundary>
        ))}

        <TimelineActionAndStatus loader={loader} />
      </VerticalPageLayout>
    </IntersectionObserverProvider>
  );
};

export default UserZapsTab;
