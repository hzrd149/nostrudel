import { AvatarGroup, Card, CardBody, CardHeader, CardProps, Flex, Heading, Link, Text } from "@chakra-ui/react";
import { Link as RouterLink } from "react-router-dom";

import { NostrEvent } from "../../../types/nostr-event";
import { getEventsFromList, getListName, getPubkeysFromList, isSpecialListKind } from "../../../helpers/nostr/lists";
import { createCoordinate } from "../../../services/replaceable-event-requester";
import { getSharableEventAddress } from "../../../helpers/nip19";
import { UserAvatarLink } from "../../user-avatar-link";
import { UserLink } from "../../user-link";
import { NoteLink } from "../../note-link";
import ListFeedButton from "../../../views/lists/components/list-feed-button";

export default function EmbeddedList({ list: list, ...props }: Omit<CardProps, "children"> & { list: NostrEvent }) {
  const people = getPubkeysFromList(list);
  const notes = getEventsFromList(list);
  const link = isSpecialListKind(list.kind) ? createCoordinate(list.kind, list.pubkey) : getSharableEventAddress(list);

  return (
    <Card {...props}>
      <CardHeader display="flex" alignItems="center" p="2" pb="0" gap="2">
        <Heading size="md">
          <Link as={RouterLink} to={`/lists/${link}`}>
            {getListName(list)}
          </Link>
        </Heading>
        <ListFeedButton list={list} ml="auto" size="sm" />
      </CardHeader>
      <CardBody p="2">
        <Flex gap="2">
          <Text>Created by:</Text>
          <UserAvatarLink pubkey={list.pubkey} size="xs" />
          <UserLink pubkey={list.pubkey} isTruncated fontWeight="bold" fontSize="lg" />
        </Flex>
        {people.length > 0 && (
          <AvatarGroup overflow="hidden" mb="2" max={16} size="sm">
            {people.map(({ pubkey, relay }) => (
              <UserAvatarLink key={pubkey} pubkey={pubkey} relay={relay} />
            ))}
          </AvatarGroup>
        )}
        {notes.length > 0 && (
          <Flex gap="2" overflow="hidden">
            {notes.map(({ id, relay }) => (
              <NoteLink key={id} noteId={id} />
            ))}
          </Flex>
        )}
      </CardBody>
    </Card>
  );
}
