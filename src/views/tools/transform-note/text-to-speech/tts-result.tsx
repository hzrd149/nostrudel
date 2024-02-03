import { Flex, Text } from "@chakra-ui/react";

import UserAvatarLink from "../../../../components/user-avatar-link";
import UserLink from "../../../../components/user-link";
import { NostrEvent } from "../../../../types/nostr-event";

export default function TextToSpeechResult({ result }: { result: NostrEvent }) {
  return (
    <>
      <Flex gap="2" alignItems="center" grow={1}>
        <UserAvatarLink pubkey={result.pubkey} size="sm" />
        <UserLink pubkey={result.pubkey} fontWeight="bold" />
        <Text>Finished job</Text>
      </Flex>
      <audio src={result.content} controls />
    </>
  );
}
