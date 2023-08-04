import {
  Box,
  Button,
  ButtonGroup,
  Card,
  CardBody,
  CardHeader,
  Divider,
  Flex,
  Heading,
  Input,
  Modal,
  ModalBody,
  ModalCloseButton,
  ModalContent,
  ModalHeader,
  ModalOverlay,
  ModalProps,
  SimpleGrid,
  Spacer,
  Switch,
  Text,
  useDisclosure,
} from "@chakra-ui/react";
import { useAsync } from "react-use";
import { Link as RouterLink } from "react-router-dom";
import { useRelayInfo } from "../../hooks/use-relay-info";
import { RelayFavicon } from "../../components/relay-favicon";
import { useDeferredValue, useMemo, useState } from "react";
import { ExternalLinkIcon } from "../../components/icons";
import { UserLink } from "../../components/user-link";
import { UserAvatar } from "../../components/user-avatar";
import { useClientRelays, useReadRelayUrls } from "../../hooks/use-client-relays";
import clientRelaysService from "../../services/client-relays";
import { RelayMode } from "../../classes/relay";
import useTimelineLoader from "../../hooks/use-timeline-loader";
import useSubject from "../../hooks/use-subject";
import { UserDnsIdentityIcon } from "../../components/user-dns-identity-icon";
import { UserAvatarLink } from "../../components/user-avatar-link";
import { NostrEvent } from "../../types/nostr-event";
import dayjs from "dayjs";
import { safeJson } from "../../helpers/parse";
import StarRating from "../../components/star-rating";
import relayPoolService from "../../services/relay-pool";
import { useCurrentAccount } from "../../hooks/use-current-account";
import { safeRelayUrl } from "../../helpers/url";

function RelayReviewNote({ event }: { event: NostrEvent }) {
  const ratingJson = event.tags.find((t) => t[0] === "l" && t[3])?.[3];
  const rating = ratingJson ? (safeJson(ratingJson, undefined) as { quality: number } | undefined) : undefined;

  return (
    <Card variant="outline">
      <CardHeader display="flex" gap="2" px="2" pt="2" pb="0">
        <UserAvatarLink pubkey={event.pubkey} size="xs" />
        <UserLink pubkey={event.pubkey} isTruncated fontWeight="bold" fontSize="lg" />
        <UserDnsIdentityIcon pubkey={event.pubkey} onlyIcon />
        <Spacer />
        <Text>{dayjs.unix(event.created_at).fromNow()}</Text>
      </CardHeader>
      <CardBody p="2" gap="2" display="flex" flexDirection="column">
        {rating && <StarRating quality={rating.quality} color="yellow.400" />}
        <Box whiteSpace="pre-wrap">{event.content}</Box>
      </CardBody>
    </Card>
  );
}
function RelayReviewsModal({ relay, ...props }: { relay: string } & Omit<ModalProps, "children">) {
  const readRelays = useReadRelayUrls();
  const timeline = useTimelineLoader(`${relay}-reviews`, readRelays, {
    kinds: [1985],
    "#r": [relay],
    "#l": ["review/relay"],
  });

  const events = useSubject(timeline.timeline);

  return (
    <Modal {...props}>
      <ModalOverlay />
      <ModalContent>
        <ModalHeader p="4" pb="0">
          {relay} reviews
        </ModalHeader>
        <ModalCloseButton />
        <ModalBody px="4" pt="0" pb="4">
          <Flex gap="2" direction="column">
            {events.map((event) => (
              <RelayReviewNote key={event.id} event={event} />
            ))}
          </Flex>
        </ModalBody>
      </ModalContent>
    </Modal>
  );
}

function RelayCard({ url }: { url: string }) {
  const account = useCurrentAccount();
  const { info } = useRelayInfo(url);
  const clientRelays = useClientRelays();
  const reviewsModal = useDisclosure();

  const joined = clientRelays.some((r) => r.url === url);

  return (
    <>
      <Card>
        <CardHeader display="flex" gap="2" alignItems="center" p="2">
          <RelayFavicon relay={url} size="xs" />
          <Heading size="md" isTruncated>
            {url}
          </Heading>
        </CardHeader>
        <CardBody p="2" display="flex" flexDirection="column" gap="2">
          {info?.pubkey && (
            <Flex gap="2" alignItems="center">
              <Text fontWeight="bold">Owner:</Text>
              <UserAvatar pubkey={info.pubkey} size="xs" />
              <UserLink pubkey={info.pubkey} />
              <UserDnsIdentityIcon pubkey={info.pubkey} onlyIcon />
            </Flex>
          )}
          <ButtonGroup size="sm">
            {joined ? (
              <Button
                colorScheme="red"
                variant="outline"
                onClick={() => clientRelaysService.removeRelay(url)}
                isDisabled={!account}
              >
                Leave
              </Button>
            ) : (
              <Button
                colorScheme="green"
                onClick={() => clientRelaysService.addRelay(url, RelayMode.ALL)}
                isDisabled={!account}
              >
                Join
              </Button>
            )}
            <Button onClick={reviewsModal.onOpen}>Reviews</Button>
            <Button as={RouterLink} to={`/global?relay=${url}`}>
              Notes
            </Button>
            <Button
              as="a"
              href={`https://nostr.watch/relay/${new URL(url).host}`}
              target="_blank"
              rightIcon={<ExternalLinkIcon />}
            >
              More info
            </Button>
          </ButtonGroup>
        </CardBody>
      </Card>
      {reviewsModal.isOpen && <RelayReviewsModal isOpen onClose={reviewsModal.onClose} relay={url} size="2xl" />}
    </>
  );
}

export default function RelaysView() {
  const [search, setSearch] = useState("");
  const deboundedSearch = useDeferredValue(search);
  const isSearching = deboundedSearch.length > 2;
  const showAll = useDisclosure();

  const clientRelays = useClientRelays().map((r) => r.url);
  const discoveredRelays = relayPoolService
    .getRelays()
    .filter((r) => !clientRelays.includes(r.url))
    .map((r) => r.url)
    .filter(safeRelayUrl);
  const { value: onlineRelays = [] } = useAsync(async () =>
    fetch("https://api.nostr.watch/v1/online").then((res) => res.json() as Promise<string[]>)
  );

  const filteredRelays = useMemo(() => {
    if (isSearching) {
      return onlineRelays.filter((url) => url.includes(deboundedSearch));
    }

    return showAll.isOpen ? onlineRelays : clientRelays;
  }, [isSearching, deboundedSearch, onlineRelays, clientRelays, showAll.isOpen]);

  return (
    <Flex direction="column" gap="2" p="2">
      <Flex alignItems="center" gap="2">
        <Input type="search" placeholder="search" value={search} onChange={(e) => setSearch(e.target.value)} w="auto" />
        <Switch isChecked={showAll.isOpen} onChange={showAll.onToggle}>
          Show All
        </Switch>
      </Flex>
      <SimpleGrid minChildWidth="25rem" spacing="2">
        {filteredRelays.map((url) => (
          <RelayCard key={url} url={url} />
        ))}
      </SimpleGrid>

      {discoveredRelays && !isSearching && (
        <>
          <Divider />
          <Heading size="lg">Discovered Relays</Heading>
          <SimpleGrid minChildWidth="25rem" spacing="2">
            {discoveredRelays.map((url) => (
              <RelayCard key={url} url={url} />
            ))}
          </SimpleGrid>
        </>
      )}
    </Flex>
  );
}
