import { useEffect, useState } from "react";
import { NostrRequest } from "../../classes/nostr-request";
import { useReadRelayUrls } from "../../hooks/use-client-relays";
import { NostrEvent } from "../../types/nostr-event";
import EmbeddedNote from "../embeded-note";
import { NoteLink } from "../note-link";

const QuoteNote = ({ noteId, relay }: { noteId: string; relay?: string }) => {
  const relays = useReadRelayUrls(relay ? [relay] : []);

  const [event, setEvent] = useState<NostrEvent>();

  useEffect(() => {
    if (!noteId || relays.length === 0) return;
    const request = new NostrRequest(relays);
    request.onEvent.subscribe((e) => setEvent(e));
    request.start({ ids: [noteId] });
    return () => {
      request.complete();
    };
  }, [noteId, relays.join("|")]);

  return event ? <EmbeddedNote note={event} /> : <NoteLink noteId={noteId} />;
};

export default QuoteNote;
