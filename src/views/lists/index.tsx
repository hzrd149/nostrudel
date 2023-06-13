import { Box, Button, Divider, Flex } from "@chakra-ui/react";
import { useCurrentAccount } from "../../hooks/use-current-account";
import { useReadRelayUrls } from "../../hooks/use-client-relays";
import useUserLists from "../../hooks/use-user-lists";
import { Link as RouterLink } from "react-router-dom";
import { PlusCircleIcon } from "../../components/icons";

function UsersLists() {
  const account = useCurrentAccount()!;

  const readRelays = useReadRelayUrls();
  const lists = useUserLists(account.pubkey, readRelays, true);

  return (
    <>
      {Array.from(Object.entries(lists)).map(([name, list]) => (
        <Button key={name} as={RouterLink} to={`./${list.getAddress()}`} isTruncated>
          {name}
        </Button>
      ))}
    </>
  );
}

export default function ListsView() {
  const account = useCurrentAccount();

  return (
    <Flex direction="column" px="2" overflowY="auto" overflowX="hidden" h="full" gap="2">
      {account && (
        <>
          <UsersLists />
          <Divider />
          <Button leftIcon={<PlusCircleIcon />}>New List</Button>
        </>
      )}
    </Flex>
  );
}
