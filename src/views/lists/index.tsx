import { Button, Flex, Image, Link, Spacer } from "@chakra-ui/react";
import { useCurrentAccount } from "../../hooks/use-current-account";
import { ExternalLinkIcon, PlusCircleIcon } from "../../components/icons";
import RequireCurrentAccount from "../../providers/require-current-account";
import ListCard from "./components/list-card";
import { getEventUID } from "../../helpers/nostr/events";
import useUserLists from "../../hooks/use-user-lists";

function ListsPage() {
  const account = useCurrentAccount()!;
  const events = useUserLists(account.pubkey);

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
