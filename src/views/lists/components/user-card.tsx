import { Button, Card, CardBody, CardProps, Flex } from "@chakra-ui/react";
import { removePubkeyTag } from "applesauce-factory/operations/tag";

import { useActiveAccount, useEventFactory } from "applesauce-react/hooks";
import { NostrEvent } from "nostr-tools";
import UserAvatar from "../../../components/user/user-avatar";
import UserDnsIdentity from "../../../components/user/user-dns-identity";
import { SimpleUserFollowButton } from "../../../components/user/user-follow-button";
import UserLink from "../../../components/user/user-link";
import useAsyncAction from "../../../hooks/use-async-action";
import { usePublishEvent } from "../../../providers/global/publish-provider";

export type UserCardProps = { pubkey: string; relay?: string; list: NostrEvent } & Omit<CardProps, "children">;

export default function UserCard({ pubkey, relay, list, ...props }: UserCardProps) {
  const account = useActiveAccount();
  const publish = usePublishEvent();
  const factory = useEventFactory();

  const remove = useAsyncAction(async () => {
    const draft = await factory.modifyTags(list, removePubkeyTag(pubkey));
    const signed = await factory.sign(draft);
    await publish("Remove from list", signed);
  }, [list, publish]);

  return (
    <Card {...props}>
      <CardBody p="2" display="flex" alignItems="center" overflow="hidden" gap="2">
        <UserAvatar pubkey={pubkey} />
        <Flex direction="column" flex={1} overflow="hidden">
          <UserLink isTruncated pubkey={pubkey} />
          <UserDnsIdentity pubkey={pubkey} />
        </Flex>
        {account?.pubkey === list.pubkey ? (
          <Button variant="outline" colorScheme="orange" onClick={remove.run} isLoading={remove.loading} size="sm">
            Remove
          </Button>
        ) : (
          <SimpleUserFollowButton pubkey={pubkey} variant="outline" />
        )}
      </CardBody>
    </Card>
  );
}
