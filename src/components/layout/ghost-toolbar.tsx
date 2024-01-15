import { useCallback, useState } from "react";
import { Box, Card, CloseButton, Divider, Flex, FlexProps, Spacer, Text } from "@chakra-ui/react";
import { kinds, nip18, nip19, nip25 } from "nostr-tools";
import { useNavigate } from "react-router-dom";
import { useInterval } from "react-use";
import dayjs from "dayjs";

import useCurrentAccount from "../../hooks/use-current-account";
import useSubject from "../../hooks/use-subject";
import accountService from "../../services/account";
import UserAvatar from "../user-avatar";
import UserLink from "../user-link";
import { GhostIcon } from "../icons";
import useTimelineLoader from "../../hooks/use-timeline-loader";
import { useReadRelayUrls } from "../../hooks/use-client-relays";
import TimelineLoader from "../../classes/timeline-loader";
import { NostrEvent } from "../../types/nostr-event";
import { getSharableEventAddress } from "../../helpers/nip19";
import { safeRelayUrls } from "../../helpers/relay";

const kindColors: Record<number, FlexProps["bg"]> = {
  [kinds.ShortTextNote]: "blue.500",
  [kinds.RecommendRelay]: "pink",
  [kinds.EncryptedDirectMessage]: "orange.500",
  [kinds.Repost]: "yellow",
  [kinds.GenericRepost]: "yellow",
  [kinds.Reaction]: "green.500",
  [kinds.LongFormArticle]: "purple.500",
};

function EventChunk({ event, ...props }: { event: NostrEvent } & Omit<FlexProps, "children">) {
  const navigate = useNavigate();
  const handleClick = useCallback(() => {
    switch (event.kind) {
      case kinds.Reaction: {
        const pointer = nip25.getReactedEventPointer(event);
        if (pointer) navigate(`/l/${nip19.neventEncode(pointer)}`);
        return;
      }
      case kinds.Repost: {
        const pointer = nip18.getRepostedEventPointer(event);
        if (pointer?.relays) pointer.relays = safeRelayUrls(pointer.relays);
        if (pointer) navigate(`/l/${nip19.neventEncode(pointer)}`);
        return;
      }
    }
    navigate(`/l/${getSharableEventAddress(event)}`);
  }, [event]);

  const getTitle = () => {
    switch (event.kind) {
      case kinds.ShortTextNote:
        return "Note";
      case kinds.Reaction:
        return "Reaction";
      case kinds.EncryptedDirectMessage:
        return "Direct Message";
    }
  };

  return (
    <Flex alignItems="center" cursor="pointer" onClick={handleClick} title={getTitle()} overflow="hidden" {...props}>
      <Box bg={kindColors[event.kind] || "gray.500"} h="8" p="2" fontSize="sm">
        {getTitle()}
      </Box>
      <Divider />
    </Flex>
  );
}

function CompactEventTimeline({ timeline, ...props }: { timeline: TimelineLoader } & Omit<FlexProps, "children">) {
  const events = useSubject(timeline.timeline);
  const [now, setNow] = useState(dayjs().unix());

  useInterval(() => setNow(dayjs().unix()), 1000 * 10);

  return (
    <Flex {...props}>
      {Array.from(events)
        .reverse()
        .map((event, i, arr) => {
          const next = arr[i + 1];
          return (
            <EventChunk
              key={event.id}
              event={event}
              flex={next ? next.created_at - event.created_at : now - event.created_at}
            />
          );
        })}
    </Flex>
  );
}

export default function GhostToolbar() {
  const account = useCurrentAccount()!;
  const isGhost = useSubject(accountService.isGhost);

  const readRelays = useReadRelayUrls();
  const [since] = useState(dayjs().subtract(6, "hours").unix());

  const timeline = useTimelineLoader(`${account.pubkey}-ghost`, readRelays, { since, authors: [account.pubkey] });

  const events = useSubject(timeline.timeline);

  return (
    <Card
      p="2"
      display="flex"
      flexDirection="row"
      alignItems="center"
      gap="2"
      position="fixed"
      bottom="0"
      left="0"
      right="0"
    >
      <GhostIcon fontSize="2rem" />
      <Text>Ghosting: </Text>
      <UserAvatar pubkey={account.pubkey} size="sm" />
      <UserLink pubkey={account.pubkey} fontWeight="bold" />
      <Spacer />
      <CompactEventTimeline w="70%" timeline={timeline} />
      <Spacer />
      <CloseButton onClick={() => accountService.stopGhost()} />
    </Card>
  );
}
