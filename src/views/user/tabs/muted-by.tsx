import { Flex, Heading, Link, SimpleGrid } from "@chakra-ui/react";
import { kinds, NostrEvent } from "nostr-tools";
import { memo, useMemo } from "react";
import { Link as RouterLink } from "react-router-dom";

import SuperMap from "../../../classes/super-map";
import ScrollLayout from "../../../components/layout/presets/scroll-layout";
import UserAvatarLink from "../../../components/user/user-avatar-link";
import UserLink from "../../../components/user/user-link";
import { getListTitle, getPubkeysFromList } from "../../../helpers/nostr/lists";
import { useReadRelays } from "../../../hooks/use-client-relays";
import useEventIntersectionRef from "../../../hooks/use-event-intersection-ref";
import useParamsProfilePointer from "../../../hooks/use-params-pubkey-pointer";
import { useTimelineCurserIntersectionCallback } from "../../../hooks/use-timeline-cursor-intersection-callback";
import useTimelineLoader from "../../../hooks/use-timeline-loader";
import IntersectionObserverProvider from "../../../providers/local/intersection-observer";
import { createListLink } from "../../lists/components/fallback-list-card";

function ListLink({ list }: { list: NostrEvent }) {
  const ref = useEventIntersectionRef<HTMLAnchorElement>(list);

  return (
    <Link as={RouterLink} ref={ref} color="blue.500" to={createListLink(list)}>
      {getListTitle(list)} ({getPubkeysFromList(list).length})
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
  const user = useParamsProfilePointer("pubkey");
  const readRelays = useReadRelays();

  const { loader, timeline: lists } = useTimelineLoader(`${user.pubkey}-muted-by`, readRelays, [
    { kinds: [kinds.Mutelist], "#p": [user.pubkey] },
    { kinds: [kinds.Followsets], "#d": ["mute"], "#p": [user.pubkey] },
  ]);

  const pubkeys = useMemo(() => {
    const dir = new SuperMap<string, NostrEvent[]>(() => []);
    for (const list of lists) {
      dir.get(list.pubkey).push(list);
    }
    return Array.from(dir).map((a) => ({ pubkey: a[0], lists: a[1] }));
  }, [lists]);

  const callback = useTimelineCurserIntersectionCallback(loader);

  return (
    <ScrollLayout>
      <IntersectionObserverProvider callback={callback}>
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
      </IntersectionObserverProvider>
    </ScrollLayout>
  );
}
