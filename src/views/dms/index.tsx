import { useMemo } from "react";
import { Card, CardBody, Flex, LinkBox, LinkOverlay, Text } from "@chakra-ui/react";
import { Outlet, Link as RouterLink, useLocation, useParams } from "react-router-dom";
import { nip19 } from "nostr-tools";

import UserAvatar from "../../components/user/user-avatar";
import useSubject from "../../hooks/use-subject";
import RequireCurrentAccount from "../../providers/route/require-current-account";
import Timestamp from "../../components/timestamp";
import PeopleListSelection from "../../components/people-list-selection/people-list-selection";
import PeopleListProvider, { usePeopleListContext } from "../../providers/local/people-list-provider";
import useCurrentAccount from "../../hooks/use-current-account";
import { KnownConversation, groupIntoConversations, hasResponded, identifyConversation } from "../../helpers/nostr/dms";
import IntersectionObserverProvider from "../../providers/local/intersection-observer";
import { useTimelineCurserIntersectionCallback } from "../../hooks/use-timeline-cursor-intersection-callback";
import TimelineActionAndStatus from "../../components/timeline/timeline-action-and-status";
import { useDMTimeline } from "../../providers/global/dms-provider";
import UserName from "../../components/user/user-name";
import { useDecryptionContainer } from "../../providers/global/decryption-provider";
import { NostrEvent } from "../../types/nostr-event";
import { CheckIcon } from "../../components/icons";
import UserDnsIdentity from "../../components/user/user-dns-identity";
import useEventIntersectionRef from "../../hooks/use-event-intersection-ref";

function MessagePreview({ message, pubkey }: { message: NostrEvent; pubkey: string }) {
  const ref = useEventIntersectionRef(message);

  const { plaintext } = useDecryptionContainer(pubkey, message.content);
  return (
    <Text isTruncated ref={ref}>
      {plaintext || "<Encrypted>"}
    </Text>
  );
}

function ConversationCard({ conversation }: { conversation: KnownConversation }) {
  const location = useLocation();
  const lastReceived = conversation.messages.find((m) => m.pubkey === conversation.correspondent);
  const lastMessage = conversation.messages[0];

  const ref = useEventIntersectionRef(lastMessage);

  return (
    <LinkBox as={Card} size="sm" ref={ref}>
      <CardBody display="flex" gap="2" overflow="hidden">
        <UserAvatar pubkey={conversation.correspondent} />
        <Flex direction="column" gap="1" overflow="hidden" flex={1}>
          <Flex gap="2" alignItems="center" overflow="hidden">
            <UserName pubkey={conversation.correspondent} isTruncated />
            <UserDnsIdentity onlyIcon pubkey={conversation.correspondent} />
            <Timestamp flexShrink={0} timestamp={lastMessage.created_at} ml="auto" />
            {hasResponded(conversation) && <CheckIcon boxSize={4} color="green.500" />}
          </Flex>
          {lastReceived && <MessagePreview message={lastReceived} pubkey={lastReceived.pubkey} />}
        </Flex>
      </CardBody>
      <LinkOverlay as={RouterLink} to={`/dm/${nip19.npubEncode(conversation.correspondent)}` + location.search} />
    </LinkBox>
  );
}

function DirectMessagesPage() {
  const params = useParams();
  const { people } = usePeopleListContext();

  const account = useCurrentAccount()!;
  const timeline = useDMTimeline();

  const messages = useSubject(timeline.timeline);
  const conversations = useMemo(() => {
    const conversations = groupIntoConversations(messages).map((c) => identifyConversation(c, account.pubkey));
    const filtered = conversations.filter((conversation) =>
      people ? people.some((p) => p.pubkey === conversation.correspondent) : true,
    );

    return filtered.sort((a, b) => b.messages[0].created_at - a.messages[0].created_at);
  }, [messages, people, account.pubkey]);

  const isChatOpen = !!params.pubkey;

  const callback = useTimelineCurserIntersectionCallback(timeline);

  return (
    <Flex gap="4" h={{ base: "calc(100vh - 3.5rem)", md: "100vh" }} overflow="hidden">
      <Flex
        gap="2"
        direction="column"
        w={!isChatOpen ? { base: "full", lg: "sm" } : "sm"}
        overflowX="hidden"
        overflowY="auto"
        py="2"
        px={{ base: "2", lg: 0 }}
        hideBelow={!isChatOpen ? undefined : "xl"}
      >
        <Flex gap="2">
          <PeopleListSelection flexShrink={0} />
        </Flex>
        <IntersectionObserverProvider callback={callback}>
          {conversations.map((conversation) => (
            <ConversationCard key={conversation.pubkeys.join("-")} conversation={conversation} />
          ))}
        </IntersectionObserverProvider>
        <TimelineActionAndStatus timeline={timeline} />
      </Flex>
      <Flex gap="2" direction="column" flex={1} hideBelow={!isChatOpen ? "xl" : undefined} overflow="hidden">
        <Outlet />
      </Flex>
    </Flex>
  );
}

export default function DirectMessagesView() {
  return (
    <RequireCurrentAccount>
      <PeopleListProvider initList="global">
        <DirectMessagesPage />
      </PeopleListProvider>
    </RequireCurrentAccount>
  );
}
