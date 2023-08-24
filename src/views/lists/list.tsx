import { Link as RouterList, useNavigate, useParams } from "react-router-dom";
import { nip19 } from "nostr-tools";

import { UserLink } from "../../components/user-link";
import { Button, Flex, Heading, IconButton, useDisclosure } from "@chakra-ui/react";
import { ArrowLeftSIcon, CodeIcon } from "../../components/icons";
import { useCurrentAccount } from "../../hooks/use-current-account";
import { useDeleteEventContext } from "../../providers/delete-event-provider";
import { parseCoordinate } from "../../helpers/nostr/events";
import { getListName, getPubkeysFromList } from "../../helpers/nostr/lists";
import useReplaceableEvent from "../../hooks/use-replaceable-event";
import { EventRelays } from "../../components/note/note-relays";
import UserCard from "./components/user-card";
import NoteDebugModal from "../../components/debug-modals/note-debug-modal";

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
  const debug = useDisclosure();
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
  const people = getPubkeysFromList(event);

  return (
    <Flex direction="column" px="2" pt="2" pb="8" overflowY="auto" overflowX="hidden" h="full" gap="2">
      <Flex gap="2" alignItems="center">
        <Button as={RouterList} to="/lists" leftIcon={<ArrowLeftSIcon />}>
          Back
        </Button>

        <Heading size="md" flex={1} isTruncated>
          {getListName(event)}
        </Heading>

        <EventRelays event={event} />

        {isAuthor && (
          <Button colorScheme="red" onClick={() => deleteEvent(event).then(() => navigate("/lists"))}>
            Delete
          </Button>
        )}
        <IconButton icon={<CodeIcon />} aria-label="Show raw" onClick={debug.onOpen} />
      </Flex>
      {people.map(({ pubkey, relay }) => (
        <UserCard pubkey={pubkey} relay={relay} list={event} />
      ))}

      {debug.isOpen && <NoteDebugModal event={event} isOpen onClose={debug.onClose} size="4xl" />}
    </Flex>
  );
}
