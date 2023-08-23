import { useReadRelayUrls } from "../../hooks/use-client-relays";
import useSingleEvent from "../../hooks/use-single-event";
import EmbeddedNote from "./embedded-note";
import { NoteLink } from "../note-link";

const QuoteNote = ({ noteId, relays }: { noteId: string; relays?: string[] }) => {
  const readRelays = useReadRelayUrls(relays);
  const { event, loading } = useSingleEvent(noteId, readRelays);

  return event ? <EmbeddedNote event={event} /> : <NoteLink noteId={noteId} />;
};

export default QuoteNote;
