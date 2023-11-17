import { Button, Flex, Heading, SimpleGrid, useDisclosure } from "@chakra-ui/react";

import { useAdditionalRelayContext } from "../../../providers/additional-relay-context";
import useUserCommunitiesList from "../../../hooks/use-user-communities-list";
import { PointerCommunityCard } from "../../communities/components/community-card";
import { ErrorBoundary } from "../../../components/error-boundary";
import { useBreakpointValue } from "../../../providers/breakpoint-provider";

export default function UserJoinedCommunities({ pubkey }: { pubkey: string }) {
  const contextRelays = useAdditionalRelayContext();
  const { pointers: communities } = useUserCommunitiesList(pubkey, contextRelays, { alwaysRequest: true });
  const columns = useBreakpointValue({ base: 1, lg: 2, xl: 3 }) ?? 1;
  const showAllCommunities = useDisclosure();

  if (communities.length === 0) return null;

  return (
    <Flex direction="column" px="2">
      <Heading size="md" my="2">
        Joined Communities ({communities.length})
      </Heading>
      <SimpleGrid spacing="4" columns={columns}>
        {(showAllCommunities.isOpen ? communities : communities.slice(0, columns * 2)).map((pointer) => (
          <ErrorBoundary key={pointer.identifier + pointer.pubkey}>
            <PointerCommunityCard pointer={pointer} />
          </ErrorBoundary>
        ))}
      </SimpleGrid>
      {!showAllCommunities.isOpen && communities.length > columns * 2 && (
        <Button variant="link" pt="4" onClick={showAllCommunities.onOpen}>
          Show All
        </Button>
      )}
    </Flex>
  );
}
