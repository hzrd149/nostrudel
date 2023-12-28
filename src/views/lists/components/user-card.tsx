import { Button, Card, CardBody, CardProps, Flex, Heading, Link } from "@chakra-ui/react";
import { Link as RouterLink } from "react-router-dom";
import { nip19 } from "nostr-tools";

import { useUserMetadata } from "../../../hooks/use-user-metadata";
import { getUserDisplayName } from "../../../helpers/user-metadata";
import UserAvatar from "../../../components/user-avatar";
import { UserDnsIdentityIcon } from "../../../components/user-dns-identity-icon";
import { NostrEvent } from "../../../types/nostr-event";
import useAsyncErrorHandler from "../../../hooks/use-async-error-handler";
import { listRemovePerson } from "../../../helpers/nostr/lists";
import { useSigningContext } from "../../../providers/global/signing-provider";
import NostrPublishAction from "../../../classes/nostr-publish-action";
import clientRelaysService from "../../../services/client-relays";
import useCurrentAccount from "../../../hooks/use-current-account";
import { UserFollowButton } from "../../../components/user-follow-button";

export type UserCardProps = { pubkey: string; relay?: string; list: NostrEvent } & Omit<CardProps, "children">;

export default function UserCard({ pubkey, relay, list, ...props }: UserCardProps) {
  const account = useCurrentAccount();
  const metadata = useUserMetadata(pubkey, relay ? [relay] : []);
  const { requestSignature } = useSigningContext();

  const handleRemoveFromList = useAsyncErrorHandler(async () => {
    const draft = listRemovePerson(list, pubkey);
    const signed = await requestSignature(draft);
    const pub = new NostrPublishAction("Remove from list", clientRelaysService.getWriteUrls(), signed);
  }, [list, requestSignature]);

  return (
    <Card>
      <CardBody p="2" display="flex" alignItems="center" overflow="hidden" gap="2">
        <UserAvatar pubkey={pubkey} />
        <Flex direction="column" flex={1} overflow="hidden">
          <Link as={RouterLink} to={`/u/${nip19.npubEncode(pubkey)}`}>
            <Heading size="sm" whiteSpace="nowrap" isTruncated>
              {getUserDisplayName(metadata, pubkey)}
            </Heading>
          </Link>
          <UserDnsIdentityIcon pubkey={pubkey} />
        </Flex>
        {account?.pubkey === list.pubkey ? (
          <Button variant="outline" colorScheme="orange" onClick={handleRemoveFromList} size="sm">
            Remove
          </Button>
        ) : (
          <UserFollowButton pubkey={pubkey} variant="outline" />
        )}
      </CardBody>
    </Card>
  );
}
