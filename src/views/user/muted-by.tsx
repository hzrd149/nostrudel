import { memo, useMemo, useRef } from "react";
import { Flex, Heading, SimpleGrid } from "@chakra-ui/react";

import { UserAvatarLink } from "../../components/user-avatar-link";
import { UserLink } from "../../components/user-link";
import useTimelineLoader from "../../hooks/use-timeline-loader";
import { useReadRelayUrls } from "../../hooks/use-client-relays";
import { MUTE_LIST_KIND, PEOPLE_LIST_KIND } from "../../helpers/nostr/lists";
import useSubject from "../../hooks/use-subject";
import IntersectionObserverProvider, { useRegisterIntersectionEntity } from "../../providers/intersection-observer";
import { useTimelineCurserIntersectionCallback } from "../../hooks/use-timeline-cursor-intersection-callback";
import { getEventUID } from "../../helpers/nostr/events";
import { useNavigate, useOutletContext } from "react-router-dom";

const User = memo(({ pubkey, listId }: { pubkey: string; listId: string }) => {
  const ref = useRef<HTMLDivElement | null>(null);
  useRegisterIntersectionEntity(ref, listId);

  return (
    <Flex gap="2" overflow="hidden" ref={ref}>
      <UserAvatarLink pubkey={pubkey} noProxy size="sm" />
      <UserLink pubkey={pubkey} isTruncated />
    </Flex>
  );
});

export default function UserMutedByTab() {
  const navigate = useNavigate();
  const { pubkey } = useOutletContext() as { pubkey: string };

  const readRelays = useReadRelayUrls();
  const timeline = useTimelineLoader(`${pubkey}-muted-by`, readRelays, [
    { kinds: [MUTE_LIST_KIND], "#p": [pubkey] },
    { kinds: [PEOPLE_LIST_KIND], "#d": ["mute"], "#p": [pubkey] },
  ]);

  const lists = useSubject(timeline.timeline);

  const pubkeys = useMemo(() => {
    const keys = new Map<string, string>();
    for (const list of lists) {
      keys.set(list.pubkey, getEventUID(list));
    }
    return Array.from(keys).map((a) => ({ pubkey: a[0], listId: a[1] }));
  }, [lists]);

  const callback = useTimelineCurserIntersectionCallback(timeline);

  return (
    <IntersectionObserverProvider callback={callback}>
      <Flex gap="2" direction="column" p="2">
        <SimpleGrid spacing="2" columns={{ base: 1, md: 2, lg: 3, xl: 4 }}>
          {pubkeys.map(({ pubkey, listId }) => (
            <User key={pubkey} pubkey={pubkey} listId={listId} />
          ))}
        </SimpleGrid>
        {pubkeys.length === 0 && (
          <Heading size="sm" mx="auto">
            Looks like no one has muted this user yet
          </Heading>
        )}
      </Flex>
    </IntersectionObserverProvider>
  );
}
