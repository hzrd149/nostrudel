import { Button, Flex, Heading, SimpleGrid, useDisclosure } from "@chakra-ui/react";
import { encodeGroupPointer } from "applesauce-core/helpers/groups";

import { useAdditionalRelayContext } from "../../../providers/local/additional-relay-context";
import { ErrorBoundary } from "../../../components/error-boundary";
import { useBreakpointValue } from "../../../providers/global/breakpoint-provider";
import useUserGroupsList from "../../../hooks/use-user-groups-list";
import RouterLink from "../../../components/router-link";

export default function UserJoinedGroups({ pubkey }: { pubkey: string }) {
  const contextRelays = useAdditionalRelayContext();
  const { pointers: groups } = useUserGroupsList(pubkey, contextRelays);
  const columns = useBreakpointValue({ base: 1, lg: 2, xl: 3 }) ?? 1;
  const showAll = useDisclosure();

  if (groups.length === 0) return null;

  return (
    <Flex direction="column" px="2">
      <Heading size="md" my="2">
        Joined Groups ({groups.length})
      </Heading>
      <SimpleGrid spacing="4" columns={columns}>
        {(showAll.isOpen ? groups : groups.slice(0, columns * 2)).map((pointer) => (
          <ErrorBoundary key={pointer.id}>
            <Button as={RouterLink} to={`/groups/${encodeGroupPointer(pointer)}`}>
              {encodeGroupPointer(pointer)}
            </Button>
          </ErrorBoundary>
        ))}
      </SimpleGrid>
      {!showAll.isOpen && groups.length > columns * 2 && (
        <Button variant="link" pt="4" onClick={showAll.onOpen}>
          Show All
        </Button>
      )}
    </Flex>
  );
}
