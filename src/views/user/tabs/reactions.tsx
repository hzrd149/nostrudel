import { Box, Flex, Spacer, Text } from "@chakra-ui/react";
import { nip25, NostrEvent } from "nostr-tools";

import { EmbedEventPointerCard } from "../../../components/embed-event/card";
import ScrollLayout from "../../../components/layout/presets/scroll-layout";
import NoteMenu from "../../../components/note/note-menu";
import LoadMoreButton from "../../../components/timeline/load-more-button";
import UserAvatar from "../../../components/user/user-avatar";
import UserLink from "../../../components/user/user-link";
import useEventIntersectionRef from "../../../hooks/use-event-intersection-ref";
import useParamsProfilePointer from "../../../hooks/use-params-pubkey-pointer";
import { useTimelineCurserIntersectionCallback } from "../../../hooks/use-timeline-cursor-intersection-callback";
import useTimelineLoader from "../../../hooks/use-timeline-loader";
import { useUserOutbox } from "../../../hooks/use-user-mailboxes";
import { ContentSettingsProvider } from "../../../providers/local/content-settings";
import IntersectionObserverProvider from "../../../providers/local/intersection-observer";

const Reaction = ({ reaction: reaction }: { reaction: NostrEvent }) => {
  const ref = useEventIntersectionRef(reaction);

  const pointer = nip25.getReactedEventPointer(reaction);
  if (!pointer) return null;

  const decoded = { type: "nevent", data: pointer } as const;

  return (
    <Box ref={ref}>
      <Flex gap="2" mb="2">
        <UserAvatar pubkey={reaction.pubkey} size="xs" />
        <Text>
          <UserLink pubkey={reaction.pubkey} /> {reaction.content === "+" ? "liked " : "reacted with "}
          {reaction.content}
        </Text>
        <Spacer />
        <NoteMenu event={reaction} aria-label="Note menu" variant="ghost" size="xs" />
      </Flex>
      <EmbedEventPointerCard pointer={decoded} />
    </Box>
  );
};

export default function UserReactionsTab() {
  const user = useParamsProfilePointer("pubkey");
  const relays = useUserOutbox(user) || [];

  const { loader, timeline: reactions } = useTimelineLoader(`${user.pubkey}-reactions`, relays, {
    authors: [user.pubkey],
    kinds: [7],
  });
  const callback = useTimelineCurserIntersectionCallback(loader);

  return (
    <ScrollLayout maxW="6xl" center>
      <IntersectionObserverProvider callback={callback}>
        <ContentSettingsProvider blurMedia={false}>
          {reactions?.map((event) => (
            <Reaction key={event.id} reaction={event} />
          ))}

          <LoadMoreButton loader={loader} />
        </ContentSettingsProvider>
      </IntersectionObserverProvider>
    </ScrollLayout>
  );
}
