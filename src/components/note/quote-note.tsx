import { useReadRelayUrls } from "../../hooks/use-client-relays";
import useSingleEvent from "../../hooks/use-single-event";
import EmbeddedNote from "./embeded-note";
import { NoteLink } from "../note-link";

const QuoteNote = ({ noteId, relay }: { noteId: string; relay?: string }) => {
  const relays = useReadRelayUrls(relay ? [relay] : []);
  const { event, loading } = useSingleEvent(noteId, relays);

  return event ? <EmbeddedNote note={event} /> : <NoteLink noteId={noteId} />;
};

export default QuoteNote;
