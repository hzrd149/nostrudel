import { Button, Flex, Image, Link, Spacer } from "@chakra-ui/react";
import { useCurrentAccount } from "../../hooks/use-current-account";
import { useReadRelayUrls } from "../../hooks/use-client-relays";
import useUserLists from "../../hooks/use-user-lists";
import { ExternalLinkIcon, PlusCircleIcon } from "../../components/icons";
import RequireCurrentAccount from "../../providers/require-current-account";
import ListCard from "./components/list-card";
import useTimelineLoader from "../../hooks/use-timeline-loader";
import { NOTE_LIST, PEOPLE_LIST } from "../../helpers/nostr/lists";
import useSubject from "../../hooks/use-subject";
import { getEventCoordinate, getEventUID } from "../../helpers/nostr/events";

function UsersLists() {
  const account = useCurrentAccount()!;

  const readRelays = useReadRelayUrls();
  const lists = useUserLists(account.pubkey, readRelays, true);

  return (
    <>
      <ListCard cord={`3:${account.pubkey}`} />
      <ListCard cord={`10000:${account.pubkey}`} />
      {Array.from(Object.entries(lists)).map(([name, list]) => (
        <ListCard key={name} cord={list.cord} />
      ))}
    </>
  );
}

function ListsPage() {
  const account = useCurrentAccount()!;

  const readRelays = useReadRelayUrls();
  const timeline = useTimelineLoader("lists", readRelays, {
    authors: [account.pubkey],
    kinds: [PEOPLE_LIST, NOTE_LIST],
  });

  const events = useSubject(timeline.timeline);

  return (
    <Flex direction="column" p="2" gap="2">
      <Flex gap="2">
        <Spacer />
        <Button
          as={Link}
          href="https://listr.lol/"
          isExternal
          rightIcon={<ExternalLinkIcon />}
          leftIcon={<Image src="https://listr.lol/favicon.ico" w="1.2em" />}
        >
          Listr
        </Button>
        <Button leftIcon={<PlusCircleIcon />}>New List</Button>
      </Flex>

      <ListCard cord={`3:${account.pubkey}`} />
      <ListCard cord={`10000:${account.pubkey}`} />
      {events.map((event) => (
        <ListCard key={getEventUID(event)} event={event} />
      ))}
    </Flex>
  );
}

export default function ListsView() {
  return (
    <RequireCurrentAccount>
      <ListsPage />
    </RequireCurrentAccount>
  );
}
