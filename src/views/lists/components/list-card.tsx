import { Link as RouterLink } from "react-router-dom";
import { AvatarGroup, Card, CardBody, CardHeader, Heading, Link, Spacer, Text } from "@chakra-ui/react";

import { UserAvatarLink } from "../../../components/user-avatar-link";
import { UserLink } from "../../../components/user-link";
import EventVerificationIcon from "../../../components/event-verification-icon";
import { getListName, getPubkeysFromList } from "../../../helpers/nostr/lists";
import { getSharableEventNaddr } from "../../../helpers/nip19";
import { NostrEvent } from "../../../types/nostr-event";
import useReplaceableEvent from "../../../hooks/use-replaceable-event";
import { Kind } from "nostr-tools";
import { createCoordinate } from "../../../services/replaceable-event-requester";

export default function ListCard({ cord, event: maybeEvent }: { cord?: string; event?: NostrEvent }) {
  const event = maybeEvent ?? (cord ? useReplaceableEvent(cord as string) : undefined);
  if (!event) return null;

  const people = getPubkeysFromList(event);
  const link =
    event.kind === Kind.Contacts ? createCoordinate(Kind.Contacts, event.pubkey) : getSharableEventNaddr(event);

  return (
    <Card>
      <CardHeader display="flex" p="2" flex="1" gap="2" alignItems="center">
        <Heading size="md">
          <Link as={RouterLink} to={`/lists/${link}`}>
            {getListName(event)}
          </Link>
        </Heading>
        <Spacer />
        <Text>Created by:</Text>
        <UserAvatarLink pubkey={event.pubkey} size="xs" />
        <UserLink pubkey={event.pubkey} isTruncated fontWeight="bold" fontSize="lg" />
        <EventVerificationIcon event={event} />
      </CardHeader>
      <CardBody p="2">
        {people.length > 0 && (
          <>
            <Text>{people.length} people</Text>
            <AvatarGroup overflow="hidden">
              {people.map(({ pubkey, relay }) => (
                <UserAvatarLink pubkey={pubkey} relay={relay} />
              ))}
            </AvatarGroup>
          </>
        )}
      </CardBody>
    </Card>
  );
}
