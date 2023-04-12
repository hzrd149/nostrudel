import moment from "moment";
import { Flex, Grid, SkeletonText } from "@chakra-ui/react";

import { UserCard } from "./components/user-card";
import { useUserContacts } from "../../hooks/use-user-contacts";
import { useOutletContext } from "react-router-dom";
import { usePaginatedList } from "../../hooks/use-paginated-list";
import { PaginationControls } from "../../components/pagination-controls";
import { useAdditionalRelayContext } from "../../providers/additional-relay-context";

const UserFollowingTab = () => {
  const { pubkey } = useOutletContext() as { pubkey: string };
  const contextRelays = useAdditionalRelayContext();
  const contacts = useUserContacts(pubkey, contextRelays, true);

  const pagination = usePaginatedList(contacts?.contacts ?? [], { pageSize: 3 * 10 });

  return (
    <Flex gap="2" direction="column">
      {contacts ? (
        <>
          <Grid templateColumns={{ base: "1fr", xl: "repeat(2, 1fr)", "2xl": "repeat(3, 1fr)" }} gap="2">
            {pagination.pageItems.map((pubkey, i) => (
              <UserCard key={pubkey + i} pubkey={pubkey} relay={contacts.contactRelay[pubkey]} />
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

export default UserFollowingTab;
