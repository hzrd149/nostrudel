import { Box, Flex, Select, Text } from "@chakra-ui/react";
import { Zap } from "applesauce-common/casts";
import { isValidZap } from "applesauce-common/helpers";
import { useRenderedContent } from "applesauce-react/hooks";
import dayjs from "dayjs";
import { NostrEvent } from "nostr-tools";
import { ReactNode, useCallback, useState } from "react";

import { components } from "../../../components/content";
import { renderGenericUrl } from "../../../components/content/links/common";
import { EmbedEventPointerCard } from "../../../components/embed-event/card";
import { ErrorBoundary } from "../../../components/error-boundary";
import { LightningIcon } from "../../../components/icons";
import ScrollLayout from "../../../components/layout/presets/scroll-layout";
import LoadMoreButton from "../../../components/timeline/load-more-button";
import Timestamp from "../../../components/timestamp";
import UserAvatarLink from "../../../components/user/user-avatar-link";
import UserLink from "../../../components/user/user-link";
import ValueDisplay from "../../../components/value-display";
import { isNoteZap, isProfileZap } from "../../../helpers/nostr/zaps";
import useCastTimeline from "../../../hooks/use-cast-timeline";
import useEventIntersectionRef from "../../../hooks/use-event-intersection-ref";
import useParamsProfilePointer from "../../../hooks/use-params-pubkey-pointer";
import { useTimelineCurserIntersectionCallback } from "../../../hooks/use-timeline-cursor-intersection-callback";
import useTimelineLoader from "../../../hooks/use-timeline-loader";
import { useUserOutbox } from "../../../hooks/use-user-mailboxes";
import IntersectionObserverProvider from "../../../providers/local/intersection-observer";

const ZapContentSymbol = Symbol.for("zap-content");
const linkRenderers = [renderGenericUrl];

function ZapItem({ zap }: { zap: Zap }) {
  const ref = useEventIntersectionRef(zap.event);

  const request = zap.request;

  let eventJSX: ReactNode | null = null;
  if (zap.addressPointer?.identifier) {
    eventJSX = <EmbedEventPointerCard pointer={{ type: "naddr", data: zap.addressPointer }} />;
  } else if (zap.eventPointer) {
    eventJSX = <EmbedEventPointerCard pointer={{ type: "nevent", data: zap.eventPointer }} />;
  }

  const content = useRenderedContent(request, components, { linkRenderers, cacheKey: ZapContentSymbol });

  return (
    <Box ref={ref}>
      <Flex gap="2" alignItems="center" wrap="wrap" mb="2">
        <UserAvatarLink pubkey={zap.sender.pubkey} size="sm" />
        <UserLink pubkey={zap.sender.pubkey} fontWeight="bold" />
        <Text>Zapped</Text>
        {zap.amount && (
          <Flex gap="2">
            <LightningIcon color="yellow.400" />
            <ValueDisplay sats={zap.amount / 1000} />
          </Flex>
        )}
        <Timestamp ml="auto" timestamp={request.created_at} />
      </Flex>
      {content && <Box whiteSpace="pre">{content}</Box>}
      {eventJSX}
    </Box>
  );
}

export default function UserZapsTab() {
  const user = useParamsProfilePointer("pubkey");
  const relays = useUserOutbox(user) || [];
  const [filter, setFilter] = useState("both");

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

  const { loader, timeline } = useTimelineLoader(
    `${user.pubkey}-zaps`,
    relays,
    { "#p": [user.pubkey], kinds: [9735] },
    { eventFilter },
  );

  const zaps = useCastTimeline(timeline.filter(isValidZap), Zap);
  const total = zaps.reduce((t, zap) => t + (zap.amount ?? 0), 0);

  const callback = useTimelineCurserIntersectionCallback(loader);

  return (
    <ScrollLayout maxW="6xl" center>
      <IntersectionObserverProvider callback={callback}>
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
                <ValueDisplay sats={total / 1000} /> in the last{" "}
                {dayjs.unix(zaps[zaps.length - 1].event.created_at).fromNow(true)}
              </Text>
            </Flex>
          )}
        </Flex>
        {zaps.map((zap) => (
          <ErrorBoundary key={zap.id} event={zap.event}>
            <ZapItem zap={zap} />
          </ErrorBoundary>
        ))}

        <LoadMoreButton loader={loader} />
      </IntersectionObserverProvider>
    </ScrollLayout>
  );
}
