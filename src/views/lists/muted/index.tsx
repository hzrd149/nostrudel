import { Box, Card, CardBody, CardProps, Flex, IconButton } from "@chakra-ui/react";
import { UnmuteUser } from "applesauce-actions/actions";
import { useActionHub, useActiveAccount } from "applesauce-react/hooks";
import AutoSizer from "react-virtualized-auto-sizer";
import { FixedSizeList as List, ListChildComponentProps } from "react-window";

import { ErrorBoundary } from "../../../components/error-boundary";
import { TrashIcon } from "../../../components/icons";
import SimpleView from "../../../components/layout/presets/simple-view";
import UserAvatar from "../../../components/user/user-avatar";
import UserDnsIdentity from "../../../components/user/user-dns-identity";
import UserLink from "../../../components/user/user-link";
import useAsyncAction from "../../../hooks/use-async-action";
import { useVirtualListScrollRestore } from "../../../hooks/use-scroll-restore";
import useUserMutes from "../../../hooks/use-user-mutes";
import { usePublishEvent } from "../../../providers/global/publish-provider";

function UserCard({ pubkey, ...props }: { pubkey: string } & Omit<CardProps, "children">) {
  const hub = useActionHub();
  const publish = usePublishEvent();

  const remove = useAsyncAction(async () => {
    await hub.exec(UnmuteUser, pubkey).forEach((e) => publish("Unmute user", e));
  }, [hub, pubkey]);

  return (
    <Card {...props}>
      <CardBody p="2" display="flex" alignItems="center" overflow="hidden" gap="2">
        <UserAvatar pubkey={pubkey} />
        <Flex direction="column" flex={1} overflow="hidden">
          <UserLink pubkey={pubkey} fontWeight="bold" />
          <UserDnsIdentity pubkey={pubkey} />
        </Flex>
        <IconButton
          icon={<TrashIcon boxSize={5} />}
          onClick={remove.run}
          isLoading={remove.loading}
          aria-label="Remove from muted list"
          variant="ghost"
          colorScheme="red"
        />
      </CardBody>
    </Card>
  );
}

function MutedRow({ index, style, data }: ListChildComponentProps<Array<string>>) {
  const pubkey = data[index];

  return (
    <Box style={style} pb="2" px="2">
      <ErrorBoundary>
        <UserCard pubkey={pubkey} mx="auto" maxW="6xl" w="full" />
      </ErrorBoundary>
    </Box>
  );
}

function MutedPage() {
  const account = useActiveAccount()!;
  const scroll = useVirtualListScrollRestore("muted");
  const muted = useUserMutes(account.pubkey);

  return (
    <SimpleView title="Muted" scroll={false} flush>
      <Flex direction="column" flex={1}>
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
    </SimpleView>
  );
}

export default function MutedView() {
  return <MutedPage />;
}
