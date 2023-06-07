import { Link as RouterList, useParams } from "react-router-dom";
import { nip19 } from "nostr-tools";
import { useReadRelayUrls } from "../../hooks/use-client-relays";
import useUserLists from "../../hooks/use-user-lists";
import { UserLink } from "../../components/user-link";
import useSubject from "../../hooks/use-subject";
import { Button, Flex, Heading, Link } from "@chakra-ui/react";
import { UserCard } from "../user/components/user-card";
import { ArrowLeftSIcon, ExternalLinkIcon } from "../../components/icons";
import { useCurrentAccount } from "../../hooks/use-current-account";

function useListPointer() {
  const { addr } = useParams() as { addr: string };
  const pointer = nip19.decode(addr);

  switch (pointer.type) {
    case "naddr":
      if (pointer.data.kind !== 30000) throw new Error("Unknown event kind");
      return pointer.data;
    default:
      throw new Error(`Unknown type ${pointer.type}`);
  }
}

export default function ListView() {
  const pointer = useListPointer();
  const account = useCurrentAccount();

  const readRelays = useReadRelayUrls(pointer.relays);
  const lists = useUserLists(pointer.pubkey, readRelays, true);

  const list = lists[pointer.identifier];
  const people = useSubject(list?.people) ?? [];

  if (!list)
    return (
      <>
        Looking for list "{pointer.identifier}" created by <UserLink pubkey={pointer.pubkey} />
      </>
    );

  const isAuthor = account?.pubkey === list.author;

  return (
    <Flex direction="column" px="2" pt="2" pb="8" overflowY="auto" overflowX="hidden" h="full" gap="2">
      <Flex gap="2" alignItems="center">
        <Button as={RouterList} to="/lists" leftIcon={<ArrowLeftSIcon />}>
          Back
        </Button>

        <Heading size="md" flex={1} isTruncated>
          {list.name}
        </Heading>

        {isAuthor && <Button colorScheme="red">Delete</Button>}
        <Button
          as={Link}
          href={`https://listr.lol/a/${list.getAddress()}`}
          target="_blank"
          leftIcon={<ExternalLinkIcon />}
        >
          Edit
        </Button>
      </Flex>
      {people.map(({ pubkey, relay }) => (
        <UserCard pubkey={pubkey} relay={relay} />
      ))}
    </Flex>
  );
}
