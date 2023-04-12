import { Flex, FormControl, FormLabel, Grid, SkeletonText, Switch, useDisclosure } from "@chakra-ui/react";

import { UserCard } from "./components/user-card";
import { useUserFollowers } from "../../hooks/use-user-followers";
import { useOutletContext } from "react-router-dom";
import { usePaginatedList } from "../../hooks/use-paginated-list";
import { PaginationControls } from "../../components/pagination-controls";
import { useAdditionalRelayContext } from "../../providers/additional-relay-context";
import { useReadRelayUrls } from "../../hooks/use-client-relays";

const UserFollowersTab = () => {
  const { pubkey } = useOutletContext() as { pubkey: string };
  const { isOpen, onToggle } = useDisclosure();
  const contextRelays = useAdditionalRelayContext();
  const relays = useReadRelayUrls(contextRelays);
  const followers = useUserFollowers(pubkey, relays, isOpen);

  const pagination = usePaginatedList(followers ?? [], { pageSize: 3 * 10 });

  return (
    <Flex gap="2" direction="column">
      <FormControl display="flex" alignItems="center">
        <FormLabel htmlFor="fetch-followers" mb="0">
          Fetch Followers
        </FormLabel>
        <Switch id="fetch-followers" isChecked={isOpen} onChange={onToggle} />
      </FormControl>
      {followers ? (
        <>
          <Grid templateColumns={{ base: "1fr", xl: "repeat(2, 1fr)", "2xl": "repeat(3, 1fr)" }} gap="2">
            {pagination.pageItems.map((pubkey) => (
              <UserCard key={pubkey} pubkey={pubkey} />
            ))}
          </Grid>
          <PaginationControls {...pagination} buttonSize="sm" />
        </>
      ) : (
        <SkeletonText />
      )}
    </Flex>
  );
};

export default UserFollowersTab;
