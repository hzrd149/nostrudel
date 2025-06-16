import { Flex, Spacer, Spinner, Tab, TabList, TabPanel, TabPanels, Tabs } from "@chakra-ui/react";

import useParamsEventPointer from "../../../hooks/use-params-event-pointer";
import { NostrEvent } from "nostr-tools";
import useSingleEvent from "../../../hooks/use-single-event";
import { NoteTranslationsPage } from "./translation";
import UserAvatarLink from "../../../components/user/user-avatar-link";
import UserDnsIdentity from "../../../components/user/user-dns-identity";
import UserLink from "../../../components/user/user-link";
import NoteTextToSpeechPage from "./text-to-speech";
import useRouteSearchValue from "../../../hooks/use-route-search-value";
import NoteMenu from "../../../components/note/note-menu";
import TextNoteContents from "../../../components/note/timeline-note/text-note-contents";

const tabs = ["original", "translation", "tts"];

function TransformNotePage({ note }: { note: NostrEvent }) {
  const tab = useRouteSearchValue("tab", "original");
  const tabProps = { px: "2", pt: "2", pb: "10", display: "flex", flexDirection: "column", gap: "2" } as const;

  return (
    <Tabs
      colorScheme="primary"
      isLazy
      index={tab ? tabs.indexOf(tab.value) : 0}
      onChange={(v) => tab.setValue(tabs[v])}
    >
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
            <UserDnsIdentity pubkey={note.pubkey} onlyIcon />
            <Spacer />
            <NoteMenu event={note} aria-label="Note Options" />
          </Flex>

          <TextNoteContents event={note} />
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
  const event = useSingleEvent(pointer);

  return event ? <TransformNotePage note={event} /> : <Spinner />;
}
