import { Card, Flex, LinkBox, SimpleGrid } from "@chakra-ui/react";
import { kinds, NostrEvent } from "nostr-tools";
import { useMemo } from "react";

import HoverLinkOverlay from "../../../../components/hover-link-overlay";
import ScrollLayout from "../../../../components/layout/presets/scroll-layout";
import TimelineActionAndStatus from "../../../../components/timeline/timeline-action-and-status";
import UserAvatarLink from "../../../../components/user/user-avatar-link";
import UserDnsIdentity from "../../../../components/user/user-dns-identity";
import UserLink from "../../../../components/user/user-link";
import { getEventUID } from "../../../../helpers/nostr/event";
import { getRelaysFromList } from "../../../../helpers/nostr/lists";
import { getRelayVariations } from "../../../../helpers/relay";
import useEventIntersectionRef from "../../../../hooks/use-event-intersection-ref";
import { useTimelineCurserIntersectionCallback } from "../../../../hooks/use-timeline-cursor-intersection-callback";
import useTimelineLoader from "../../../../hooks/use-timeline-loader";
import IntersectionObserverProvider from "../../../../providers/local/intersection-observer";
import { usePeopleListContext } from "../../../../providers/local/people-list-provider";
import useRelayUrlParam from "../use-relay-url-param";

function UserCard({ list, pubkey }: { list: NostrEvent; pubkey: string }) {
  const ref = useEventIntersectionRef(list);

  return (
    <Card as={LinkBox} p="2" variant="outline" flexDirection="row" display="flex" gap="2" overflow="hidden" ref={ref}>
      <UserAvatarLink pubkey={pubkey} />
      <Flex direction="column" overflow="hidden">
        <HoverLinkOverlay as={UserLink} pubkey={pubkey} fontWeight="bold" isTruncated />
        <UserDnsIdentity pubkey={pubkey} />
      </Flex>
    </Card>
  );
}

export default function RelayUsersView() {
  const relay = useRelayUrlParam();

  const { filter } = usePeopleListContext();
  const { loader, timeline } = useTimelineLoader(
    `${relay}-users`,
    [relay],
    filter && { ...filter, kinds: [kinds.RelayList], "#r": getRelayVariations(relay) },
  );
  const callback = useTimelineCurserIntersectionCallback(loader);

  const lists = useMemo(() => {
    return timeline?.filter((e) => getRelaysFromList(e).includes(relay));
  }, [timeline, relay]);

  return (
    <ScrollLayout>
      <IntersectionObserverProvider callback={callback}>
        <SimpleGrid columns={[1, 1, 2, 3, 4]} spacing="2">
          {lists?.map((list) => (
            <UserCard key={getEventUID(list)} pubkey={list.pubkey} list={list} />
          ))}
        </SimpleGrid>
      </IntersectionObserverProvider>
      <TimelineActionAndStatus loader={loader} />
    </ScrollLayout>
  );
}
