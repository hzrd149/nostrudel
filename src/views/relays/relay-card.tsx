import {
  Box,
  Button,
  ButtonGroup,
  Card,
  CardBody,
  CardFooter,
  CardHeader,
  Code,
  Flex,
  Heading,
  IconButton,
  Modal,
  ModalBody,
  ModalCloseButton,
  ModalContent,
  ModalHeader,
  ModalOverlay,
  ModalProps,
  Spacer,
  Text,
  useDisclosure,
} from "@chakra-ui/react";
import { Link as RouterLink } from "react-router-dom";
import { useRelayInfo } from "../../hooks/use-relay-info";
import { RelayFavicon } from "../../components/relay-favicon";
import { CodeIcon, ExternalLinkIcon } from "../../components/icons";
import { UserLink } from "../../components/user-link";
import { UserAvatar } from "../../components/user-avatar";
import { useClientRelays, useReadRelayUrls } from "../../hooks/use-client-relays";
import clientRelaysService from "../../services/client-relays";
import { RelayMode } from "../../classes/relay";
import { UserDnsIdentityIcon } from "../../components/user-dns-identity-icon";
import { useCurrentAccount } from "../../hooks/use-current-account";
import useSubject from "../../hooks/use-subject";
import useTimelineLoader from "../../hooks/use-timeline-loader";
import RelayReviewNote from "./relay-review-note";
import styled from "@emotion/styled";
import { PropsWithChildren } from "react";
import RawJson from "../../components/debug-modals/raw-json";

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

const B = styled.span`
  font-weight: bold;
`;
export const Metadata = ({ name, children }: { name: string } & PropsWithChildren) =>
  children ? (
    <div>
      <B>{name}: </B>
      <span>{children}</span>
    </div>
  ) : null;

export function RelayMetadata({ url }: { url: string }) {
  const { info } = useRelayInfo(url);

  return (
    <Box>
      <Metadata name="Name">{info?.name}</Metadata>
      {info?.pubkey && (
        <Flex gap="2" alignItems="center">
          <B>Owner:</B>
          <UserAvatar pubkey={info.pubkey} size="xs" />
          <UserLink pubkey={info.pubkey} />
          <UserDnsIdentityIcon pubkey={info.pubkey} onlyIcon />
        </Flex>
      )}
    </Box>
  );
}

export default function RelayCard({ url }: { url: string }) {
  const account = useCurrentAccount();
  const { info } = useRelayInfo(url);
  const clientRelays = useClientRelays();
  const reviewsModal = useDisclosure();
  const debugModal = useDisclosure();

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
        <CardBody px="2" py="0" display="flex" flexDirection="column" gap="2">
          <RelayMetadata url={url} />
        </CardBody>
        <CardFooter p="2" as={Flex} gap="2">
          {joined ? (
            <Button
              colorScheme="red"
              variant="outline"
              onClick={() => clientRelaysService.removeRelay(url)}
              isDisabled={!account}
              size="sm"
            >
              Leave
            </Button>
          ) : (
            <Button
              colorScheme="green"
              onClick={() => clientRelaysService.addRelay(url, RelayMode.ALL)}
              isDisabled={!account}
              size="sm"
            >
              Join
            </Button>
          )}
          <Button onClick={reviewsModal.onOpen} size="sm">
            Reviews
          </Button>
          <Button as={RouterLink} to={`/global?relay=${url}`} size="sm">
            Notes
          </Button>

          <IconButton
            icon={<CodeIcon />}
            aria-label="Show JSON"
            onClick={debugModal.onToggle}
            variant="ghost"
            size="sm"
            ml="auto"
          />
          <Button
            as="a"
            href={`https://nostr.watch/relay/${new URL(url).host}`}
            target="_blank"
            rightIcon={<ExternalLinkIcon />}
            size="sm"
          >
            More
          </Button>
        </CardFooter>
      </Card>
      {reviewsModal.isOpen && <RelayReviewsModal isOpen onClose={reviewsModal.onClose} relay={url} size="2xl" />}
      {debugModal.isOpen && (
        <Modal isOpen onClose={debugModal.onClose} size="4xl">
          <ModalOverlay />
          <ModalContent>
            <ModalHeader p="4">Relay Info</ModalHeader>
            <ModalCloseButton />
            <ModalBody px="4" pt="0" pb="4">
              <RawJson heading="Info" json={info} />
            </ModalBody>
          </ModalContent>
        </Modal>
      )}
    </>
  );
}
