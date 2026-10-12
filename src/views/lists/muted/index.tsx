import { Box, Flex } from "@chakra-ui/react";
import { useActiveAccount, useEventModel } from "applesauce-react/hooks";
import AutoSizer from "react-virtualized-auto-sizer";
import { FixedSizeList as List, ListChildComponentProps } from "react-window";

import { ErrorBoundary } from "../../../components/error-boundary";
import SimpleView from "../../../components/layout/presets/simple-view";
import { useVirtualListScrollRestore } from "../../../hooks/use-scroll-restore";
import useUserMuteList from "../../../hooks/use-user-mute-list";
import { PublicMutesQuery } from "../../../models/mutes";
import ListMenu from "../components/list-menu";
import MutedUserCard from "./components/muted-user-card";
import PrivateMutesSection from "./components/private-mutes-section";

function MutedRow({ index, style, data }: ListChildComponentProps<Array<string>>) {
  const pubkey = data[index];

  return (
    <Box style={style} pb="2" px="2">
      <ErrorBoundary>
        <MutedUserCard pubkey={pubkey} hidden={false} mx="auto" maxW="6xl" w="full" />
      </ErrorBoundary>
    </Box>
  );
}

function MutedPage() {
  const account = useActiveAccount()!;
  const scroll = useVirtualListScrollRestore("muted");
  // Public-only source (not the merged MutesQuery): the merged model returns public and hidden
  // pubkeys together once unlocked, which would put private entries in this list where Remove
  // would call UnmuteUser without the hidden flag and silently publish an unchanged list (D-13).
  // Sourcing from PublicMutesQuery also makes every row's half known by construction.
  const muted = useEventModel(PublicMutesQuery, [account.pubkey]);
  const muteListEvent = useUserMuteList(account.pubkey);

  return (
    <SimpleView
      title="Muted"
      scroll={false}
      flush
      actions={muteListEvent && <ListMenu ms="auto" list={muteListEvent} aria-label="List options" variant="ghost" />}
    >
      <Flex direction="column" flex={1} minH={0}>
        <AutoSizer>
          {({ height, width }) => (
            <List
              itemCount={muted?.pubkeys?.size ?? 0}
              itemSize={80} // Adjust based on your UserCard height
              itemData={Array.from(muted?.pubkeys ?? [])}
              width={width}
              height={height}
              {...scroll}
            >
              {MutedRow}
            </List>
          )}
        </AutoSizer>
      </Flex>

      <PrivateMutesSection pubkey={account.pubkey} />
    </SimpleView>
  );
}

export default function MutedView() {
  return <MutedPage />;
}
