import { Card, CardBody, CardProps, Flex, IconButton } from "@chakra-ui/react";
import { UnmuteUser } from "applesauce-actions/actions";
import { useActionRunner } from "applesauce-react/hooks";

import { TrashIcon } from "../../../../components/icons";
import UserAvatar from "../../../../components/user/user-avatar";
import UserDnsIdentity from "../../../../components/user/user-dns-identity";
import UserLink from "../../../../components/user/user-link";
import useAsyncAction from "../../../../hooks/use-async-action";
import { usePublishEvent } from "../../../../providers/global/publish-provider";

/**
 * A single row in the Muted view, shared by the public list and the Private section. `hidden` is
 * passed by the section that renders the row (never detected here) since each section's data
 * source already knows which half the pubkey came from.
 */
export default function MutedUserCard({
  pubkey,
  hidden,
  ...props
}: { pubkey: string; hidden: boolean } & Omit<CardProps, "children">) {
  const hub = useActionRunner();
  const publish = usePublishEvent();

  const remove = useAsyncAction(async () => {
    await hub.exec(UnmuteUser, pubkey, hidden).forEach((e) => publish("Unmute user", e));
  }, [hub, pubkey, hidden]);

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
