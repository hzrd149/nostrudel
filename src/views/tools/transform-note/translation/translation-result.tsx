import { Button, Flex, Text, useDisclosure } from "@chakra-ui/react";

import UserAvatarLink from "../../../../components/user/user-avatar-link";
import UserLink from "../../../../components/user/user-link";
import { NostrEvent } from "nostr-tools";
import TextNoteContents from "../../../../components/note/timeline-note/text-note-contents";
import { ContentSettingsProvider } from "../../../../providers/local/content-settings";
import DebugEventButton from "../../../../components/debug-modal/debug-event-button";

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
        <DebugEventButton ml="auto" event={result} size="sm" variant="ghost" />
      </Flex>
      {content.isOpen && (
        <ContentSettingsProvider blurMedia={false}>
          <TextNoteContents event={result} />
        </ContentSettingsProvider>
      )}
    </>
  );
}
