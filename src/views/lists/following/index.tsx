import { Box, Card, CardBody, CardProps, Flex, IconButton } from "@chakra-ui/react";
import { useActionHub, useActiveAccount } from "applesauce-react/hooks";
import { ProfilePointer } from "nostr-tools/nip19";
import AutoSizer from "react-virtualized-auto-sizer";
import { FixedSizeList as List, ListChildComponentProps } from "react-window";
import { UnfollowUser } from "applesauce-actions/actions";

import { ErrorBoundary } from "../../../components/error-boundary";
import { TrashIcon } from "../../../components/icons";
import SimpleView from "../../../components/layout/presets/simple-view";
import UserAvatar from "../../../components/user/user-avatar";
import UserDnsIdentity from "../../../components/user/user-dns-identity";
import UserLink from "../../../components/user/user-link";
import useAsyncAction from "../../../hooks/use-async-action";
import { useVirtualListScrollRestore } from "../../../hooks/use-scroll-restore";
import useUserContacts from "../../../hooks/use-user-contacts";
import { usePublishEvent } from "../../../providers/global/publish-provider";

function UserCard({ person, ...props }: { person: ProfilePointer } & Omit<CardProps, "children">) {
  const hub = useActionHub();
  const publish = usePublishEvent();

  const remove = useAsyncAction(async () => {
    await hub.exec(UnfollowUser, person.pubkey).forEach((e) => publish("Unfollow user", e));
  }, [hub, person.pubkey]);

  return (
    <Card {...props}>
      <CardBody p="2" display="flex" alignItems="center" overflow="hidden" gap="2">
        <UserAvatar pubkey={person.pubkey} />
        <Flex direction="column" flex={1} overflow="hidden">
          <UserLink pubkey={person.pubkey} fontWeight="bold" />
          <UserDnsIdentity pubkey={person.pubkey} />
        </Flex>
        <IconButton
          icon={<TrashIcon boxSize={5} />}
          onClick={remove.run}
          isLoading={remove.loading}
          aria-label="Remove from following list"
          variant="ghost"
          colorScheme="red"
        />
      </CardBody>
    </Card>
  );
}

function FollowingRow({ index, style, data }: ListChildComponentProps<Array<ProfilePointer>>) {
  const person = data[index];

  return (
    <Box style={style} pb="2" px="2">
      <ErrorBoundary>
        <UserCard person={person} mx="auto" maxW="6xl" w="full" />
      </ErrorBoundary>
    </Box>
  );
}

function FollowingPage() {
  const account = useActiveAccount()!;
  const scroll = useVirtualListScrollRestore("following");

  const contactsList = useUserContacts(account.pubkey);

  return (
    <SimpleView title="Following" scroll={false} flush>
      <Flex direction="column" flex={1}>
        <AutoSizer>
          {({ height, width }) => (
            <List
              itemCount={contactsList?.length ?? 0}
              itemSize={80} // Adjust based on your UserCard height
              itemData={contactsList}
              width={width}
              height={height}
              {...scroll}
            >
              {FollowingRow}
            </List>
          )}
        </AutoSizer>
      </Flex>
    </SimpleView>
  );
}

export default function FollowingView() {
  return <FollowingPage />;
}
