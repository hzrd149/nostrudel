import { Text } from "@chakra-ui/react";
import { NoteLink } from "../../../components/note/note-link";
import { useReadRelays } from "../../../hooks/use-client-relays";
import useSingleEvent from "../../../hooks/use-single-event";
import TimelineNote from "../../../components/note/timeline-note";

export default function NoteCard({ id, relay }: { id: string; relay?: string }) {
  const readRelays = useReadRelays(relay ? [relay] : []);
  const event = useSingleEvent(id, readRelays);

  return event ? (
    <TimelineNote event={event} />
  ) : (
    <Text>
      Loading <NoteLink noteId={id} />
    </Text>
  );
}
