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
  Link,
  LinkBox,
  LinkOverlay,
  Text,
} from "@chakra-ui/react";
import dayjs from "dayjs";
import { useEffect, useMemo, useRef, useState } from "react";
import { Link as RouterLink } from "react-router-dom";
import { UserAvatar } from "../../components/user-avatar";
import { Bech32Prefix, normalizeToBech32 } from "../../helpers/nip19";
import { getUserDisplayName } from "../../helpers/user-metadata";
import useSubject from "../../hooks/use-subject";
import { useUserMetadata } from "../../hooks/use-user-metadata";
import directMessagesService from "../../services/direct-messages";
import { ExternalLinkIcon } from "../../components/icons";
import RequireCurrentAccount from "../../providers/require-current-account";

function ContactCard({ pubkey }: { pubkey: string }) {
  const subject = useMemo(() => directMessagesService.getUserMessages(pubkey), [pubkey]);
  const messages = useSubject(subject);
  const metadata = useUserMetadata(pubkey);
  const npub = normalizeToBech32(pubkey, Bech32Prefix.Pubkey);

  return (
    <LinkBox as={Card} size="sm">
      <CardBody display="flex" gap="2" overflow="hidden">
        <UserAvatar pubkey={pubkey} />
        <Flex direction="column" gap="1" overflow="hidden" flex={1}>
          <Text flex={1}>{getUserDisplayName(metadata, pubkey)}</Text>
          {messages[0] && <Text flexShrink={0}>{dayjs.unix(messages[0].created_at).fromNow()}</Text>}
        </Flex>
      </CardBody>
      <LinkOverlay as={RouterLink} to={`/dm/${npub ?? pubkey}`} />
    </LinkBox>
  );
}

function DirectMessagesPage() {
  const [from, setFrom] = useState(dayjs().subtract(2, "days"));
  const conversations = useSubject(directMessagesService.conversations);

  useEffect(() => directMessagesService.loadDateRange(from), [from]);

  const [loading, setLoading] = useState(false);
  const loadMore = () => {
    setLoading(true);
    setFrom((date) => dayjs(date).subtract(2, "days"));
    setTimeout(() => {
      setLoading(false);
    }, 1000);
  };

  const sortedConversations = useMemo(() => {
    return Array.from(conversations).sort((a, b) => {
      const latestA = directMessagesService.getUserMessages(a).value[0]?.created_at ?? 0;
      const latestB = directMessagesService.getUserMessages(b).value[0]?.created_at ?? 0;

      return latestB - latestA;
    });
  }, [conversations]);

  if (conversations.length === 0) {
    return (
      <Alert
        status="info"
        variant="subtle"
        flexDirection="column"
        alignItems="center"
        justifyContent="center"
        textAlign="center"
        height="200px"
      >
        <AlertIcon boxSize="40px" mr={0} />
        <AlertTitle mt={4} mb={1} fontSize="lg">
          No direct messages yet :(
        </AlertTitle>
        <AlertDescription maxWidth="sm">
          Click <ChatIcon /> on another users profile to start a conversation.
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <Flex direction="column" gap="2" overflowX="hidden" overflowY="auto" height="100%" pt="2" pb="8">
      <Alert status="info" flexShrink={0}>
        <AlertIcon />
        <Flex direction={{ base: "column", lg: "row" }}>
          <AlertTitle>Give Blowater a try</AlertTitle>
          <AlertDescription>
            <Text>
              Its a much better chat app than what I can build inside of noStrudel.{" "}
              <Link href="https://blowater.deno.dev/" isExternal>
                blowater.deno.dev <ExternalLinkIcon />
              </Link>
            </Text>
          </AlertDescription>
        </Flex>
      </Alert>
      {sortedConversations.map((pubkey) => (
        <ContactCard key={pubkey} pubkey={pubkey} />
      ))}
      <Button onClick={loadMore} isLoading={loading} flexShrink={0}>
        Load More
      </Button>
    </Flex>
  );
}

export default function DirectMessagesView() {
  return (
    <RequireCurrentAccount>
      <DirectMessagesPage />
    </RequireCurrentAccount>
  );
}
