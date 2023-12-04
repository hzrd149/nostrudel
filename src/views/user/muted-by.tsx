import { memo, useMemo, useRef } from "react";
import { Flex, Heading, Link, SimpleGrid } from "@chakra-ui/react";
import { Link as RouterLink, useOutletContext } from "react-router-dom";

import UserAvatarLink from "../../components/user-avatar-link";
import UserLink from "../../components/user-link";
import useTimelineLoader from "../../hooks/use-timeline-loader";
import { useReadRelayUrls } from "../../hooks/use-client-relays";
import { MUTE_LIST_KIND, PEOPLE_LIST_KIND, getListName, getPubkeysFromList } from "../../helpers/nostr/lists";
import useSubject from "../../hooks/use-subject";
import IntersectionObserverProvider, { useRegisterIntersectionEntity } from "../../providers/intersection-observer";
import { useTimelineCurserIntersectionCallback } from "../../hooks/use-timeline-cursor-intersection-callback";
import { getEventUID } from "../../helpers/nostr/events";
import VerticalPageLayout from "../../components/vertical-page-layout";
import { NostrEvent } from "../../types/nostr-event";
import SuperMap from "../../classes/super-map";
import { createListLink } from "../lists/components/list-card";

function ListLink({ list }: { list: NostrEvent }) {
  const ref = useRef<HTMLAnchorElement | null>(null);
  useRegisterIntersectionEntity(ref, getEventUID(list));

  return (
    <Link as={RouterLink} ref={ref} color="blue.500" to={createListLink(list)}>
      {getListName(list)} ({getPubkeysFromList(list).length})
    </Link>
  );
}
const User = memo(({ pubkey, lists }: { pubkey: string; lists: NostrEvent[] }) => {
  return (
    <Flex gap="2" overflow="hidden">
      <UserAvatarLink pubkey={pubkey} noProxy size="sm" />
      <Flex direction="column">
        <UserLink pubkey={pubkey} isTruncated fontWeight="bold" />
        {lists.map((list) => (
          <ListLink key={list.id} list={list} />
        ))}
      </Flex>
    </Flex>
  );
});

export default function UserMutedByTab() {
  const { pubkey } = useOutletContext() as { pubkey: string };

  const readRelays = useReadRelayUrls();
  const timeline = useTimelineLoader(`${pubkey}-muted-by`, readRelays, [
    { kinds: [MUTE_LIST_KIND], "#p": [pubkey] },
    { kinds: [PEOPLE_LIST_KIND], "#d": ["mute"], "#p": [pubkey] },
  ]);

  const lists = useSubject(timeline.timeline);

  const pubkeys = useMemo(() => {
    const dir = new SuperMap<string, NostrEvent[]>(() => []);
    for (const list of lists) {
      dir.get(list.pubkey).push(list);
    }
    return Array.from(dir).map((a) => ({ pubkey: a[0], lists: a[1] }));
  }, [lists]);

  const callback = useTimelineCurserIntersectionCallback(timeline);

  return (
    <IntersectionObserverProvider callback={callback}>
      <VerticalPageLayout>
        <SimpleGrid spacing="2" columns={{ base: 1, sm: 2, lg: 3, xl: 4 }}>
          {pubkeys.map(({ pubkey, lists }) => (
            <User key={pubkey} pubkey={pubkey} lists={lists} />
          ))}
        </SimpleGrid>
        {pubkeys.length === 0 && (
          <Heading size="sm" mx="auto">
            Looks like no one has muted this user yet
          </Heading>
        )}
      </VerticalPageLayout>
    </IntersectionObserverProvider>
  );
}
