import { memo } from "react";
import { Box, Flex, Text } from "@chakra-ui/react";

import { ThreadItem } from "../../../../helpers/thread";
import { ParsedZap } from "../../../../helpers/nostr/zaps";
import UserAvatarLink from "../../../../components/user/user-avatar-link";
import UserLink from "../../../../components/user/user-link";
import Timestamp from "../../../../components/timestamp";
import { LightningIcon } from "../../../../components/icons";
import { readablizeSats } from "../../../../helpers/bolt11";

const ZapEvent = memo(({ zap }: { zap: ParsedZap }) => {
  if (!zap.payment.amount) return null;

  return (
    <>
      <Flex gap="2">
        <UserAvatarLink pubkey={zap.request.pubkey} size="sm" />
        <Box>
          <UserLink pubkey={zap.request.pubkey} fontWeight="bold" />
          <Text>
            <LightningIcon color="yellow.500" /> {readablizeSats(zap.payment.amount / 1000)}
          </Text>
        </Box>
        <Timestamp timestamp={zap.event.created_at} />
      </Flex>
      {zap.request.content && <Text>{zap.request.content}</Text>}
    </>
  );
});

export default function PostZapsTab({ post, zaps }: { post: ThreadItem; zaps: ParsedZap[] }) {
  return (
    <Flex px="2" direction="column" gap="2" mb="2">
      {zaps.map((zap) => (
        <ZapEvent key={zap.event.id} zap={zap} />
      ))}
    </Flex>
  );
}
