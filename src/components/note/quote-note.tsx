import { useReadRelayUrls } from "../../hooks/use-client-relays";
import { NoteLink } from "../note-link";

const QuoteNote = ({ noteId, relay }: { noteId: string; relay?: string }) => {
  const relays = useReadRelayUrls(relay ? [relay] : []);

  return <NoteLink noteId={noteId} />;
};

export default QuoteNote;
