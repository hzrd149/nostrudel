import { Button, Divider, Flex, Heading, Image, Link, SimpleGrid, Spacer, useDisclosure } from "@chakra-ui/react";
import { useNavigate } from "react-router-dom";
import { Kind } from "nostr-tools";

import { useCurrentAccount } from "../../hooks/use-current-account";
import { ExternalLinkIcon, PlusCircleIcon } from "../../components/icons";
import RequireCurrentAccount from "../../providers/require-current-account";
import ListCard from "./components/list-card";
import { getEventUID } from "../../helpers/nostr/events";
import useUserLists from "../../hooks/use-user-lists";
import NewListModal from "./components/new-list-modal";
import { getSharableEventNaddr } from "../../helpers/nip19";
import { MUTE_LIST_KIND, NOTE_LIST_KIND, PEOPLE_LIST_KIND, PIN_LIST_KIND } from "../../helpers/nostr/lists";

function ListsPage() {
  const account = useCurrentAccount()!;
  const events = useUserLists(account.pubkey);
  const newList = useDisclosure();
  const navigate = useNavigate();

  const peopleLists = events.filter((event) => event.kind === PEOPLE_LIST_KIND);
  const noteLists = events.filter((event) => event.kind === NOTE_LIST_KIND);

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
        <Button leftIcon={<PlusCircleIcon />} onClick={newList.onOpen} colorScheme="brand">
          New List
        </Button>
      </Flex>

      <Heading size="md">Special lists</Heading>
      <Divider />
      <SimpleGrid columns={{ base: 1, lg: 2, xl: 3 }} spacing="2">
        <ListCard cord={`${Kind.Contacts}:${account.pubkey}`} />
        <ListCard cord={`${MUTE_LIST_KIND}:${account.pubkey}`} />
        <ListCard cord={`${PIN_LIST_KIND}:${account.pubkey}`} />
      </SimpleGrid>
      <Heading size="md">People lists</Heading>
      <Divider />
      <SimpleGrid columns={{ base: 1, lg: 2, xl: 3 }} spacing="2">
        {peopleLists.map((event) => (
          <ListCard key={getEventUID(event)} event={event} />
        ))}
      </SimpleGrid>
      <Heading size="md">Bookmark lists</Heading>
      <Divider />
      <SimpleGrid columns={{ base: 1, lg: 2, xl: 3 }} spacing="2">
        {noteLists.map((event) => (
          <ListCard key={getEventUID(event)} event={event} />
        ))}
      </SimpleGrid>

      {newList.isOpen && (
        <NewListModal
          isOpen
          onClose={newList.onClose}
          onCreated={(list) => navigate(`/lists/${getSharableEventNaddr(list)}`)}
        />
      )}
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
