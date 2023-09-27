import {
  AvatarGroup,
  Button,
  Card,
  CardBody,
  CardHeader,
  Flex,
  Heading,
  LinkBox,
  LinkOverlay,
  SimpleGrid,
  Text,
} from "@chakra-ui/react";
import { memo } from "react";
import { Link as RouterLink, useNavigate } from "react-router-dom";

import VerticalPageLayout from "../../components/vertical-page-layout";
import { getPubkeysFromList } from "../../helpers/nostr/lists";
import { useClientRelays, useReadRelayUrls } from "../../hooks/use-client-relays";
import { useCurrentAccount } from "../../hooks/use-current-account";
import useSubjects from "../../hooks/use-subjects";
import useUserContactList from "../../hooks/use-user-contact-list";
import RequireCurrentAccount from "../../providers/require-current-account";
import userRelaysService from "../../services/user-relays";
import { NostrEvent } from "../../types/nostr-event";
import { RelayFavicon } from "../../components/relay-favicon";
import { ArrowLeftSIcon } from "../../components/icons";
import { UserAvatar } from "../../components/user-avatar";
import { RelayMetadata } from "./components/relay-card";

function usePopularContactsRelays(list?: NostrEvent) {
  const readRelays = useReadRelayUrls();
  const subs = list ? getPubkeysFromList(list).map((p) => userRelaysService.requestRelays(p.pubkey, readRelays)) : [];
  const contactsRelays = useSubjects(subs);

  const relayScore: Record<string, string[]> = {};
  for (const { relays, pubkey } of contactsRelays) {
    for (const { url } of relays) {
      relayScore[url] = relayScore[url] || [];
      relayScore[url].push(pubkey);
    }
  }

  const relayUrls = Array.from(Object.entries(relayScore)).map(([url, pubkeys]) => ({ url, pubkeys }));

  return relayUrls.sort((a, b) => b.pubkeys.length - a.pubkeys.length);
}

const RelayCard = memo(({ url, pubkeys }: { url: string; pubkeys: string[] }) => {
  return (
    <Card variant="outline" as={LinkBox}>
      <CardHeader px="2" pt="2" pb="0" display="flex" gap="2" alignItems="center">
        <RelayFavicon relay={url} size="sm" />
        <Heading size="md" isTruncated>
          <LinkOverlay as={RouterLink} to={`/r/${encodeURIComponent(url)}`}>
            {url}
          </LinkOverlay>
        </Heading>
      </CardHeader>
      <CardBody p="2">
        <RelayMetadata url={url} />
        <Text>Used by {pubkeys.length} contacts:</Text>
        <AvatarGroup size="sm" max={10}>
          {pubkeys.map((pubkey) => (
            <UserAvatar key={pubkey} pubkey={pubkey} />
          ))}
        </AvatarGroup>
      </CardBody>
    </Card>
  );
});

function PopularRelaysPage() {
  const navigate = useNavigate();
  const account = useCurrentAccount();
  const contacts = useUserContactList(account?.pubkey);

  const clientRelays = useClientRelays().map((r) => r.url);
  const popularRelays = usePopularContactsRelays(contacts).filter(
    (r) => !clientRelays.includes(r.url) && r.pubkeys.length > 1,
  );

  return (
    <VerticalPageLayout>
      <Flex gap="2" alignItems="center">
        <Button onClick={() => navigate(-1)} leftIcon={<ArrowLeftSIcon />}>
          Back
        </Button>
        <Heading size="md">Popular Relays</Heading>
      </Flex>
      <SimpleGrid columns={[1, 1, 1, 2, 3]} spacing="2">
        {popularRelays.map(({ url, pubkeys }) => (
          <RelayCard url={url} pubkeys={pubkeys} key={url} />
        ))}
      </SimpleGrid>
    </VerticalPageLayout>
  );
}

export default function PopularRelaysView() {
  return (
    <RequireCurrentAccount>
      <PopularRelaysPage />
    </RequireCurrentAccount>
  );
}
