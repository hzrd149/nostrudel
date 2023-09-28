import { ReactNode, useMemo, useState } from "react";
import {
  Button,
  ButtonGroup,
  Card,
  CardBody,
  CardHeader,
  CardProps,
  Divider,
  Flex,
  Heading,
  Select,
} from "@chakra-ui/react";
import dayjs from "dayjs";
import { Kind } from "nostr-tools";

import useParsedStreams from "../../hooks/use-parsed-streams";
import useSubject from "../../hooks/use-subject";
import { ParsedStream, STREAM_KIND, getATag } from "../../helpers/nostr/stream";
import useTimelineLoader from "../../hooks/use-timeline-loader";
import RequireCurrentAccount from "../../providers/require-current-account";
import { useCurrentAccount } from "../../hooks/use-current-account";
import { getEventUID } from "../../helpers/nostr/events";
import { useReadRelayUrls } from "../../hooks/use-client-relays";
import useStreamChatTimeline from "../streams/stream/stream-chat/use-stream-chat-timeline";
import { UserAvatar } from "../../components/user-avatar";
import { UserLink } from "../../components/user-link";
import StreamChat from "../streams/stream/stream-chat";
import useUserMuteFunctions from "../../hooks/use-user-mute-functions";
import { useMuteModalContext } from "../../providers/mute-modal-provider";
import RelaySelectionProvider from "../../providers/relay-selection-provider";
import useUserMuteList from "../../hooks/use-user-mute-list";
import { isPubkeyInList } from "../../helpers/nostr/lists";
import ZapMessageMemo from "../streams/stream/stream-chat/zap-message";

function UserCard({ pubkey }: { pubkey: string }) {
  const { isMuted, mute, unmute, expiration } = useUserMuteFunctions(pubkey);
  const { openModal } = useMuteModalContext();

  let buttons: ReactNode | null = null;
  if (isMuted) {
    if (expiration === Infinity) {
      buttons = <Button onClick={unmute}>Unban</Button>;
    } else {
      buttons = <Button onClick={unmute}>Unmute ({dayjs.unix(expiration).fromNow()})</Button>;
    }
  } else {
    buttons = (
      <>
        <Button onClick={() => openModal(pubkey)}>Mute</Button>
        <Button onClick={mute}>Ban</Button>
      </>
    );
  }

  return (
    <Flex gap="2" direction="row" alignItems="center">
      {!isMuted && <UserAvatar pubkey={pubkey} noProxy size="sm" />}
      <UserLink pubkey={pubkey} />
      <ButtonGroup size="sm" ml="auto">
        {buttons}
      </ButtonGroup>
    </Flex>
  );
}

function UserMuteCard({ stream, ...props }: Omit<CardProps, "children"> & { stream: ParsedStream }) {
  const account = useCurrentAccount()!;
  const streamChatTimeline = useStreamChatTimeline(stream);

  // refresh when a new event
  useSubject(streamChatTimeline.events.onEvent);
  const chatEvents = streamChatTimeline.events.getSortedEvents();

  const muteList = useUserMuteList(account.pubkey);
  const pubkeysInChat = useMemo(() => {
    const pubkeys: string[] = [];
    for (const event of chatEvents) {
      if (!pubkeys.includes(event.pubkey)) pubkeys.push(event.pubkey);
    }
    return pubkeys;
  }, [chatEvents]);

  const peopleInChat = pubkeysInChat.filter((pubkey) => !isPubkeyInList(muteList, pubkey));
  const mutedPubkeys = pubkeysInChat.filter((pubkey) => isPubkeyInList(muteList, pubkey));

  return (
    <Card {...props}>
      <CardHeader pt="2" px="2" pb="0">
        <Heading size="md">Users in chat</Heading>
      </CardHeader>
      <CardBody p="2" gap="2" display="flex" overflowY="auto" overflowX="hidden" flexDirection="column">
        {peopleInChat.map((pubkey) => (
          <UserCard key={pubkey} pubkey={pubkey} />
        ))}
        {mutedPubkeys.length > 0 && (
          <>
            <Heading size="sm">Muted</Heading>
            <Divider />
            {mutedPubkeys.map((pubkey) => (
              <UserCard key={pubkey} pubkey={pubkey} />
            ))}
          </>
        )}
      </CardBody>
    </Card>
  );
}

function ZapMessagesCard({ stream, ...props }: Omit<CardProps, "children"> & { stream: ParsedStream }) {
  const streamChatTimeline = useStreamChatTimeline(stream);

  // refresh when a new event
  useSubject(streamChatTimeline.events.onEvent);
  const zapMessages = streamChatTimeline.events.getSortedEvents().filter((event) => event.kind === Kind.Zap);

  return (
    <Card {...props}>
      <CardHeader pt="2" px="2" pb="0">
        <Heading size="md">Zap messages</Heading>
      </CardHeader>
      <CardBody p="2" gap="2" display="flex" overflowY="auto" overflowX="hidden" flexDirection="column">
        {zapMessages.map((event) => (
          <ZapMessageMemo key={event.id} zap={event} stream={stream} />
        ))}
      </CardBody>
    </Card>
  );
}

function StreamModerationDashboard({ stream }: { stream: ParsedStream }) {
  return (
    <Flex gap="2" overflow="hidden">
      <UserMuteCard stream={stream} flex={1} />
      <ZapMessagesCard stream={stream} flex={1} />
      <StreamChat stream={stream} flex={1} />
    </Flex>
  );
}

function StreamModerationPage() {
  const account = useCurrentAccount()!;
  const readRelays = useReadRelayUrls();

  const timeline = useTimelineLoader(account.pubkey + "-streams", readRelays, [
    {
      authors: [account.pubkey],
      kinds: [STREAM_KIND],
    },
    { "#p": [account.pubkey], kinds: [STREAM_KIND] },
  ]);

  const streamEvents = useSubject(timeline.timeline);
  const streams = useParsedStreams(streamEvents);

  const [selected, setSelected] = useState<ParsedStream>();

  return (
    <Flex direction="column" p="2" overflow="hidden" gap="2" h="100vh">
      <Flex gap="2" flexShrink={0}>
        <Select
          placeholder="Select stream"
          value={selected && getATag(selected)}
          onChange={(e) => setSelected(streams.find((s) => getATag(s) === e.target.value))}
        >
          {streams.map((stream) => (
            <option key={getEventUID(stream.event)} value={getATag(stream)}>
              {stream.title} ({stream.status})
            </option>
          ))}
        </Select>
      </Flex>
      {selected && (
        <RelaySelectionProvider additionalDefaults={selected.relays ?? []}>
          <StreamModerationDashboard stream={selected} />
        </RelaySelectionProvider>
      )}
    </Flex>
  );
}

export default function StreamModerationView() {
  return (
    <RequireCurrentAccount>
      <StreamModerationPage />
    </RequireCurrentAccount>
  );
}
