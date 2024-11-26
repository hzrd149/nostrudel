import { Flex, Text } from "@chakra-ui/react";
import { kinds } from "nostr-tools";
import { useOutletContext } from "react-router-dom";

import useTimelineLoader from "../../hooks/use-timeline-loader";
import { useAdditionalRelayContext } from "../../providers/local/additional-relay-context";
import { useTimelineCurserIntersectionCallback } from "../../hooks/use-timeline-cursor-intersection-callback";
import IntersectionObserverProvider from "../../providers/local/intersection-observer";
import VerticalPageLayout from "../../components/vertical-page-layout";
import TimelineActionAndStatus from "../../components/timeline/timeline-action-and-status";
import { NostrEvent, isPTag } from "../../types/nostr-event";
import UserAvatarLink from "../../components/user/user-avatar-link";
import UserLink from "../../components/user/user-link";
import ArrowRight from "../../components/icons/arrow-right";
import { AtIcon } from "../../components/icons";
import Timestamp from "../../components/timestamp";
import ArrowLeft from "../../components/icons/arrow-left";
import useEventIntersectionRef from "../../hooks/use-event-intersection-ref";

function DirectMessage({ dm, pubkey }: { dm: NostrEvent; pubkey: string }) {
  const sender = dm.pubkey;
  const receiver = dm.tags.find(isPTag)?.[1];

  const ref = useEventIntersectionRef(dm);

  if (sender === pubkey) {
    if (!receiver) return null;
    return (
      <Flex gap="2" alignItems="center" ref={ref}>
        <ArrowRight boxSize={6} />
        <Timestamp timestamp={dm.created_at} />
        <Text>Sent: </Text>
        <UserAvatarLink pubkey={receiver} size="sm" />
        <UserLink pubkey={receiver} fontWeight="bold" fontSize="lg" />
      </Flex>
    );
  } else if (receiver === pubkey) {
    return (
      <Flex gap="2" alignItems="center" ref={ref}>
        <ArrowLeft boxSize={6} />
        <Timestamp timestamp={dm.created_at} />
        <Text>Received: </Text>
        <UserAvatarLink pubkey={sender} size="sm" />
        <UserLink pubkey={sender} fontWeight="bold" fontSize="lg" />
      </Flex>
    );
  } else {
    return (
      <Flex gap="2" alignItems="center" ref={ref}>
        <AtIcon boxSize={6} />
        <Timestamp timestamp={dm.created_at} />
        <Text>Mentioned: </Text>
        <UserAvatarLink pubkey={pubkey} size="sm" />
        <UserLink pubkey={pubkey} fontWeight="bold" fontSize="lg" />
      </Flex>
    );
  }
}

export default function UserDMsTab() {
  const { pubkey } = useOutletContext() as { pubkey: string };
  const readRelays = useAdditionalRelayContext();

  const { loader, timeline: dms } = useTimelineLoader(pubkey + "-articles", readRelays, [
    {
      authors: [pubkey],
      kinds: [kinds.EncryptedDirectMessage],
    },
    { "#p": [pubkey], kinds: [kinds.EncryptedDirectMessage] },
  ]);
  const callback = useTimelineCurserIntersectionCallback(loader);

  return (
    <IntersectionObserverProvider callback={callback}>
      <VerticalPageLayout>
        {dms?.map((dm) => <DirectMessage key={dm.id} dm={dm} pubkey={pubkey} />)}
        <TimelineActionAndStatus timeline={loader} />
      </VerticalPageLayout>
    </IntersectionObserverProvider>
  );
}
