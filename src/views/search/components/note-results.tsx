import { useMemo } from "react";
import { NostrEvent } from "nostr-tools";
import { Button, Flex, Heading, useDisclosure } from "@chakra-ui/react";

import { TimelineNote } from "../../../components/timeline/note";

const MAX_NOTES = 4;

export default function NoteSearchResults({ notes }: { notes: NostrEvent[] }) {
  const more = useDisclosure();

  const filtered = useMemo(() => (more.isOpen ? notes : Array.from(notes).slice(0, MAX_NOTES)), [notes, more.isOpen]);

  return (
    <>
      <Flex justifyContent="space-between" gap="2" alignItems="flex-end">
        <Heading size="md">Notes ({notes.length})</Heading>
        {notes.length > MAX_NOTES && (
          <Button size="sm" variant="ghost" onClick={more.onToggle}>
            Show {more.isOpen ? "less" : "all"}
          </Button>
        )}
      </Flex>
      {filtered.map((note) => (
        <TimelineNote key={note.id} event={note} />
      ))}
      {!more.isOpen && notes.length > MAX_NOTES && (
        <Button mx="auto" size="lg" variant="ghost" onClick={more.onOpen} px="10">
          Show all
        </Button>
      )}
    </>
  );
}
