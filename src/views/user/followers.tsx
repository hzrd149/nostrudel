import AutoSizer from "react-virtualized-auto-sizer";
import { Box, Flex, Spinner } from "@chakra-ui/react";
import { useOutletContext } from "react-router-dom";
import { FixedSizeList, ListChildComponentProps } from "react-window";

import { UserCard } from "./components/user-card";
import { useUserFollowers } from "../../hooks/use-user-followers";
import { useAdditionalRelayContext } from "../../providers/additional-relay-context";
import { useReadRelayUrls } from "../../hooks/use-client-relays";

function FollowerItem({ index, style, data: followers }: ListChildComponentProps<string[]>) {
  const pubkey = followers[index];

  return (
    <div style={style}>
      <UserCard key={pubkey + index} pubkey={pubkey} />
    </div>
  );
}

const UserFollowersTab = () => {
  const { pubkey } = useOutletContext() as { pubkey: string };

  const relays = useReadRelayUrls(useAdditionalRelayContext());
  const followers = useUserFollowers(pubkey, relays, true);

  return (
    <Flex gap="2" direction="column" overflowY="auto" p="2" h="full">
      {followers ? (
        <Box flex={1}>
          <AutoSizer disableWidth>
            {({ height }: { height: number }) => (
              <FixedSizeList
                itemCount={followers.length}
                itemData={followers}
                itemSize={70}
                itemKey={(i, d) => d[i]}
                width="100%"
                height={height}
                overscanCount={10}
              >
                {FollowerItem}
              </FixedSizeList>
            )}
          </AutoSizer>
        </Box>
      ) : (
        <Spinner />
      )}
    </Flex>
  );
};

export default UserFollowersTab;
