import { Button, Flex, Text, useDisclosure } from "@chakra-ui/react";

import UserAvatarLink from "../../../../components/user-avatar-link";
import UserLink from "../../../../components/user-link";
import { NoteContents } from "../../../../components/note/text-note-contents";
import { NostrEvent } from "../../../../types/nostr-event";

export default function TranslationResult({ result }: { result: NostrEvent }) {
  const content = useDisclosure();

  return (
    <>
      <Flex gap="2" alignItems="center" grow={1} wrap="wrap">
        <UserAvatarLink pubkey={result.pubkey} size="sm" />
        <UserLink pubkey={result.pubkey} fontWeight="bold" />
        <Text>Translated Note</Text>
        <Button size="sm" onClick={content.onToggle}>
          {content.isOpen ? "Hide" : "Show"} Content
        </Button>
      </Flex>
      {content.isOpen && <NoteContents event={result} />}
    </>
  );
}
