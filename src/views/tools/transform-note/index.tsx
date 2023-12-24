import { Flex, Spacer, Spinner, Tab, TabList, TabPanel, TabPanels, Tabs } from "@chakra-ui/react";

import useParamsEventPointer from "../../../hooks/use-params-event-pointer";
import { NostrEvent } from "../../../types/nostr-event";
import useSingleEvent from "../../../hooks/use-single-event";
import { NoteTranslationsPage } from "./translation";
import { NoteContents } from "../../../components/note/text-note-contents";
import UserAvatarLink from "../../../components/user-avatar-link";
import { UserDnsIdentityIcon } from "../../../components/user-dns-identity-icon";
import UserLink from "../../../components/user-link";
import NoteMenu from "../../../components/note/note-menu";
import NoteTextToSpeechPage from "./text-to-speech";

function TransformNotePage({ note }: { note: NostrEvent }) {
  const tabProps = { px: "2", pt: "2", pb: "10", display: "flex", flexDirection: "column", gap: "2" } as const;

  return (
    <Tabs colorScheme="primary" isLazy>
      <TabList>
        <Tab>Original</Tab>
        <Tab>Translation</Tab>
        <Tab>Text to speech</Tab>
      </TabList>

      <TabPanels>
        <TabPanel {...tabProps}>
          <Flex gap="2" alignItems="center">
            <UserAvatarLink pubkey={note.pubkey} size={["xs", "sm"]} />
            <UserLink pubkey={note.pubkey} isTruncated fontWeight="bold" fontSize="lg" />
            <UserDnsIdentityIcon pubkey={note.pubkey} onlyIcon />
            <Spacer />
            <NoteMenu event={note} aria-label="Note Options" />
          </Flex>

          <NoteContents event={note} />
        </TabPanel>
        <TabPanel {...tabProps}>
          <NoteTranslationsPage note={note} />
        </TabPanel>
        <TabPanel {...tabProps}>
          <NoteTextToSpeechPage note={note} />
        </TabPanel>
      </TabPanels>
    </Tabs>
  );
}

export default function TransformNoteView() {
  const pointer = useParamsEventPointer("id");
  const event = useSingleEvent(pointer.id, pointer.relays);

  return event ? <TransformNotePage note={event} /> : <Spinner />;
}
