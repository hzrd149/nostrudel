import { Text } from "@chakra-ui/react";
import { Note } from "../../../components/note";
import { NoteLink } from "../../../components/note-link";
import { useReadRelayUrls } from "../../../hooks/use-client-relays";
import useSingleEvent from "../../../hooks/use-single-event";

export default function NoteCard({ id, relay }: { id: string; relay?: string }) {
  const readRelays = useReadRelayUrls(relay ? [relay] : []);
  const event = useSingleEvent(id, readRelays);

  return event ? (
    <Note event={event} />
  ) : (
    <Text>
      Loading <NoteLink noteId={id} />
    </Text>
  );
}
