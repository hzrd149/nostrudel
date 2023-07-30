import { useMemo, useRef } from "react";
import { ParsedStream } from "../../../helpers/nostr/stream";
import {
  Badge,
  Card,
  CardBody,
  CardFooter,
  CardProps,
  Divider,
  Flex,
  Heading,
  IconButton,
  Image,
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
import StreamStatusBadge from "./status-badge";
import { CodeIcon } from "../../../components/icons";
import RawValue from "../../../components/debug-modals/raw-value";
import RawJson from "../../../components/debug-modals/raw-json";
import { NoteRelays } from "../../../components/note/note-relays";
import { useRegisterIntersectionEntity } from "../../../providers/intersection-observer";
import useEventNaddr from "../../../hooks/use-event-naddr";

export default function StreamCard({ stream, ...props }: CardProps & { stream: ParsedStream }) {
  const { title, identifier, image } = stream;
  const devModal = useDisclosure();

  // if there is a parent intersection observer, register this card
  const ref = useRef<HTMLDivElement | null>(null);
  useRegisterIntersectionEntity(ref, stream.event.id);

  const naddr = useEventNaddr(stream.event);

  return (
    <>
      <Card {...props} ref={ref}>
        <LinkBox as={CardBody} p="2" display="flex" flexDirection="column" gap="2">
          {image && <Image src={image} alt={title} borderRadius="lg" />}
          <Flex gap="2" alignItems="center">
            <UserAvatar pubkey={stream.host} size="sm" noProxy />
            <Heading size="sm">
              <UserLink pubkey={stream.host} />
            </Heading>
          </Flex>
          <Heading size="md">
            <LinkOverlay as={RouterLink} to={`/streams/${naddr}`}>
              {title}
            </LinkOverlay>
          </Heading>
          {stream.tags.length > 0 && (
            <Flex gap="2" wrap="wrap">
              {stream.tags.map((tag) => (
                <Badge key={tag}>{tag}</Badge>
              ))}
            </Flex>
          )}
          {stream.starts && <Text>Started: {dayjs.unix(stream.starts).fromNow()}</Text>}
        </LinkBox>
        <Divider />
        <CardFooter p="2" display="flex" gap="2" alignItems="center">
          <StreamStatusBadge stream={stream} />
          <Spacer />
          <NoteRelays event={stream.event} />
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
          <ModalBody p="4">
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
