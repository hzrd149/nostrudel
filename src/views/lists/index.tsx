import { Button, Divider, Flex, Heading, Image, Link, Spacer } from "@chakra-ui/react";
import { useCurrentAccount } from "../../hooks/use-current-account";
import { useReadRelayUrls } from "../../hooks/use-client-relays";
import useUserLists from "../../hooks/use-user-lists";
import { Link as RouterLink } from "react-router-dom";
import { ExternalLinkIcon, PlusCircleIcon } from "../../components/icons";
import { useIsMobile } from "../../hooks/use-is-mobile";
import RequireCurrentAccount from "../../providers/require-current-account";

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

function ListsPage() {
  return (
    <Flex direction="column" p="2" overflowY="auto" overflowX="hidden" h="full" gap="2">
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

      <UsersLists />
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
