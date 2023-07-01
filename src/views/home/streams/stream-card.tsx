import { useMemo } from "react";
import { ParsedStream } from "../../../helpers/nostr/stream";
import {
  Badge,
  Button,
  ButtonGroup,
  Card,
  CardBody,
  CardFooter,
  CardProps,
  Divider,
  Flex,
  Heading,
  IconButton,
  Image,
  Link,
  LinkBox,
  LinkOverlay,
  Modal,
  ModalBody,
  ModalCloseButton,
  ModalContent,
  ModalHeader,
  ModalOverlay,
  Spacer,
  Text,
  useDisclosure,
} from "@chakra-ui/react";
import { Link as RouterLink } from "react-router-dom";
import { UserAvatar } from "../../../components/user-avatar";
import { UserLink } from "../../../components/user-link";
import dayjs from "dayjs";
import relayScoreboardService from "../../../services/relay-scoreboard";
import { getEventRelays } from "../../../services/event-relays";
import { nip19 } from "nostr-tools";
import { ExternalLinkIcon } from "@chakra-ui/icons";
import StreamStatusBadge from "./status-badge";
import { CodeIcon } from "../../../components/icons";
import RawValue from "../../../components/debug-modals/raw-value";
import RawJson from "../../../components/debug-modals/raw-json";

export default function StreamCard({ stream, ...props }: CardProps & { stream: ParsedStream }) {
  const { title, summary, starts, identifier, status, image } = stream;
  const devModal = useDisclosure();

  const naddr = useMemo(() => {
    const relays = getEventRelays(stream.event.id).value;
    const ranked = relayScoreboardService.getRankedRelays(relays);
    const onlyTwo = ranked.slice(0, 2);
    return nip19.naddrEncode({
      identifier,
      relays: onlyTwo,
      pubkey: stream.author,
      kind: stream.event.kind,
    });
  }, [identifier]);

  return (
    <>
      <Card {...props}>
        <LinkBox as={CardBody} p="2" display="flex" flexDirection="column" gap="2">
          {image && <Image src={image} alt={title} borderRadius="lg" />}
          <Flex gap="2" alignItems="center">
            <UserAvatar pubkey={stream.author} size="sm" />
            <Heading size="sm">
              <UserLink pubkey={stream.author} />
            </Heading>
          </Flex>
          <Heading size="md">
            <LinkOverlay as={RouterLink} to={`/streams/${naddr}`}>
              {title}
            </LinkOverlay>
          </Heading>
          <Text>{summary}</Text>
          {stream.tags.length > 0 && (
            <Flex gap="2" wrap="wrap">
              {stream.tags.map((tag) => (
                <Badge key={tag}>{tag}</Badge>
              ))}
            </Flex>
          )}
          <Text>Updated: {dayjs.unix(stream.updated).fromNow()}</Text>
        </LinkBox>
        <Divider />
        <CardFooter p="2" display="flex" gap="2" alignItems="center">
          <StreamStatusBadge stream={stream} />
          <Spacer />
          <IconButton
            icon={<CodeIcon />}
            aria-label="show raw event"
            onClick={devModal.onOpen}
            variant="ghost"
            size="sm"
          />
        </CardFooter>
      </Card>

      <Modal isOpen={devModal.isOpen} onClose={devModal.onClose} size="6xl">
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Raw event</ModalHeader>
          <ModalCloseButton />
          <ModalBody overflow="auto" p="4">
            <Flex gap="2" direction="column">
              <RawValue heading="Event Id" value={stream.event.id} />
              <RawValue heading="naddr" value={naddr} />
              <RawJson heading="Parsed" json={{ ...stream, event: "Omitted, see JSON below" }} />
              <RawJson heading="JSON" json={stream.event} />
            </Flex>
          </ModalBody>
        </ModalContent>
      </Modal>
    </>
  );
}
