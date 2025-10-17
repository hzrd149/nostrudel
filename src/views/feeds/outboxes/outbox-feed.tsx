import { Flex, Text } from "@chakra-ui/react";
import { useActiveAccount } from "applesauce-react/hooks";
import { kinds, NostrEvent } from "nostr-tools";
import { Navigate, useParams } from "react-router-dom";

import { includeMailboxes, withImmediateValueOrDefault } from "applesauce-core";
import { getSeenRelays, normalizeURL } from "applesauce-core/helpers";
import { useObservableEagerMemo } from "applesauce-react/hooks";
import { useCallback } from "react";
import { map } from "rxjs";
import SimpleView from "../../../components/layout/presets/simple-view";
import RelayFavicon from "../../../components/relay/relay-favicon";
import RelayLink from "../../../components/relay/relay-link";
import GenericNoteTimeline, { GENERIC_TIMELINE_KINDS } from "../../../components/timeline-page/generic-note-timeline";
import TimelineActionAndStatus from "../../../components/timeline/timeline-action-and-status";
import { useAppTitle } from "../../../hooks/use-app-title";
import useClientSideMuteFilter from "../../../hooks/use-client-side-mute-filter";
import { useTimelineCurserIntersectionCallback } from "../../../hooks/use-timeline-cursor-intersection-callback";
import useTimelineLoader from "../../../hooks/use-timeline-loader";
import IntersectionObserverProvider from "../../../providers/local/intersection-observer";
import { eventStore } from "../../../services/event-store";
import { RelayAuthAlert } from "../relays/relay-feed";
import UserAvatar from "../../../components/user/user-avatar";

export function OutboxFeedPage({ relay }: { relay: string }) {
  relay = normalizeURL(relay);
  const account = useActiveAccount();

  // Get the contacts who publish to this relay
  const contacts = useObservableEagerMemo(
    () =>
      account &&
      eventStore.contacts({ pubkey: account.pubkey }).pipe(
        // Include the users outboxes
        includeMailboxes(eventStore, "outbox"),
        // Only get users who publish to this relay
        map((users) => users && users.filter((user) => user.relays?.includes(relay))),
        // Fix for React
        withImmediateValueOrDefault(undefined),
      ),
    [account?.pubkey],
  );

  const muteFilter = useClientSideMuteFilter();
  const eventFilter = useCallback(
    (event: NostrEvent) => {
      if (!getSeenRelays(event)?.has(relay)) return false;
      if (muteFilter(event)) return false;
      return true;
    },
    [relay, muteFilter],
  );

  const { loader, timeline } = useTimelineLoader(
    `outbox-feed-${relay}`,
    [relay],
    contacts
      ? {
          kinds: GENERIC_TIMELINE_KINDS,
          authors: contacts.map((user) => user.pubkey),
        }
      : undefined,
    { eventFilter },
  );

  const callback = useTimelineCurserIntersectionCallback(loader);

  return (
    <SimpleView
      title={
        <Flex gap="2" alignItems="center">
          <RelayFavicon relay={relay} size="sm" />
          <RelayLink relay={relay} fontWeight="bold" isTruncated />

          {contacts && (
            <Flex gap={1} ms="4">
              {contacts.slice(0, 10).map((user) => (
                <UserAvatar key={user.pubkey} pubkey={user.pubkey} size="xs" showNip05={false} />
              ))}
              {contacts.length > 10 && (
                <Text fontSize="xs" color="GrayText" alignSelf="center">
                  +{contacts?.length - 10} more
                </Text>
              )}
            </Flex>
          )}
        </Flex>
      }
      center
      maxW="container.xl"
    >
      <RelayAuthAlert relay={relay} />

      <IntersectionObserverProvider callback={callback}>
        {timeline && <GenericNoteTimeline timeline={timeline} />}
        <TimelineActionAndStatus loader={loader} />
      </IntersectionObserverProvider>
    </SimpleView>
  );
}

export default function OutboxFeedView() {
  const { relay } = useParams();
  useAppTitle(`${relay} - Outbox Feed`);

  if (!relay) return <Navigate to="/feeds/outboxes" />;

  return <OutboxFeedPage relay={relay} />;
}
