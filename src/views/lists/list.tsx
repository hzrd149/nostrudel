import { Link as RouterList, useNavigate, useParams } from "react-router-dom";
import { Kind, nip19 } from "nostr-tools";
import { Link as RouterLink } from "react-router-dom";

import { UserLink } from "../../components/user-link";
import { Button, Divider, Flex, Heading, SimpleGrid, Spacer } from "@chakra-ui/react";
import { ArrowLeftSIcon } from "../../components/icons";
import { useCurrentAccount } from "../../hooks/use-current-account";
import { useDeleteEventContext } from "../../providers/delete-event-provider";
import { getEventCoordinate, parseCoordinate } from "../../helpers/nostr/events";
import { PEOPLE_LIST_KIND, getEventsFromList, getListName, getPubkeysFromList } from "../../helpers/nostr/lists";
import useReplaceableEvent from "../../hooks/use-replaceable-event";
import { EventRelays } from "../../components/note/note-relays";
import UserCard from "./components/user-card";
import NoteCard from "./components/note-card";
import { TrustProvider } from "../../providers/trust";
import ListMenu from "./components/list-menu";
import ListFavoriteButton from "./components/list-favorite-button";

function useListCoordinate() {
  const { addr } = useParams() as { addr: string };

  if (addr.includes(":")) {
    const parsed = parseCoordinate(addr);
    if (!parsed) throw new Error("Bad coordinate");
    return parsed;
  }

  const parsed = nip19.decode(addr);
  if (parsed.type !== "naddr") throw new Error(`Unknown type ${parsed.type}`);
  return parsed.data;
}

export default function ListView() {
  const navigate = useNavigate();
  const coordinate = useListCoordinate();
  const { deleteEvent } = useDeleteEventContext();
  const account = useCurrentAccount();

  const event = useReplaceableEvent(coordinate);

  if (!event)
    return (
      <>
        Looking for list "{coordinate.identifier}" created by <UserLink pubkey={coordinate.pubkey} />
      </>
    );

  const isAuthor = account?.pubkey === event.pubkey;
  const shouldShowFeedButton = event.kind === PEOPLE_LIST_KIND || event.kind === Kind.Contacts;
  const people = getPubkeysFromList(event);
  const notes = getEventsFromList(event);

  return (
    <Flex direction="column" px="2" pt="2" pb="8" overflowY="auto" overflowX="hidden" h="full" gap="2">
      <Flex gap="2" alignItems="center">
        <Button as={RouterList} to="/lists" leftIcon={<ArrowLeftSIcon />}>
          Back
        </Button>

        <Heading size="md" isTruncated>
          {getListName(event)}
        </Heading>
        <ListFavoriteButton list={event} size="sm" />

        <Spacer />

        <EventRelays event={event} />

        {shouldShowFeedButton && (
          <Button
            as={RouterLink}
            to={{ pathname: "/", search: new URLSearchParams({ people: getEventCoordinate(event) }).toString() }}
          >
            View Feed
          </Button>
        )}
        {isAuthor && (
          <Button colorScheme="red" onClick={() => deleteEvent(event).then(() => navigate("/lists"))}>
            Delete
          </Button>
        )}
        <ListMenu aria-label="More options" list={event} />
      </Flex>

      {people.length > 0 && (
        <>
          <Heading size="md">People</Heading>
          <Divider />
          <SimpleGrid columns={{ base: 1, lg: 2, xl: 3 }} spacing="2">
            {people.map(({ pubkey, relay }) => (
              <UserCard pubkey={pubkey} relay={relay} list={event} />
            ))}
          </SimpleGrid>
        </>
      )}

      {notes.length > 0 && (
        <>
          <Heading size="md">Notes</Heading>
          <Divider />
          <TrustProvider trust>
            <Flex gap="2" direction="column">
              {notes.map(({ id, relay }) => (
                <NoteCard id={id} relay={relay} />
              ))}
            </Flex>
          </TrustProvider>
        </>
      )}
    </Flex>
  );
}
