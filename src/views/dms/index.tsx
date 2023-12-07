import { useEffect, useMemo, useState } from "react";
import { ChatIcon } from "@chakra-ui/icons";
import {
  Alert,
  AlertDescription,
  AlertIcon,
  AlertTitle,
  Button,
  Card,
  CardBody,
  Flex,
  Input,
  Link,
  LinkBox,
  LinkOverlay,
  Text,
} from "@chakra-ui/react";
import dayjs from "dayjs";
import { Outlet, Link as RouterLink, useLocation, useParams } from "react-router-dom";
import { nip19 } from "nostr-tools";

import UserAvatar from "../../components/user-avatar";
import { getUserDisplayName } from "../../helpers/user-metadata";
import useSubject from "../../hooks/use-subject";
import { useUserMetadata } from "../../hooks/use-user-metadata";
import directMessagesService from "../../services/direct-messages";
import { ExternalLinkIcon } from "../../components/icons";
import RequireCurrentAccount from "../../providers/require-current-account";
import Timestamp from "../../components/timestamp";
import VerticalPageLayout from "../../components/vertical-page-layout";
import PeopleListSelection from "../../components/people-list-selection/people-list-selection";
import PeopleListProvider, { usePeopleListContext } from "../../providers/people-list-provider";

function ContactCard({ pubkey }: { pubkey: string }) {
  const subject = useMemo(() => directMessagesService.getUserMessages(pubkey), [pubkey]);
  const messages = useSubject(subject);
  const metadata = useUserMetadata(pubkey);
  const location = useLocation();

  return (
    <LinkBox as={Card} size="sm">
      <CardBody display="flex" gap="2" overflow="hidden">
        <UserAvatar pubkey={pubkey} />
        <Flex direction="column" gap="1" overflow="hidden" flex={1}>
          <Text flex={1}>{getUserDisplayName(metadata, pubkey)}</Text>
          {messages[0] && <Timestamp flexShrink={0} timestamp={messages[0].created_at} />}
        </Flex>
      </CardBody>
      <LinkOverlay as={RouterLink} to={`/dm/${nip19.npubEncode(pubkey)}` + location.search} />
    </LinkBox>
  );
}

function DirectMessagesPage() {
  const params = useParams();
  const { people } = usePeopleListContext();
  const [from, setFrom] = useState(dayjs().subtract(2, "days").unix());
  const conversations = useSubject(directMessagesService.conversations);

  useEffect(() => directMessagesService.loadDateRange(from), [from]);

  const [loading, setLoading] = useState(false);
  const loadMore = () => {
    setLoading(true);
    setFrom((date) => dayjs(date).subtract(2, "days").unix());
    setTimeout(() => {
      setLoading(false);
    }, 1000);
  };

  const sortedConversations = useMemo(() => {
    return Array.from(conversations)
      .filter((pubkey) => (people ? people.some((p) => p.pubkey === pubkey) : true))
      .sort((a, b) => {
        const latestA = directMessagesService.getUserMessages(a).value[0]?.created_at ?? 0;
        const latestB = directMessagesService.getUserMessages(b).value[0]?.created_at ?? 0;

        return latestB - latestA;
      });
  }, [conversations, people]);

  const isChatOpen = !!params.pubkey;

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
          {/* <Input type="search" placeholder="Search" /> */}
          <PeopleListSelection flexShrink={0} />
        </Flex>
        {sortedConversations.map((pubkey) => (
          <ContactCard key={pubkey} pubkey={pubkey} />
        ))}
        <Button onClick={loadMore} isLoading={loading} flexShrink={0}>
          Load More
        </Button>
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
