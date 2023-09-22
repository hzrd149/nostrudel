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
import { nip19 } from "nostr-tools";

import { UserAvatarLink } from "../../../components/user-avatar-link";
import { UserLink } from "../../../components/user-link";
import {
  getEventsFromList,
  getListName,
  getParsedCordsFromList,
  getPubkeysFromList,
  getReferencesFromList,
  isSpecialListKind,
} from "../../../helpers/nostr/lists";
import { getSharableEventAddress } from "../../../helpers/nip19";
import { NostrEvent } from "../../../types/nostr-event";
import useReplaceableEvent from "../../../hooks/use-replaceable-event";
import { createCoordinate } from "../../../services/replaceable-event-requester";
import { NoteLink } from "../../../components/note-link";
import { useRegisterIntersectionEntity } from "../../../providers/intersection-observer";
import ListFavoriteButton from "./list-favorite-button";
import { getEventUID } from "../../../helpers/nostr/events";
import ListMenu from "./list-menu";
import Timestamp from "../../../components/timestamp";
import { COMMUNITY_DEFINITION_KIND } from "../../../helpers/nostr/communities";

function ListCardRender({ list, ...props }: Omit<CardProps, "children"> & { list: NostrEvent }) {
  const people = getPubkeysFromList(list);
  const notes = getEventsFromList(list);
  const coordinates = getParsedCordsFromList(list);
  const communities = coordinates.filter((cord) => cord.kind === COMMUNITY_DEFINITION_KIND);
  const references = getReferencesFromList(list);
  const link = isSpecialListKind(list.kind) ? createCoordinate(list.kind, list.pubkey) : getSharableEventAddress(list);

  // if there is a parent intersection observer, register this card
  const ref = useRef<HTMLDivElement | null>(null);
  useRegisterIntersectionEntity(ref, getEventUID(list));

  return (
    <Card ref={ref} variant="outline" {...props}>
      <CardHeader display="flex" alignItems="center" p="2" pb="0">
        <Heading size="md" isTruncated>
          <Link as={RouterLink} to={`/lists/${link}`}>
            {getListName(list)}
          </Link>
        </Heading>
        <Link as={RouterLink} to={`/lists/${link}`} ml="auto">
          <Timestamp timestamp={list.created_at} />
        </Link>
      </CardHeader>
      <CardBody py="0" px="2">
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
              {notes.slice(0, 4).map(({ id, relay }) => (
                <NoteLink key={id} noteId={id} />
              ))}
            </Flex>
          </>
        )}
        {references.length > 0 && (
          <>
            <Text>References ({references.length})</Text>
            <Flex gap="2" overflow="hidden">
              {references.slice(0, 3).map(({ url, petname }) => (
                <Link maxW="200" href={url} isExternal whiteSpace="pre" color="blue.500" isTruncated>
                  {petname || url}
                </Link>
              ))}
            </Flex>
          </>
        )}
        {communities.length > 0 && (
          <>
            <Text>Communities ({communities.length}):</Text>
            <Flex gap="2" overflow="hidden">
              {communities.map((pointer) => (
                <Link
                  as={RouterLink}
                  to={`/c/${pointer.identifier}/${nip19.npubEncode(pointer.pubkey)}`}
                  color="blue.500"
                >
                  {pointer.identifier}
                </Link>
              ))}
            </Flex>
          </>
        )}
      </CardBody>
      <CardFooter p="2" display="flex" alignItems="center" whiteSpace="pre" gap="2">
        <Text>Created by:</Text>
        <UserAvatarLink pubkey={list.pubkey} size="xs" />
        <UserLink pubkey={list.pubkey} isTruncated fontWeight="bold" fontSize="lg" />
        <ButtonGroup size="xs" variant="ghost" ml="auto">
          <ListFavoriteButton list={list} />
          <ListMenu list={list} aria-label="list menu" />
        </ButtonGroup>
      </CardFooter>
    </Card>
  );
}

function ListCard({ cord, list: maybeEvent }: { cord?: string; list?: NostrEvent }) {
  const event = maybeEvent ?? (cord ? useReplaceableEvent(cord as string) : undefined);
  if (!event) return null;
  else return <ListCardRender list={event} />;
}

export default memo(ListCard);
