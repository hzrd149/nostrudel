import { memo, useRef } from "react";
import { Link as RouterLink } from "react-router-dom";
import {
  AvatarGroup,
  ButtonGroup,
  Card,
  CardBody,
  CardFooter,
  CardHeader,
  CardProps,
  Flex,
  Heading,
  Link,
  Text,
} from "@chakra-ui/react";

import { UserAvatarLink } from "../../../components/user-avatar-link";
import { UserLink } from "../../../components/user-link";
import {
  getEventsFromList,
  getListName,
  getPubkeysFromList,
  getReferencesFromList,
  isSpecialListKind,
} from "../../../helpers/nostr/lists";
import { getSharableEventAddress } from "../../../helpers/nip19";
import { NostrEvent } from "../../../types/nostr-event";
import useReplaceableEvent from "../../../hooks/use-replaceable-event";
import { createCoordinate } from "../../../services/replaceable-event-requester";
import { EventRelays } from "../../../components/note/note-relays";
import { NoteLink } from "../../../components/note-link";
import { useRegisterIntersectionEntity } from "../../../providers/intersection-observer";
import ListFavoriteButton from "./list-favorite-button";
import { getEventUID } from "../../../helpers/nostr/events";
import ListMenu from "./list-menu";
import Timestamp from "../../../components/timestamp";

function ListCardRender({ event, ...props }: Omit<CardProps, "children"> & { event: NostrEvent }) {
  const people = getPubkeysFromList(event);
  const notes = getEventsFromList(event);
  const references = getReferencesFromList(event);
  const link = isSpecialListKind(event.kind)
    ? createCoordinate(event.kind, event.pubkey)
    : getSharableEventAddress(event);

  // if there is a parent intersection observer, register this card
  const ref = useRef<HTMLDivElement | null>(null);
  useRegisterIntersectionEntity(ref, getEventUID(event));

  return (
    <Card ref={ref} variant="outline" {...props}>
      <CardHeader display="flex" alignItems="center" p="2" pb="0">
        <Heading size="md">
          <Link as={RouterLink} to={`/lists/${link}`}>
            {getListName(event)}
          </Link>
        </Heading>
        <ButtonGroup size="sm" ml="auto">
          <ListFavoriteButton list={event} />
          <ListMenu list={event} aria-label="list menu" />
        </ButtonGroup>
      </CardHeader>
      <CardBody p="2">
        <Flex gap="2">
          <Text>Created by:</Text>
          <UserAvatarLink pubkey={event.pubkey} size="xs" />
          <UserLink pubkey={event.pubkey} isTruncated fontWeight="bold" fontSize="lg" />
        </Flex>
        <Text>
          Updated: <Timestamp timestamp={event.created_at} />
        </Text>
        {people.length > 0 && (
          <>
            <Text>People ({people.length}):</Text>
            <AvatarGroup overflow="hidden" mb="2" max={16} size="sm">
              {people.map(({ pubkey, relay }) => (
                <UserAvatarLink key={pubkey} pubkey={pubkey} relay={relay} />
              ))}
            </AvatarGroup>
          </>
        )}
        {notes.length > 0 && (
          <>
            <Text>Notes ({notes.length}):</Text>
            <Flex gap="2" overflow="hidden">
              {notes.map(({ id, relay }) => (
                <NoteLink key={id} noteId={id} />
              ))}
            </Flex>
          </>
        )}
        {references.length > 0 && (
          <>
            <Text>References ({references.length}):</Text>
          </>
        )}
      </CardBody>
      <CardFooter p="2" display="flex" pt="0">
        <EventRelays event={event} ml="auto" />
      </CardFooter>
    </Card>
  );
}

function ListCard({ cord, event: maybeEvent }: { cord?: string; event?: NostrEvent }) {
  const event = maybeEvent ?? (cord ? useReplaceableEvent(cord as string) : undefined);
  if (!event) return null;
  else return <ListCardRender event={event} />;
}

export default memo(ListCard);
