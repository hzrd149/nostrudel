import { Box, Flex, Spinner } from "@chakra-ui/react";
import { useOutletContext } from "react-router-dom";
import AutoSizer from "react-virtualized-auto-sizer";
import { FixedSizeList, ListChildComponentProps } from "react-window";

import { UserCard } from "./components/user-card";
import { useUserContacts } from "../../hooks/use-user-contacts";
import { useAdditionalRelayContext } from "../../providers/additional-relay-context";
import { UserContacts } from "../../services/user-contacts";

function ContactItem({ index, style, data: contacts }: ListChildComponentProps<UserContacts>) {
  const pubkey = contacts.contacts[index];

  return (
    <div style={style}>
      <UserCard key={pubkey + index} pubkey={pubkey} relay={contacts.contactRelay[pubkey]} />
    </div>
  );
}

export default function UserFollowingTab() {
  const { pubkey } = useOutletContext() as { pubkey: string };
  const contextRelays = useAdditionalRelayContext();
  const contacts = useUserContacts(pubkey, contextRelays, true);

  return (
    <Flex gap="2" direction="column" p="2" h="90vh">
      {contacts ? (
        <Box flex={1}>
          <AutoSizer disableWidth>
            {({ height }: { height: number }) => (
              <FixedSizeList
                itemCount={contacts.contacts.length}
                itemData={contacts}
                itemSize={70}
                itemKey={(i, d) => d.contacts[i]}
                width="100%"
                height={height}
                overscanCount={10}
              >
                {ContactItem}
              </FixedSizeList>
            )}
          </AutoSizer>
        </Box>
      ) : (
        <Spinner />
      )}
    </Flex>
  );
}
